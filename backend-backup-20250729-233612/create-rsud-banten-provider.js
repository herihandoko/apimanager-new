const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createRSUDBantenProvider() {
  try {
    console.log('🚀 Creating RSUD Banten API Provider...');

    // RSUD Banten API Provider
    const rsudBantenProvider = await prisma.aPIProvider.upsert({
      where: { name: 'RSUD Banten SIMRS' },
      update: {},
      create: {
        name: 'RSUD Banten SIMRS',
        description: 'Sistem Informasi Manajemen Rumah Sakit (SIMRS) RSUD Banten',
        baseUrl: 'https://simrs.bantenprov.go.id',
        documentation: 'https://simrs.bantenprov.go.id/service/medifirst2000/',
        requiresAuth: true,
        authType: 'bearer',
        authConfig: {
          headerName: 'X-AUTH-TOKEN',
          headerValue: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbi5tYXN0ZXIifQ.4DXzZ_36kwFZbmmAVP86Rvot4jkQKsqIN9SwELAxUK0vw2veSDJjvJR-H6bedUvL3aEHg1X876kzJl4k595H4g'
        },
        rateLimit: 100,
        timeout: 30000,
        isActive: true
      }
    });

    console.log(`✅ Created Provider: ${rsudBantenProvider.name} (ID: ${rsudBantenProvider.id})`);

    // RSUD Banten Endpoints dari collection
    const rsudBantenEndpoints = [
      {
        path: '/service/medifirst2000/get-tempat-tidur',
        method: 'GET',
        description: 'Get data tempat tidur RSUD Banten'
      },
      {
        path: '/service/medifirst2000/get-pasien-bydepartemen',
        method: 'GET',
        description: 'Get data pasien per department RSUD Banten'
      },
      {
        path: '/service/medifirst2000/auth/sign-in',
        method: 'POST',
        description: 'Login ke SIMRS RSUD Banten'
      }
    ];

    // Create endpoints for RSUD Banten
    for (const endpoint of rsudBantenEndpoints) {
      const existingEndpoint = await prisma.aPIEndpoint.findFirst({
        where: {
          providerId: rsudBantenProvider.id,
          path: endpoint.path,
          method: endpoint.method
        }
      });

      if (!existingEndpoint) {
        const createdEndpoint = await prisma.aPIEndpoint.create({
          data: {
            providerId: rsudBantenProvider.id,
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

    console.log('\n🎉 RSUD Banten API Provider created successfully!');
    console.log('\n📋 RSUD Banten Provider Details:');
    
    const provider = await prisma.aPIProvider.findUnique({
      where: { id: rsudBantenProvider.id },
      include: {
        endpoints: {
          where: { isActive: true },
          orderBy: { path: 'asc' }
        }
      }
    });

    console.log(`\n🔗 ${provider.name} (${provider.isActive ? '✅ Active' : '❌ Inactive'}):`);
    console.log(`   Base URL: ${provider.baseUrl}`);
    console.log(`   Auth Type: ${provider.authType}`);
    console.log(`   Rate Limit: ${provider.rateLimit}/hour`);
    console.log(`   Timeout: ${provider.timeout}ms`);
    console.log(`   Endpoints (${provider.endpoints.length}):`);
    provider.endpoints.forEach(endpoint => {
      console.log(`     ${endpoint.method} ${endpoint.path} - ${endpoint.description}`);
    });

    console.log('\n🔗 Cara Akses via API Manager:');
    console.log('   GET  /api/proxy/provider/PROVIDER_ID/service/medifirst2000/get-tempat-tidur');
    console.log('   GET  /api/proxy/provider/PROVIDER_ID/service/medifirst2000/get-pasien-bydepartemen');
    console.log('   POST /api/proxy/provider/PROVIDER_ID/service/medifirst2000/auth/sign-in');
    console.log(`\n   Provider ID: ${provider.id}`);

    console.log('\n💡 Keuntungan:');
    console.log('   ✅ Satu provider = 3 endpoints');
    console.log('   ✅ Authentication otomatis');
    console.log('   ✅ Rate limiting terpusat');
    console.log('   ✅ Logging dan monitoring');
    console.log('   ✅ Tidak perlu daftar per endpoint!');

  } catch (error) {
    console.error('❌ Error creating RSUD Banten provider:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createRSUDBantenProvider(); 