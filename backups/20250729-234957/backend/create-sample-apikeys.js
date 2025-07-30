const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function createSampleApiKeys() {
  try {
    // Get first user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('No users found. Please create a user first.');
      return;
    }
    
    console.log('Creating sample API keys for user:', user.email);
    
    // Create sample API keys
    const sampleKeys = [
      {
        name: 'Production API Key',
        description: 'Main production API key for client applications',
        permissions: ['read', 'write'],
        rateLimit: 1000,
        isActive: true,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      },
      {
        name: 'Development Key',
        description: 'Development and testing API key',
        permissions: ['read'],
        rateLimit: 100,
        isActive: true,
        expiresAt: null
      },
      {
        name: 'Mobile App Key',
        description: 'API key for mobile application',
        permissions: ['read', 'write'],
        rateLimit: 500,
        isActive: false,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    ];
    
    for (const keyData of sampleKeys) {
      const apiKey = `ak_${crypto.randomBytes(32).toString('hex')}`;
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      
      const newKey = await prisma.apiKey.create({
        data: {
          ...keyData,
          key: apiKey,
          keyHash,
          userId: user.id
        }
      });
      
      console.log('Created API key:', newKey.name, '(ID:', newKey.id, ')');
    }
    
    console.log('Sample API keys created successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleApiKeys(); 