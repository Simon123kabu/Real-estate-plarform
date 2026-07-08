const testAuth = async () => {
  const BASE_URL = 'http://localhost:5000/api/auth';
  let cookie = ''; // We'll store the session cookie here

  console.log('🚀 Starting Authentication Tests...\n');

  // --- 1. TEST REGISTER ---
  console.log('1️⃣  Testing REGISTER...');
  const registerRes = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'buyer'
    })
  });
  const registerData = await registerRes.json();
  console.log(`Status: ${registerRes.status}`);
  console.log('Response:', registerData);
  console.log('-'.repeat(40) + '\n');


  // --- 2. TEST LOGIN ---
  console.log('2️⃣  Testing LOGIN...');
  const loginRes = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123'
    })
  });
  const loginData = await loginRes.json();
  
  // Extract the Set-Cookie header to use in subsequent requests
  const setCookieHeader = loginRes.headers.get('set-cookie');
  if (setCookieHeader) {
    // Just grab the connect.sid part before the semicolon
    cookie = setCookieHeader.split(';')[0];
  }

  console.log(`Status: ${loginRes.status}`);
  console.log('Response:', loginData);
  console.log('Cookie received:', cookie || 'NONE (Login failed?)');
  console.log('-'.repeat(40) + '\n');


  // --- 3. TEST PROTECTED ROUTE (/me) ---
  console.log('3️⃣  Testing GET /me (Protected Route)...');
  const meRes = await fetch(`${BASE_URL}/me`, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': cookie // Send the session cookie!
    }
  });
  const meData = await meRes.json();
  console.log(`Status: ${meRes.status}`);
  console.log('Response:', meData);
  console.log('-'.repeat(40) + '\n');


  // --- 4. TEST LOGOUT ---
  console.log('4️⃣  Testing LOGOUT...');
  const logoutRes = await fetch(`${BASE_URL}/logout`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': cookie 
    }
  });
  const logoutData = await logoutRes.json();
  console.log(`Status: ${logoutRes.status}`);
  console.log('Response:', logoutData);
  console.log('-'.repeat(40) + '\n');


  // --- 5. TEST PROTECTED ROUTE AGAIN (Should Fail) ---
  console.log('5️⃣  Testing GET /me AGAIN (Should be 401 Unauthorized)...');
  const meFailRes = await fetch(`${BASE_URL}/me`, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': cookie // Send the old cookie, it should be invalid now
    }
  });
  const meFailData = await meFailRes.json();
  console.log(`Status: ${meFailRes.status}`);
  console.log('Response:', meFailData);
  console.log('-'.repeat(40) + '\n');
  
  console.log('✅ Tests Complete!');
};

testAuth().catch(console.error);
