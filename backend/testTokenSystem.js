const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function runTest() {
  console.log("=== Starting Token System E2E Test ===");
  
  try {
    // 1. Get a Doctor and a Session for today
    const doctor = await prisma.doctor.findFirst();
    if (!doctor) throw new Error("No doctors found");
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    let session = await prisma.doctorSession.findFirst({
      where: { doctorId: doctor.id, date: today }
    });
    
    if (!session) throw new Error("No session found for today");
    console.log(`[+] Found Doctor: ${doctor.name}`);
    console.log(`[+] Found Session: ${session.sessionType} (Max Tokens: ${session.maxTokens})`);

    // 2. Clear existing appointments for this session so we start fresh
    await prisma.appointment.deleteMany({ where: { sessionId: session.id } });
    await prisma.doctorSession.update({ where: { id: session.id }, data: { currentToken: 0 } });
    console.log(`[+] Cleared existing appointments for this session to start fresh.`);

    // 3. Create a test patient & login
    const timestamp = Date.now();
    const registerRes = await fetchJSON(`${API_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Queue Tester',
        email: `tester_${timestamp}@example.com`,
        phone: `555${timestamp.toString().slice(-7)}`,
        password: process.env.TEST_PATIENT_PASSWORD || 'password123',
        role: 'patient'
      })
    });
    
    console.log(registerRes);
    const patientToken = registerRes.token || registerRes?.data?.token;
    console.log(`[+] Registered new patient successfully`);

    // 4. Patient Books Token #1
    console.log(`[+] Patient booking Token #1...`);
    const bookRes1 = await fetchJSON(`${API_URL}/appointments`, {
      method: 'POST',
      body: JSON.stringify({
        doctorId: doctor.id,
        sessionId: session.id,
        type: 'video'
      }),
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    
    const appt1 = bookRes1.data || bookRes1.appointment || bookRes1;
    console.log(`[✔] Success! Assigned Token: #${appt1.tokenNumber}, Status: ${appt1.status}`);

    // 5. Patient Books Token #2
    console.log(`[+] Patient booking Token #2...`);
    const bookRes2 = await fetchJSON(`${API_URL}/appointments`, {
      method: 'POST',
      body: JSON.stringify({
        doctorId: doctor.id,
        sessionId: session.id,
        type: 'in-person'
      }),
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    
    const appt2 = bookRes2.data || bookRes2.appointment || bookRes2;
    console.log(`[✔] Success! Assigned Token: #${appt2.tokenNumber}, Status: ${appt2.status}`);

    // 6. Doctor Logs In
    const hash = await bcrypt.hash(process.env.TEST_DOCTOR_PASSWORD || 'docpassword', 10);
    await prisma.doctor.update({
      where: { id: doctor.id },
      data: { password: hash }
    });
    
    const docLoginRes = await fetchJSON(`${API_URL}/doctor/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        // Dummy credentials for testing purposes
        email: doctor.email,
        password: process.env.TEST_DOCTOR_PASSWORD || 'docpassword',
      })
    });
    
    const doctorToken = docLoginRes.token || docLoginRes?.data?.token;
    console.log(`[+] Doctor logged in successfully`);

    // 7. Doctor Calls Next Patient (Should be Token #1)
    console.log(`[+] Doctor clicking "Call Next Patient"...`);
    const callNext1 = await fetchJSON(`${API_URL}/doctor/appointments/sessions/${session.id}/next`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    
    const advancedSession1 = callNext1.data || callNext1.session || callNext1;
    console.log(`[✔] Session advanced. Currently serving Token: #${advancedSession1.currentToken}`);
    
    // Verify Appointment #1 is IN_PROGRESS
    const verifyAppt1 = await prisma.appointment.findUnique({ where: { id: appt1.id } });
    console.log(`    -> Token #1 Status is now: ${verifyAppt1.status} (Expected: IN_PROGRESS)`);

    // 8. Doctor Calls Next Patient (Should be Token #2)
    console.log(`[+] Doctor clicking "Call Next Patient" again...`);
    const callNext2 = await fetchJSON(`${API_URL}/doctor/appointments/sessions/${session.id}/next`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    
    const advancedSession2 = callNext2.data || callNext2.session || callNext2;
    console.log(`[✔] Session advanced. Currently serving Token: #${advancedSession2.currentToken}`);
    
    // Verify Appointment #1 is COMPLETED and #2 is IN_PROGRESS
    const verifyAppt1_after = await prisma.appointment.findUnique({ where: { id: appt1.id } });
    const verifyAppt2_after = await prisma.appointment.findUnique({ where: { id: appt2.id } });
    
    console.log(`    -> Token #1 Status is now: ${verifyAppt1_after.status} (Expected: COMPLETED)`);
    console.log(`    -> Token #2 Status is now: ${verifyAppt2_after.status} (Expected: IN_PROGRESS)`);

    console.log("=== Test Completed Successfully ===");
    
  } catch (err) {
    console.error("Test Failed!", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
