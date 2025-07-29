const mysql = require('mysql2/promise');
const { Client } = require('ssh2');
const NodeCache = require('node-cache');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const connectionCache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache

class DatabaseConnectionService {
  constructor() {
    this.connections = new Map();
  }

  // Create SSH tunnel
  async createSSHTunnel(tunnelConfig) {
    return new Promise((resolve, reject) => {
      const sshClient = new Client();
      
      // Set timeout for SSH connection (10 seconds)
      const timeout = setTimeout(() => {
        sshClient.end();
        reject(new Error('SSH connection timeout after 10 seconds'));
      }, 10000);
      
      sshClient.on('ready', () => {
        clearTimeout(timeout);
        // Use the database host and port for forwarding
        const dbHost = tunnelConfig.dbHost || 'localhost';
        const dbPort = tunnelConfig.dbPort || 3306;
        
        sshClient.forwardOut(
          '127.0.0.1',
          0,
          dbHost,
          dbPort,
          (err, stream) => {
            if (err) {
              sshClient.end();
              reject(err);
              return;
            }
            resolve({ sshClient, stream });
          }
        );
      }).on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      }).connect({
        host: tunnelConfig.sshHost,
        port: tunnelConfig.sshPort || 22,
        username: tunnelConfig.sshUsername,
        password: tunnelConfig.sshPassword,
        privateKey: tunnelConfig.sshPrivateKey,
        readyTimeout: 10000, // 10 second timeout
        keepaliveInterval: 10000,
        keepaliveCountMax: 3
      });
    });
  }

  // Get database connection
  async getConnection(connectionId) {
    // Check cache first
    const cachedConnection = connectionCache.get(connectionId);
    if (cachedConnection) {
      return cachedConnection;
    }

    // Get connection config from database
    const connectionConfig = await prisma.databaseConnection.findUnique({
      where: { id: connectionId }
    });

    if (!connectionConfig) {
      throw new Error('Database connection not found');
    }

    if (!connectionConfig.isActive) {
      throw new Error('Database connection is inactive');
    }

    let connection;

    try {
      if (connectionConfig.useTunnel) {
        // Create SSH tunnel
        const tunnelConfig = {
          ...connectionConfig.tunnelConfig,
          dbHost: connectionConfig.host,
          dbPort: connectionConfig.port
        };
        const { sshClient, stream } = await this.createSSHTunnel(tunnelConfig);
        
        connection = await mysql.createConnection({
          host: '127.0.0.1',
          port: tunnelConfig.localPort || 3306,
          user: connectionConfig.username,
          password: connectionConfig.password,
          database: connectionConfig.database,
          ssl: connectionConfig.useSSL ? {} : false,
          stream: stream
        });

        // Store SSH client for cleanup
        connection.sshClient = sshClient;
      } else {
        // Direct connection
        connection = await mysql.createConnection({
          host: connectionConfig.host,
          port: connectionConfig.port,
          user: connectionConfig.username,
          password: connectionConfig.password,
          database: connectionConfig.database,
          ssl: connectionConfig.useSSL ? {} : false
        });
      }

      // Cache the connection
      connectionCache.set(connectionId, connection);
      
      // Log connection
      await prisma.databaseConnectionLog.create({
        data: {
          connectionId,
          action: 'connect',
          status: 'success',
          duration: Date.now()
        }
      });

      return connection;
    } catch (error) {
      console.error('Error creating database connection:', error.message);
      throw error;
    }
  }

  // Execute query
  async executeQuery(connectionId, query, params = []) {
    const startTime = Date.now();
    let connection;
    
    try {
      // Get connection config from database
      const connectionConfig = await prisma.databaseConnection.findUnique({
        where: { id: connectionId }
      });

      if (!connectionConfig) {
        throw new Error('Database connection not found');
      }

      if (!connectionConfig.isActive) {
        throw new Error('Database connection is inactive');
      }

      // Create fresh connection for this query
      if (connectionConfig.useTunnel) {
        const tunnelConfig = {
          ...connectionConfig.tunnelConfig,
          dbHost: connectionConfig.host,
          dbPort: connectionConfig.port
        };
        const { sshClient, stream } = await this.createSSHTunnel(tunnelConfig);
        
        connection = await mysql.createConnection({
          host: '127.0.0.1',
          port: tunnelConfig.localPort || 3306,
          user: connectionConfig.username,
          password: connectionConfig.password,
          database: connectionConfig.database,
          ssl: connectionConfig.useSSL ? {} : false,
          stream: stream
        });

        // Store SSH client for cleanup
        connection.sshClient = sshClient;
      } else {
        connection = await mysql.createConnection({
          host: connectionConfig.host,
          port: connectionConfig.port,
          user: connectionConfig.username,
          password: connectionConfig.password,
          database: connectionConfig.database,
          ssl: connectionConfig.useSSL ? {} : false
        });
      }

      const [rows] = await connection.execute(query, params);
      
      const duration = Date.now() - startTime;
      
      // Log successful query
      await prisma.databaseConnectionLog.create({
        data: {
          connectionId,
          action: 'query',
          status: 'success',
          duration
        }
      });

      return rows;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log failed query
      await prisma.databaseConnectionLog.create({
        data: {
          connectionId,
          action: 'query',
          status: 'error',
          duration,
          error: error.message
        }
      });

      throw error;
    } finally {
      // Always close the connection
      if (connection) {
        try {
          await connection.end();
          if (connection.sshClient) {
            connection.sshClient.end();
          }
        } catch (closeError) {
          console.log('Error closing connection:', closeError.message);
        }
      }
    }
  }

  // Test connection
  async testConnection(connectionConfig) {
    let connection;
    let sshClient;
    let timeoutId;

    try {
      // Set timeout for test connection (10 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Connection test timeout after 10 seconds'));
        }, 10000);
      });

      const connectionPromise = (async () => {
        if (connectionConfig.useTunnel) {
          const tunnelConfig = connectionConfig.tunnelConfig;
          const tunnel = await this.createSSHTunnel(tunnelConfig);
          sshClient = tunnel.sshClient;
          
          connection = await mysql.createConnection({
            host: '127.0.0.1',
            port: tunnelConfig.localPort || 3306,
            user: connectionConfig.username,
            password: connectionConfig.password,
            database: connectionConfig.database,
            ssl: connectionConfig.useSSL ? {} : false,
            stream: tunnel.stream
          });
        } else {
          connection = await mysql.createConnection({
            host: connectionConfig.host,
            port: connectionConfig.port,
            user: connectionConfig.username,
            password: connectionConfig.password,
            database: connectionConfig.database,
            ssl: connectionConfig.useSSL ? {} : false
          });
        }

        // Test with simple query
        await connection.execute('SELECT 1');
        
        return { success: true, message: 'Connection successful' };
      })();

      // Race between timeout and connection
      const result = await Promise.race([connectionPromise, timeoutPromise]);
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      console.log('Connection test failed for connection', connectionConfig.id || 'unknown', ':', error.message);
      return { success: false, message: error.message };
    } finally {
      if (connection) {
        try {
          await connection.end();
        } catch (closeError) {
          console.log('Error closing connection:', closeError.message);
        }
      }
      if (sshClient) {
        try {
          sshClient.end();
        } catch (closeError) {
          console.log('Error closing SSH client:', closeError.message);
        }
      }
    }
  }

  // Close connection
  async closeConnection(connectionId) {
    const connection = connectionCache.get(connectionId);
    if (connection) {
      await connection.end();
      if (connection.sshClient) {
        connection.sshClient.end();
      }
      connectionCache.del(connectionId);
    }
  }

  // Get database schema
  async getSchema(connectionId) {
    const connection = await this.getConnection(connectionId);
    const [tables] = await connection.execute(`
      SELECT 
        TABLE_NAME as table_name,
        TABLE_COMMENT as table_comment
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
    `);

    const schema = [];
    for (const table of tables) {
      const [columns] = await connection.execute(`
        SELECT 
          COLUMN_NAME as column_name,
          DATA_TYPE as data_type,
          IS_NULLABLE as is_nullable,
          COLUMN_DEFAULT as column_default,
          COLUMN_COMMENT as column_comment
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [table.table_name]);

      schema.push({
        table: table.table_name,
        comment: table.table_comment,
        columns
      });
    }

    return schema;
  }
}

module.exports = new DatabaseConnectionService(); 