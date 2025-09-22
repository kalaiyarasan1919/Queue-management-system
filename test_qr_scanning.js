const fetch = require('node-fetch');

async function testQRScanning() {
  console.log('🧪 Testing QR Code Scanning with User Details\n');

  // Test 1: Test token validation endpoint
  console.log('1️⃣ Testing token validation endpoint...');
  try {
    const response = await fetch('http://localhost:5000/api/tokens/validate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // You may need to adjust this
      },
      body: JSON.stringify({ tokenId: 'TEST123' })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Token validation response:', JSON.stringify(data, null, 2));
      
      if (data.valid && data.appointment) {
        console.log('\n📋 User Registration Details:');
        console.log('👤 User:', data.appointment.citizen?.firstName, data.appointment.citizen?.lastName);
        console.log('📧 Email:', data.appointment.citizen?.email);
        console.log('🏢 Department:', data.appointment.department?.name);
        console.log('⚙️ Service:', data.appointment.service?.name);
        console.log('📅 Date:', new Date(data.appointment.appointmentDate).toLocaleDateString());
        console.log('⏰ Time Slot:', data.appointment.timeSlot);
        console.log('🎯 Priority:', data.appointment.priority);
        console.log('📊 Status:', data.appointment.status);
      }
    } else {
      console.log('❌ Token validation failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Token validation error:', error.message);
  }

  // Test 2: Test with invalid token
  console.log('\n2️⃣ Testing with invalid token...');
  try {
    const response = await fetch('http://localhost:5000/api/tokens/validate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({ tokenId: 'INVALID123' })
    });
    
    const data = await response.json();
    console.log('✅ Invalid token response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('❌ Invalid token test error:', error.message);
  }

  console.log('\n🎉 QR scanning test completed!');
}

testQRScanning().catch(console.error);
