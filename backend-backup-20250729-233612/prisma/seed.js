const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator with full access',
      permissions: [
        'user:read',
        'user:create',
        'user:update',
        'user:delete',
        'role:read',
        'role:create',
        'role:update',
        'role:delete',
        'apikey:read',
        'apikey:create',
        'apikey:update',
        'apikey:delete',
        'audit:read',
        'system:read',
        'system:update'
      ],
      isActive: true
    }
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: 'Regular user with limited access',
      permissions: [
        'apikey:read',
        'apikey:create',
        'apikey:update',
        'apikey:delete'
      ],
      isActive: true
    }
  });

  const moderatorRole = await prisma.role.upsert({
    where: { name: 'moderator' },
    update: {},
    create: {
      name: 'moderator',
      description: 'Moderator with user management access',
      permissions: [
        'user:read',
        'user:update',
        'apikey:read',
        'apikey:update',
        'audit:read'
      ],
      isActive: true
    }
  });

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@apimanager.com' },
    update: {},
    create: {
      email: 'admin@apimanager.com',
      username: 'admin',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
      isVerified: true,
      roleId: adminRole.id
    }
  });

  // Create demo user
  const demoPassword = await bcrypt.hash('demo123', 12);
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@apimanager.com' },
    update: {},
    create: {
      email: 'demo@apimanager.com',
      username: 'demo',
      password: demoPassword,
      firstName: 'Demo',
      lastName: 'User',
      isActive: true,
      isVerified: true,
      roleId: userRole.id
    }
  });

  // Create system configurations
  const systemConfigs = [
    {
      key: 'app_settings',
      value: {
        appName: 'API Manager',
        version: '1.0.0',
        maintenanceMode: false,
        maxApiKeysPerUser: 10,
        defaultRateLimit: 1000,
        sessionTimeout: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
      }
    },
    {
      key: 'security_settings',
      value: {
        passwordMinLength: 8,
        requireMFA: false,
        maxLoginAttempts: 5,
        lockoutDuration: 15 * 60 * 1000, // 15 minutes
        sessionTimeout: 24 * 60 * 60 * 1000 // 24 hours
      }
    }
  ];

  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config
    });
  }

  console.log('✅ Database seeding completed!');
  console.log('👤 Admin user created: admin@apimanager.com / admin123');
  console.log('👤 Demo user created: demo@apimanager.com / demo123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 