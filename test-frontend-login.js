const puppeteer = require('puppeteer');

async function testFrontend() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🌐 Opening frontend...');
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check if we're on login page
    const isLoginPage = await page.$('input[type="email"]') !== null;
    
    if (isLoginPage) {
      console.log('🔐 Login page detected, logging in...');
      
      // Fill login form
      await page.type('input[type="email"]', 'admin@apimanager.com');
      await page.type('input[type="password"]', 'admin123');
      
      // Click login button
      await page.click('button[type="submit"]');
      
      // Wait for redirect
      await page.waitForTimeout(3000);
    }
    
    // Navigate to API Providers page
    console.log('📋 Navigating to API Providers page...');
    await page.goto('http://localhost:3000/api-providers');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check if data is loaded
    const providerCount = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      return rows.length;
    });
    
    console.log(`📊 Found ${providerCount} API providers in the table`);
    
    // Take screenshot
    await page.screenshot({ path: 'api-providers-page.png', fullPage: true });
    console.log('📸 Screenshot saved as api-providers-page.png');
    
    // Wait for user to see the page
    console.log('⏳ Waiting 10 seconds for you to see the page...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

testFrontend(); 