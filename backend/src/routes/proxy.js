const express = require('express');
const axios = require('axios');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateApiKey } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/proxy/provider/{providerId}/{endpoint}:
 *   get:
 *     summary: Proxy to API Provider endpoint
 *     tags: [Proxy]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *         description: API Provider ID
 *       - in: path
 *         name: endpoint
 *         required: true
 *         schema:
 *           type: string
 *         description: Endpoint path (e.g., todos, posts/1, users)
 *     responses:
 *       200:
 *         description: Data from API Provider
 */
router.get('/provider/:providerId/*', authenticateApiKey, asyncHandler(async (req, res) => {
  const { providerId } = req.params;
  const endpointPath = req.params[0]; // Get the wildcard part
  const startTime = Date.now();

  try {
    // Get API Provider configuration
    const provider = await prisma.aPIProvider.findUnique({
      where: { id: providerId },
      include: {
        endpoints: {
          where: { isActive: true }
        }
      }
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'API Provider not found'
      });
    }

    if (!provider.isActive) {
      return res.status(400).json({
        success: false,
        message: 'API Provider is not active'
      });
    }

    // Find the matching endpoint
    console.log('🔍 Looking for endpoint:', endpointPath);
    console.log('📋 Available endpoints:', provider.endpoints.map(e => `${e.method} ${e.path}`));
    
    let matchingEndpoint = provider.endpoints.find(endpoint => {
      console.log(`🔍 Checking endpoint: ${endpoint.method} ${endpoint.path}`);
      // For exact path matching (without parameters)
      if (endpoint.path === endpointPath && endpoint.method === 'GET') {
        console.log('✅ Exact match found!');
        return true;
      }
      // For path with parameters, convert to regex
      const pattern = endpoint.path.replace(/\{([^}]+)\}/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      const matches = regex.test(endpointPath) && endpoint.method === 'GET';
      console.log(`🔍 Regex match: ${matches} (pattern: ${pattern})`);
      return matches;
    });
    
    // If no match found, try without leading slash
    if (!matchingEndpoint) {
      const endpointPathWithoutSlash = endpointPath.startsWith('/') ? endpointPath.slice(1) : endpointPath;
      console.log('🔍 Trying without leading slash:', endpointPathWithoutSlash);
      
      matchingEndpoint = provider.endpoints.find(endpoint => {
        console.log(`🔍 Checking endpoint: ${endpoint.method} ${endpoint.path}`);
        // Remove leading slash from endpoint path for comparison
        const cleanEndpointPath = endpoint.path.startsWith('/') ? endpoint.path.slice(1) : endpoint.path;
        console.log(`🔍 Comparing: "${cleanEndpointPath}" with "${endpointPathWithoutSlash}"`);
        
        // For exact path matching (without parameters)
        if (cleanEndpointPath === endpointPathWithoutSlash && endpoint.method === 'GET') {
          console.log('✅ Exact match found (without slash)!');
          return true;
        }
        // For path with parameters, convert to regex
        const pattern = cleanEndpointPath.replace(/\{([^}]+)\}/g, '[^/]+');
        const regex = new RegExp(`^${pattern}$`);
        const matches = regex.test(endpointPathWithoutSlash) && endpoint.method === 'GET';
        console.log(`🔍 Regex match: ${matches} (pattern: ${pattern})`);
        return matches;
      });
    }

    if (!matchingEndpoint) {
      return res.status(404).json({
        success: false,
        message: 'Endpoint not found or not supported',
        availableEndpoints: provider.endpoints.map(e => `${e.method} ${e.path}`)
      });
    }

    // Build the full URL
    let fullUrl = provider.baseUrl + '/' + endpointPath;
    
    // Prepare headers
    const headers = {
      'User-Agent': 'API-Manager-Proxy/1.0',
      'Content-Type': 'application/json'
    };

    // Add authentication headers if required
    if (provider.requiresAuth && provider.authConfig) {
      headers[provider.authConfig.headerName] = provider.authConfig.headerValue;
    }

    // Make the request
    const response = await axios({
      method: 'GET',
      url: fullUrl,
      headers,
      timeout: provider.timeout,
      params: req.query
    });

    const responseTime = Date.now() - startTime;

    // Log the API call
    await prisma.apiLog.create({
      data: {
        apiKeyId: req.apiKey?.id,
        endpoint: `/api/proxy/provider/${providerId}/${endpointPath}`,
        method: 'GET',
        statusCode: response.status,
        responseTime,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestBody: null,
        responseBody: response.data
      }
    });

    // Log provider usage
    await prisma.aPIProviderLog.create({
      data: {
        providerId: provider.id,
        endpoint: endpointPath,
        method: 'GET',
        url: fullUrl,
        status: response.status,
        duration: responseTime,
        responseSize: JSON.stringify(response.data).length,
        success: response.status >= 200 && response.status < 300
      }
    });

    // Return the response
    res.json({
      success: true,
      data: response.data,
      metadata: {
        provider: provider.name,
        endpoint: endpointPath,
        responseTime: `${responseTime}ms`,
        proxiedBy: 'API Manager',
        providerId: provider.id
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log the error
    await prisma.apiLog.create({
      data: {
        apiKeyId: req.apiKey?.id,
        endpoint: `/api/proxy/provider/${providerId}/${endpointPath}`,
        method: 'GET',
        statusCode: error.response?.status || 500,
        responseTime,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestBody: null,
        error: error.message
      }
    });

    res.status(error.response?.status || 500).json({
      success: false,
      message: 'API Provider error',
      error: error.response?.data || error.message
    });
  }
}));

/**
 * @swagger
 * /api/proxy/provider/{providerId}/{endpoint}:
 *   post:
 *     summary: Proxy POST to API Provider endpoint
 *     tags: [Proxy]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *         description: API Provider ID
 *       - in: path
 *         name: endpoint
 *         required: true
 *         schema:
 *           type: string
 *         description: Endpoint path
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Data from API Provider
 */
router.post('/provider/:providerId/*', authenticateApiKey, asyncHandler(async (req, res) => {
  const { providerId } = req.params;
  const endpointPath = req.params[0];
  const startTime = Date.now();

  try {
    // Get API Provider configuration
    const provider = await prisma.aPIProvider.findUnique({
      where: { id: providerId },
      include: {
        endpoints: {
          where: { isActive: true }
        }
      }
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'API Provider not found'
      });
    }

    if (!provider.isActive) {
      return res.status(400).json({
        success: false,
        message: 'API Provider is not active'
      });
    }

    // Find the matching endpoint
    const matchingEndpoint = provider.endpoints.find(endpoint => {
      const pattern = endpoint.path.replace(/\{([^}]+)\}/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(endpointPath) && endpoint.method === 'POST';
    });

    if (!matchingEndpoint) {
      return res.status(404).json({
        success: false,
        message: 'Endpoint not found or not supported',
        availableEndpoints: provider.endpoints.map(e => `${e.method} ${e.path}`)
      });
    }

    // Build the full URL
    let fullUrl = provider.baseUrl + '/' + endpointPath;
    
    // Prepare headers
    const headers = {
      'User-Agent': 'API-Manager-Proxy/1.0',
      'Content-Type': 'application/json'
    };

    // Add authentication headers if required
    if (provider.requiresAuth && provider.authConfig) {
      headers[provider.authConfig.headerName] = provider.authConfig.headerValue;
    }

    // Make the request
    const response = await axios({
      method: 'POST',
      url: fullUrl,
      headers,
      timeout: provider.timeout,
      data: req.body
    });

    const responseTime = Date.now() - startTime;

    // Log the API call
    await prisma.apiLog.create({
      data: {
        apiKeyId: req.apiKey?.id,
        endpoint: `/api/proxy/provider/${providerId}/${endpointPath}`,
        method: 'POST',
        statusCode: response.status,
        responseTime,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestBody: req.body,
        responseBody: response.data
      }
    });

    // Log provider usage
    await prisma.aPIProviderLog.create({
      data: {
        providerId: provider.id,
        endpoint: endpointPath,
        method: 'POST',
        url: fullUrl,
        status: response.status,
        duration: responseTime,
        responseSize: JSON.stringify(response.data).length,
        success: response.status >= 200 && response.status < 300
      }
    });

    // Return the response
    res.json({
      success: true,
      data: response.data,
      metadata: {
        provider: provider.name,
        endpoint: endpointPath,
        responseTime: `${responseTime}ms`,
        proxiedBy: 'API Manager',
        providerId: provider.id
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log the error
    await prisma.apiLog.create({
      data: {
        apiKeyId: req.apiKey?.id,
        endpoint: `/api/proxy/provider/${providerId}/${endpointPath}`,
        method: 'POST',
        statusCode: error.response?.status || 500,
        responseTime,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestBody: req.body,
        error: error.message
      }
    });

    res.status(error.response?.status || 500).json({
      success: false,
      message: 'API Provider error',
      error: error.response?.data || error.message
    });
  }
}));

/**
 * @swagger
 * /api/proxy/provider/{providerId}/{endpoint}:
 *   put:
 *     summary: Proxy PUT to API Provider endpoint
 *     tags: [Proxy]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *         description: API Provider ID
 *       - in: path
 *         name: endpoint
 *         required: true
 *         schema:
 *           type: string
 *         description: Endpoint path
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Data from API Provider
 */
router.put('/provider/:providerId/*', authenticateApiKey, asyncHandler(async (req, res) => {
  const { providerId } = req.params;
  const endpointPath = req.params[0];
  const startTime = Date.now();

  try {
    // Get API Provider configuration
    const provider = await prisma.aPIProvider.findUnique({
      where: { id: providerId },
      include: {
        endpoints: {
          where: { isActive: true }
        }
      }
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'API Provider not found'
      });
    }

    if (!provider.isActive) {
      return res.status(400).json({
        success: false,
        message: 'API Provider is not active'
      });
    }

    // Find the matching endpoint
    const matchingEndpoint = provider.endpoints.find(endpoint => {
      const pattern = endpoint.path.replace(/\{([^}]+)\}/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(endpointPath) && endpoint.method === 'PUT';
    });

    if (!matchingEndpoint) {
      return res.status(404).json({
        success: false,
        message: 'Endpoint not found or not supported',
        availableEndpoints: provider.endpoints.map(e => `${e.method} ${e.path}`)
      });
    }

    // Build the full URL
    let fullUrl = provider.baseUrl + '/' + endpointPath;
    
    // Prepare headers
    const headers = {
      'User-Agent': 'API-Manager-Proxy/1.0',
      'Content-Type': 'application/json'
    };

    // Add authentication headers if required
    if (provider.requiresAuth && provider.authConfig) {
      headers[provider.authConfig.headerName] = provider.authConfig.headerValue;
    }

    // Make the request
    const response = await axios({
      method: 'PUT',
      url: fullUrl,
      headers,
      timeout: provider.timeout,
      data: req.body
    });

    const responseTime = Date.now() - startTime;

    // Log the API call
    await prisma.apiLog.create({
      data: {
        apiKeyId: req.apiKey?.id,
        endpoint: `/api/proxy/provider/${providerId}/${endpointPath}`,
        method: 'PUT',
        statusCode: response.status,
        responseTime,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestBody: req.body,
        responseBody: response.data
      }
    });

    // Log provider usage
    await prisma.aPIProviderLog.create({
      data: {
        providerId: provider.id,
        endpoint: endpointPath,
        method: 'PUT',
        url: fullUrl,
        status: response.status,
        duration: responseTime,
        responseSize: JSON.stringify(response.data).length,
        success: response.status >= 200 && response.status < 300
      }
    });

    // Return the response
    res.json({
      success: true,
      data: response.data,
      metadata: {
        provider: provider.name,
        endpoint: endpointPath,
        responseTime: `${responseTime}ms`,
        proxiedBy: 'API Manager',
        providerId: provider.id
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log the error
    await prisma.apiLog.create({
      data: {
        apiKeyId: req.apiKey?.id,
        endpoint: `/api/proxy/provider/${providerId}/${endpointPath}`,
        method: 'PUT',
        statusCode: error.response?.status || 500,
        responseTime,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestBody: req.body,
        error: error.message
      }
    });

    res.status(error.response?.status || 500).json({
      success: false,
      message: 'API Provider error',
      error: error.response?.data || error.message
    });
  }
}));

/**
 * @swagger
 * /api/proxy/provider/{providerId}/{endpoint}:
 *   delete:
 *     summary: Proxy DELETE to API Provider endpoint
 *     tags: [Proxy]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *         description: API Provider ID
 *       - in: path
 *         name: endpoint
 *         required: true
 *         schema:
 *           type: string
 *         description: Endpoint path
 *     responses:
 *       200:
 *         description: Data from API Provider
 */
router.delete('/provider/:providerId/*', authenticateApiKey, asyncHandler(async (req, res) => {
  const { providerId } = req.params;
  const endpointPath = req.params[0];
  const startTime = Date.now();

  try {
    // Get API Provider configuration
    const provider = await prisma.aPIProvider.findUnique({
      where: { id: providerId },
      include: {
        endpoints: {
          where: { isActive: true }
        }
      }
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'API Provider not found'
      });
    }

    if (!provider.isActive) {
      return res.status(400).json({
        success: false,
        message: 'API Provider is not active'
      });
    }

    // Find the matching endpoint
    const matchingEndpoint = provider.endpoints.find(endpoint => {
      const pattern = endpoint.path.replace(/\{([^}]+)\}/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(endpointPath) && endpoint.method === 'DELETE';
    });

    if (!matchingEndpoint) {
      return res.status(404).json({
        success: false,
        message: 'Endpoint not found or not supported',
        availableEndpoints: provider.endpoints.map(e => `${e.method} ${e.path}`)
      });
    }

    // Build the full URL
    let fullUrl = provider.baseUrl + '/' + endpointPath;
    
    // Prepare headers
    const headers = {
      'User-Agent': 'API-Manager-Proxy/1.0',
      'Content-Type': 'application/json'
    };

    // Add authentication headers if required
    if (provider.requiresAuth && provider.authConfig) {
      headers[provider.authConfig.headerName] = provider.authConfig.headerValue;
    }

    // Make the request
    const response = await axios({
      method: 'DELETE',
      url: fullUrl,
      headers,
      timeout: provider.timeout,
      data: req.body
    });

    const responseTime = Date.now() - startTime;

    // Log the API call
    await prisma.apiLog.create({
      data: {
        apiKeyId: req.apiKey?.id,
        endpoint: `/api/proxy/provider/${providerId}/${endpointPath}`,
        method: 'DELETE',
        statusCode: response.status,
        responseTime,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestBody: req.body,
        responseBody: response.data
      }
    });

    // Log provider usage
    await prisma.aPIProviderLog.create({
      data: {
        providerId: provider.id,
        endpoint: endpointPath,
        method: 'DELETE',
        url: fullUrl,
        status: response.status,
        duration: responseTime,
        responseSize: JSON.stringify(response.data).length,
        success: response.status >= 200 && response.status < 300
      }
    });

    // Return the response
    res.json({
      success: true,
      data: response.data,
      metadata: {
        provider: provider.name,
        endpoint: endpointPath,
        responseTime: `${responseTime}ms`,
        proxiedBy: 'API Manager',
        providerId: provider.id
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log the error
    await prisma.apiLog.create({
      data: {
        apiKeyId: req.apiKey?.id,
        endpoint: `/api/proxy/provider/${providerId}/${endpointPath}`,
        method: 'DELETE',
        statusCode: error.response?.status || 500,
        responseTime,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestBody: req.body,
        error: error.message
      }
    });

    res.status(error.response?.status || 500).json({
      success: false,
      message: 'API Provider error',
      error: error.response?.data || error.message
    });
  }
}));

/**
 * @swagger
 * /api/proxy/dynamic/{apiId}:
 *   get:
 *     summary: Dynamic proxy to any registered external API
 *     tags: [Proxy]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: apiId
 *         required: true
 *         schema:
 *           type: string
 *         description: External API ID from database
 *       - in: query
 *         name: params
 *         schema:
 *           type: object
 *         description: Query parameters to pass to external API
 *     responses:
 *       200:
 *         description: Data from external API
 */
router.get('/dynamic/:apiId', authenticateApiKey, asyncHandler(async (req, res) => {
  const { apiId } = req.params;
  const startTime = Date.now();

  try {
    // Get external API configuration from database
    const externalAPI = await prisma.externalAPI.findUnique({
      where: { id: apiId }
    });

    if (!externalAPI) {
      return res.status(404).json({
        success: false,
        message: 'External API not found'
      });
    }

    if (!externalAPI.isActive) {
      return res.status(400).json({
        success: false,
        message: 'External API is not active'
      });
    }

    // Build the full URL
    let fullUrl = externalAPI.baseUrl + externalAPI.endpoint;
    
    // Replace path parameters from query params
    const queryParams = req.query;
    Object.keys(queryParams).forEach(key => {
      fullUrl = fullUrl.replace(`{${key}}`, queryParams[key]);
    });

    // Prepare headers
    const headers = {
      'User-Agent': 'API-Manager-Proxy/1.0',
      'Content-Type': 'application/json'
    };

    // Add authentication headers if required
    if (externalAPI.requiresAuth && externalAPI.authConfig) {
      headers[externalAPI.authConfig.headerName] = externalAPI.authConfig.headerValue;
    }

    // Make the request
    const response = await axios({
      method: externalAPI.method,
      url: fullUrl,
      headers,
      timeout: externalAPI.timeout,
      params: queryParams
    });

    const responseTime = Date.now() - startTime;

    // Log the API call
    await prisma.apiLog.create({
      data: {
        apiKeyId: req.apiKey?.id,
        endpoint: `/api/proxy/dynamic/${apiId}`,
        method: externalAPI.method,
        statusCode: response.status,
        responseTime,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestBody: null,
        responseBody: response.data
      }
    });

    // Log external API usage
    await prisma.externalAPILog.create({
      data: {
        externalAPIId: apiId,
        method: externalAPI.method,
        url: fullUrl,
        status: response.status,
        duration: responseTime,
        responseSize: JSON.stringify(response.data).length,
        success: response.status >= 200 && response.status < 300
      }
    });

    // Return the response
    res.json({
      success: true,
      data: response.data,
      metadata: {
        source: externalAPI.baseUrl,
        apiName: externalAPI.name,
        responseTime: `${responseTime}ms`,
        proxiedBy: 'API Manager',
        externalAPIId: apiId
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log the error
    await prisma.apiLog.create({
      data: {
        apiKeyId: req.apiKey?.id,
        endpoint: `/api/proxy/dynamic/${apiId}`,
        method: 'GET',
        statusCode: error.response?.status || 500,
        responseTime,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestBody: null,
        error: error.message
      }
    });

    res.status(error.response?.status || 500).json({
      success: false,
      message: 'External API error',
      error: error.response?.data || error.message
    });
  }
}));

/**
 * @swagger
 * /api/proxy/dynamic/{apiId}:
 *   post:
 *     summary: Dynamic proxy POST to any registered external API
 *     tags: [Proxy]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: apiId
 *         required: true
 *         schema:
 *           type: string
 *         description: External API ID from database
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Data from external API
 */
router.post('/dynamic/:apiId', authenticateApiKey, asyncHandler(async (req, res) => {
  const { apiId } = req.params;
  const startTime = Date.now();

  try {
    // Get external API configuration from database
    const externalAPI = await prisma.externalAPI.findUnique({
      where: { id: apiId }
    });

    if (!externalAPI) {
      return res.status(404).json({
        success: false,
        message: 'External API not found'
      });
    }

    if (!externalAPI.isActive) {
      return res.status(400).json({
        success: false,
        message: 'External API is not active'
      });
    }

    // Build the full URL
    let fullUrl = externalAPI.baseUrl + externalAPI.endpoint;
    
    // Replace path parameters from request body
    const bodyParams = req.body;
    Object.keys(bodyParams).forEach(key => {
      fullUrl = fullUrl.replace(`{${key}}`, bodyParams[key]);
    });

    // Prepare headers
    const headers = {
      'User-Agent': 'API-Manager-Proxy/1.0',
      'Content-Type': 'application/json'
    };

    // Add authentication headers if required
    if (externalAPI.requiresAuth && externalAPI.authConfig) {
      headers[externalAPI.authConfig.headerName] = externalAPI.authConfig.headerValue;
    }

    // Make the request
    const response = await axios({
      method: externalAPI.method,
      url: fullUrl,
      headers,
      timeout: externalAPI.timeout,
      data: req.body
    });

    const responseTime = Date.now() - startTime;

    // Log the API call
    await prisma.apiLog.create({
      data: {
        apiKeyId: req.apiKey?.id,
        endpoint: `/api/proxy/dynamic/${apiId}`,
        method: externalAPI.method,
        statusCode: response.status,
        responseTime,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestBody: req.body,
        responseBody: response.data
      }
    });

    // Log external API usage
    await prisma.externalAPILog.create({
      data: {
        externalAPIId: apiId,
        method: externalAPI.method,
        url: fullUrl,
        status: response.status,
        duration: responseTime,
        responseSize: JSON.stringify(response.data).length,
        success: response.status >= 200 && response.status < 300
      }
    });

    // Return the response
    res.json({
      success: true,
      data: response.data,
      metadata: {
        source: externalAPI.baseUrl,
        apiName: externalAPI.name,
        responseTime: `${responseTime}ms`,
        proxiedBy: 'API Manager',
        externalAPIId: apiId
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log the error
    await prisma.apiLog.create({
      data: {
        apiKeyId: req.apiKey?.id,
        endpoint: `/api/proxy/dynamic/${apiId}`,
        method: 'POST',
        statusCode: error.response?.status || 500,
        responseTime,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestBody: req.body,
        error: error.message
      }
    });

    res.status(error.response?.status || 500).json({
      success: false,
      message: 'External API error',
      error: error.response?.data || error.message
    });
  }
}));

/**
 * @swagger
 * /api/proxy/jsonplaceholder/todos/{id}:
 *   get:
 *     summary: Proxy to JSONPlaceholder todos API
 *     tags: [Proxy]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Todo data from JSONPlaceholder
 */
router.get('/jsonplaceholder/todos/:id', authenticateApiKey, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const startTime = Date.now();

  try {
    // Forward request to JSONPlaceholder
    const response = await axios.get(`https://jsonplaceholder.typicode.com/todos/${id}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'API-Manager-Proxy/1.0'
      }
    });

    const responseTime = Date.now() - startTime;

    // Log the API call
    await prisma.apiLog.create({
      data: {
        apiKeyId: req.apiKey?.id,
        endpoint: `/api/proxy/jsonplaceholder/todos/${id}`,
        method: 'GET',
        statusCode: response.status,
        responseTime,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestBody: null,
        responseBody: response.data
      }
    });

    // Return the response
    res.json({
      success: true,
      data: response.data,
      metadata: {
        source: 'jsonplaceholder.typicode.com',
        responseTime: `${responseTime}ms`,
        proxiedBy: 'API Manager'
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log the error
    await prisma.apiLog.create({
      data: {
        apiKeyId: req.apiKey?.id,
        endpoint: `/api/proxy/jsonplaceholder/todos/${id}`,
        method: 'GET',
        statusCode: error.response?.status || 500,
        responseTime,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestBody: null,
        error: error.message
      }
    });

    res.status(error.response?.status || 500).json({
      success: false,
      message: 'External API error',
      error: error.response?.data || error.message
    });
  }
}));

/**
 * @swagger
 * /api/proxy/jsonplaceholder/todos:
 *   get:
 *     summary: Proxy to JSONPlaceholder todos list API
 *     tags: [Proxy]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: _limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: _start
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Todos list from JSONPlaceholder
 */
router.get('/jsonplaceholder/todos', authenticateApiKey, asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const queryParams = new URLSearchParams(req.query).toString();

  try {
    // Forward request to JSONPlaceholder
    const response = await axios.get(`https://jsonplaceholder.typicode.com/todos?${queryParams}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'API-Manager-Proxy/1.0'
      }
    });

    const responseTime = Date.now() - startTime;

    // Log the API call
    await prisma.apiLog.create({
      data: {
        apiKeyId: req.apiKey?.id,
        endpoint: `/api/proxy/jsonplaceholder/todos`,
        method: 'GET',
        statusCode: response.status,
        responseTime,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestBody: null,
        responseBody: response.data
      }
    });

    // Return the response
    res.json({
      success: true,
      data: response.data,
      metadata: {
        source: 'jsonplaceholder.typicode.com',
        responseTime: `${responseTime}ms`,
        proxiedBy: 'API Manager',
        totalItems: response.data.length
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log the error
    await prisma.apiLog.create({
      data: {
        apiKeyId: req.apiKey?.id,
        endpoint: `/api/proxy/jsonplaceholder/todos`,
        method: 'GET',
        statusCode: error.response?.status || 500,
        responseTime,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestBody: null,
        error: error.message
      }
    });

    res.status(error.response?.status || 500).json({
      success: false,
      message: 'External API error',
      error: error.response?.data || error.message
    });
  }
}));

/**
 * @swagger
 * /api/proxy/jsonplaceholder/posts/{id}:
 *   get:
 *     summary: Proxy to JSONPlaceholder posts API
 *     tags: [Proxy]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Post data from JSONPlaceholder
 */
router.get('/jsonplaceholder/posts/:id', authenticateApiKey, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const startTime = Date.now();

  try {
    // Forward request to JSONPlaceholder
    const response = await axios.get(`https://jsonplaceholder.typicode.com/posts/${id}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'API-Manager-Proxy/1.0'
      }
    });

    const responseTime = Date.now() - startTime;

    // Log the API call
    await prisma.apiLog.create({
      data: {
        apiKeyId: req.apiKey?.id,
        endpoint: `/api/proxy/jsonplaceholder/posts/${id}`,
        method: 'GET',
        statusCode: response.status,
        responseTime,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestBody: null,
        responseBody: response.data
      }
    });

    // Return the response
    res.json({
      success: true,
      data: response.data,
      metadata: {
        source: 'jsonplaceholder.typicode.com',
        responseTime: `${responseTime}ms`,
        proxiedBy: 'API Manager'
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log the error
    await prisma.apiLog.create({
      data: {
        apiKeyId: req.apiKey?.id,
        endpoint: `/api/proxy/jsonplaceholder/posts/${id}`,
        method: 'GET',
        statusCode: error.response?.status || 500,
        responseTime,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestBody: null,
        error: error.message
      }
    });

    res.status(error.response?.status || 500).json({
      success: false,
      message: 'External API error',
      error: error.response?.data || error.message
    });
  }
}));

module.exports = router; 