const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleExternalAPIs() {
  try {
    console.log('🚀 Creating sample external APIs...');

    // Sample External APIs
    const sampleAPIs = [
      {
        name: 'JSONPlaceholder Todos',
        description: 'JSONPlaceholder API untuk testing todos dengan dynamic proxy',
        baseUrl: 'https://jsonplaceholder.typicode.com',
        endpoint: '/todos/{id}',
        method: 'GET',
        requiresAuth: false,
        authType: 'none',
        authConfig: {},
        rateLimit: 1000,
        timeout: 10000,
        isActive: true
      },
      {
        name: 'JSONPlaceholder Posts',
        description: 'JSONPlaceholder API untuk testing posts dengan dynamic proxy',
        baseUrl: 'https://jsonplaceholder.typicode.com',
        endpoint: '/posts/{id}',
        method: 'GET',
        requiresAuth: false,
        authType: 'none',
        authConfig: {},
        rateLimit: 1000,
        timeout: 10000,
        isActive: true
      },
      {
        name: 'JSONPlaceholder Users',
        description: 'JSONPlaceholder API untuk testing users dengan dynamic proxy',
        baseUrl: 'https://jsonplaceholder.typicode.com',
        endpoint: '/users/{id}',
        method: 'GET',
        requiresAuth: false,
        authType: 'none',
        authConfig: {},
        rateLimit: 1000,
        timeout: 10000,
        isActive: true
      },
      {
        name: 'JSONPlaceholder Comments',
        description: 'JSONPlaceholder API untuk testing comments dengan dynamic proxy',
        baseUrl: 'https://jsonplaceholder.typicode.com',
        endpoint: '/comments',
        method: 'GET',
        requiresAuth: false,
        authType: 'none',
        authConfig: {},
        rateLimit: 1000,
        timeout: 10000,
        isActive: true
      },
      {
        name: 'JSONPlaceholder Albums',
        description: 'JSONPlaceholder API untuk testing albums dengan dynamic proxy',
        baseUrl: 'https://jsonplaceholder.typicode.com',
        endpoint: '/albums/{id}',
        method: 'GET',
        requiresAuth: false,
        authType: 'none',
        authConfig: {},
        rateLimit: 1000,
        timeout: 10000,
        isActive: true
      },
      {
        name: 'JSONPlaceholder Photos',
        description: 'JSONPlaceholder API untuk testing photos dengan dynamic proxy',
        baseUrl: 'https://jsonplaceholder.typicode.com',
        endpoint: '/photos',
        method: 'GET',
        requiresAuth: false,
        authType: 'none',
        authConfig: {},
        rateLimit: 1000,
        timeout: 10000,
        isActive: true
      },
      {
        name: 'JSONPlaceholder Create Post',
        description: 'JSONPlaceholder API untuk create post dengan dynamic proxy',
        baseUrl: 'https://jsonplaceholder.typicode.com',
        endpoint: '/posts',
        method: 'POST',
        requiresAuth: false,
        authType: 'none',
        authConfig: {},
        rateLimit: 1000,
        timeout: 10000,
        isActive: true
      },
      {
        name: 'JSONPlaceholder Update Post',
        description: 'JSONPlaceholder API untuk update post dengan dynamic proxy',
        baseUrl: 'https://jsonplaceholder.typicode.com',
        endpoint: '/posts/{id}',
        method: 'PUT',
        requiresAuth: false,
        authType: 'none',
        authConfig: {},
        rateLimit: 1000,
        timeout: 10000,
        isActive: true
      },
      {
        name: 'JSONPlaceholder Delete Post',
        description: 'JSONPlaceholder API untuk delete post dengan dynamic proxy',
        baseUrl: 'https://jsonplaceholder.typicode.com',
        endpoint: '/posts/{id}',
        method: 'DELETE',
        requiresAuth: false,
        authType: 'none',
        authConfig: {},
        rateLimit: 1000,
        timeout: 10000,
        isActive: true
      },
      {
        name: 'JSONPlaceholder Patch Post',
        description: 'JSONPlaceholder API untuk patch post dengan dynamic proxy',
        baseUrl: 'https://jsonplaceholder.typicode.com',
        endpoint: '/posts/{id}',
        method: 'PATCH',
        requiresAuth: false,
        authType: 'none',
        authConfig: {},
        rateLimit: 1000,
        timeout: 10000,
        isActive: true
      }
    ];

    // Create each external API
    for (const api of sampleAPIs) {
      const existingAPI = await prisma.externalAPI.findFirst({
        where: {
          name: api.name,
          baseUrl: api.baseUrl,
          endpoint: api.endpoint
        }
      });

      if (!existingAPI) {
        const createdAPI = await prisma.externalAPI.create({
          data: api
        });
        console.log(`✅ Created: ${createdAPI.name} (ID: ${createdAPI.id})`);
      } else {
        console.log(`⏭️  Skipped: ${existingAPI.name} (already exists)`);
      }
    }

    console.log('\n🎉 Sample external APIs created successfully!');
    console.log('\n📋 Available Dynamic Proxy Endpoints:');
    
    const allAPIs = await prisma.externalAPI.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    allAPIs.forEach(api => {
      console.log(`   ${api.method} /api/proxy/dynamic/${api.id} - ${api.name}`);
    });

    console.log('\n🔗 Example Usage:');
    console.log('   GET  /api/proxy/dynamic/API_ID?id=1');
    console.log('   POST /api/proxy/dynamic/API_ID');
    console.log('   PUT  /api/proxy/dynamic/API_ID');
    console.log('   DELETE /api/proxy/dynamic/API_ID');

  } catch (error) {
    console.error('❌ Error creating sample external APIs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createSampleExternalAPIs(); 