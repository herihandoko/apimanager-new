const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSampleAuditLogs() {
  try {
    // Get existing users
    const users = await prisma.user.findMany({
      select: { id: true, email: true }
    });

    if (users.length === 0) {
      console.log('No users found. Please create users first.');
      return;
    }

    console.log('Creating sample audit logs...');

    const sampleLogs = [
      {
        userId: users[0].id,
        action: 'user.login',
        resource: 'auth',
        details: { message: 'User logged in successfully' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: 'low',
        status: 'success'
      },
      {
        userId: users[0].id,
        action: 'user.create',
        resource: 'users',
        resourceId: 'new-user-123',
        details: { message: 'Created new user account', email: 'newuser@example.com' },
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        severity: 'medium',
        status: 'success'
      },
      {
        userId: users[0].id,
        action: 'api.delete',
        resource: 'apikeys',
        resourceId: 'key-456',
        details: { message: 'Deleted API key due to security concerns' },
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Linux x86_64) AppleWebKit/537.36',
        severity: 'high',
        status: 'success'
      },
      {
        userId: users[0].id,
        action: 'user.login',
        resource: 'auth',
        details: { message: 'Failed login attempt - invalid credentials' },
        ipAddress: '203.0.113.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: 'critical',
        status: 'failure'
      },
      {
        userId: users[0].id,
        action: 'role.update',
        resource: 'roles',
        resourceId: 'role-789',
        details: { message: 'Updated role permissions', permissions: ['read', 'write'] },
        ipAddress: '192.168.1.103',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        severity: 'medium',
        status: 'success'
      },
      {
        userId: users[0].id,
        action: 'system.backup',
        resource: 'system',
        details: { message: 'System backup completed successfully' },
        ipAddress: '192.168.1.104',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: 'low',
        status: 'success'
      },
      {
        userId: users[0].id,
        action: 'settings.update',
        resource: 'settings',
        details: { message: 'Updated security settings', setting: 'session_timeout' },
        ipAddress: '192.168.1.105',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        severity: 'medium',
        status: 'success'
      },
      {
        userId: users[0].id,
        action: 'user.logout',
        resource: 'auth',
        details: { message: 'User logged out successfully' },
        ipAddress: '192.168.1.106',
        userAgent: 'Mozilla/5.0 (Linux x86_64) AppleWebKit/537.36',
        severity: 'low',
        status: 'success'
      }
    ];

    for (const logData of sampleLogs) {
      const auditLog = await prisma.auditLog.create({
        data: logData
      });
      console.log('Created audit log:', auditLog.action, '(ID:', auditLog.id, ')');
    }

    console.log('Sample audit logs created successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleAuditLogs(); 