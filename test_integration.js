const fetch = require('node-fetch');

async function testIntegration() {
  console.log('🧪 Testing SmartQueue + Django Reminder Service Integration\n');

  // Test 1: Django Service Health
  console.log('1️⃣ Testing Django Reminder Service...');
  try {
    const response = await fetch('http://localhost:8000/api/health/');
    const data = await response.json();
    console.log('✅ Django Service:', data);
  } catch (error) {
    console.log('❌ Django Service Error:', error.message);
  }

  // Test 2: Node.js Service Health (via reminder service proxy)
  console.log('\n2️⃣ Testing Node.js Service (via reminder proxy)...');
  try {
    const response = await fetch('http://localhost:5000/api/reminder-service/health');
    const data = await response.json();
    console.log('✅ Node.js Service:', data);
  } catch (error) {
    console.log('❌ Node.js Service Error:', error.message);
  }

  // Test 3: Test Email Functionality
  console.log('\n3️⃣ Testing Email System...');
  try {
    const response = await fetch('http://localhost:5000/api/reminder-service/test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' })
    });
    const data = await response.json();
    console.log('✅ Email Test:', data);
  } catch (error) {
    console.log('❌ Email Test Error:', error.message);
  }

  // Test 4: Reminder Stats
  console.log('\n4️⃣ Testing Reminder Stats...');
  try {
    const response = await fetch('http://localhost:5000/api/reminder-service/stats');
    const data = await response.json();
    console.log('✅ Reminder Stats:', data);
  } catch (error) {
    console.log('❌ Stats Error:', error.message);
  }

  console.log('\n🎉 Integration test completed!');
}

testIntegration().catch(console.error);
