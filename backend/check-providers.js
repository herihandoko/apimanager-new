const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProviders() {
  try {
    console.log('🔍 Checking API Providers in database...');
    
    const providers = await prisma.aPIProvider.findMany({
      include: {
        endpoints: true
      }
    });
    
    console.log(`📊 Found ${providers.length} providers:`);
    
    providers.forEach(provider => {
      console.log(`\n🔗 ${provider.name} (ID: ${provider.id})`);
      console.log(`   Base URL: ${provider.baseUrl}`);
      console.log(`   Active: ${provider.isActive}`);
      console.log(`   Endpoints: ${provider.endpoints.length}`);
      provider.endpoints.forEach(endpoint => {
        console.log(`     ${endpoint.method} ${endpoint.path}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProviders(); 