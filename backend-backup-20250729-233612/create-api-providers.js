const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAPIProviders() {
  try {
    console.log('🚀 Creating API Providers with endpoints...');

    // JSONPlaceholder API Provider
    const jsonplaceholderProvider = await prisma.aPIProvider.upsert({
      where: { name: 'JSONPlaceholder' },
      update: {},
      create: {
        name: 'JSONPlaceholder',
        description: 'JSONPlaceholder API untuk testing dan prototyping',
        baseUrl: 'https://jsonplaceholder.typicode.com',
        documentation: 'https://jsonplaceholder.typicode.com/',
        requiresAuth: false,
        authType: 'none',
        authConfig: {},
        rateLimit: 1000,
        timeout: 10000,
        isActive: true
      }
    });

    console.log(`✅ Created Provider: ${jsonplaceholderProvider.name} (ID: ${jsonplaceholderProvider.id})`);

    // JSONPlaceholder Endpoints
    const jsonplaceholderEndpoints = [
      {
        path: '/todos/{id}',
        method: 'GET',
        description: 'Get todo by ID'
      },
      {
        path: '/todos',
        method: 'GET',
        description: 'Get all todos'
      },
      {
        path: '/posts/{id}',
        method: 'GET',
        description: 'Get post by ID'
      },
      {
        path: '/posts',
        method: 'GET',
        description: 'Get all posts'
      },
      {
        path: '/posts',
        method: 'POST',
        description: 'Create new post'
      },
      {
        path: '/posts/{id}',
        method: 'PUT',
        description: 'Update post'
      },
      {
        path: '/posts/{id}',
        method: 'PATCH',
        description: 'Patch post'
      },
      {
        path: '/posts/{id}',
        method: 'DELETE',
        description: 'Delete post'
      },
      {
        path: '/users/{id}',
        method: 'GET',
        description: 'Get user by ID'
      },
      {
        path: '/users',
        method: 'GET',
        description: 'Get all users'
      },
      {
        path: '/comments',
        method: 'GET',
        description: 'Get all comments'
      },
      {
        path: '/comments/{id}',
        method: 'GET',
        description: 'Get comment by ID'
      },
      {
        path: '/albums/{id}',
        method: 'GET',
        description: 'Get album by ID'
      },
      {
        path: '/albums',
        method: 'GET',
        description: 'Get all albums'
      },
      {
        path: '/photos',
        method: 'GET',
        description: 'Get all photos'
      },
      {
        path: '/photos/{id}',
        method: 'GET',
        description: 'Get photo by ID'
      }
    ];

    // Create endpoints for JSONPlaceholder
    for (const endpoint of jsonplaceholderEndpoints) {
      const existingEndpoint = await prisma.aPIEndpoint.findFirst({
        where: {
          providerId: jsonplaceholderProvider.id,
          path: endpoint.path,
          method: endpoint.method
        }
      });

      if (!existingEndpoint) {
        const createdEndpoint = await prisma.aPIEndpoint.create({
          data: {
            providerId: jsonplaceholderProvider.id,
            path: endpoint.path,
            method: endpoint.method,
            description: endpoint.description,
            isActive: true
          }
        });
        console.log(`  ✅ Created Endpoint: ${createdEndpoint.method} ${createdEndpoint.path}`);
      } else {
        console.log(`  ⏭️  Skipped Endpoint: ${existingEndpoint.method} ${existingEndpoint.path} (already exists)`);
      }
    }

    // OpenWeatherMap API Provider
    const weatherProvider = await prisma.aPIProvider.upsert({
      where: { name: 'OpenWeatherMap' },
      update: {},
      create: {
        name: 'OpenWeatherMap',
        description: 'Weather data API service',
        baseUrl: 'https://api.openweathermap.org/data/2.5',
        documentation: 'https://openweathermap.org/api',
        requiresAuth: true,
        authType: 'api_key',
        authConfig: {
          headerName: 'X-API-Key',
          headerValue: 'your-api-key-here'
        },
        rateLimit: 100,
        timeout: 5000,
        isActive: false // Disabled by default
      }
    });

    console.log(`✅ Created Provider: ${weatherProvider.name} (ID: ${weatherProvider.id})`);

    // Weather API Endpoints
    const weatherEndpoints = [
      {
        path: '/weather',
        method: 'GET',
        description: 'Get current weather data'
      },
      {
        path: '/forecast',
        method: 'GET',
        description: 'Get weather forecast'
      }
    ];

    // Create endpoints for Weather API
    for (const endpoint of weatherEndpoints) {
      const existingEndpoint = await prisma.aPIEndpoint.findFirst({
        where: {
          providerId: weatherProvider.id,
          path: endpoint.path,
          method: endpoint.method
        }
      });

      if (!existingEndpoint) {
        const createdEndpoint = await prisma.aPIEndpoint.create({
          data: {
            providerId: weatherProvider.id,
            path: endpoint.path,
            method: endpoint.method,
            description: endpoint.description,
            isActive: true
          }
        });
        console.log(`  ✅ Created Endpoint: ${createdEndpoint.method} ${createdEndpoint.path}`);
      } else {
        console.log(`  ⏭️  Skipped Endpoint: ${existingEndpoint.method} ${existingEndpoint.path} (already exists)`);
      }
    }

    console.log('\n🎉 API Providers created successfully!');
    console.log('\n📋 Available API Providers:');
    
    const allProviders = await prisma.aPIProvider.findMany({
      include: {
        endpoints: {
          where: { isActive: true },
          orderBy: { path: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    allProviders.forEach(provider => {
      console.log(`\n🔗 ${provider.name} (${provider.isActive ? '✅ Active' : '❌ Inactive'}):`);
      console.log(`   Base URL: ${provider.baseUrl}`);
      console.log(`   Endpoints (${provider.endpoints.length}):`);
      provider.endpoints.forEach(endpoint => {
        console.log(`     ${endpoint.method} ${endpoint.path} - ${endpoint.description}`);
      });
    });

    console.log('\n🔗 New Proxy Format:');
    console.log('   GET  /api/proxy/provider/PROVIDER_ID/endpoint?param=value');
    console.log('   POST /api/proxy/provider/PROVIDER_ID/endpoint');
    console.log('   PUT  /api/proxy/provider/PROVIDER_ID/endpoint');
    console.log('   DELETE /api/proxy/provider/PROVIDER_ID/endpoint');

  } catch (error) {
    console.error('❌ Error creating API providers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAPIProviders(); 