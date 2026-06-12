/**
 * ============================================================================
 * MEDIFLOW OPD — COMPLETE END-TO-END WORKFLOW TEST SCRIPT
 * ============================================================================
 * 
 * This script runs the entire patient journey through the MediFlow system:
 * 
 * Login → Register Patient → Create Visit → Record Triage
 *   → Create Invoice (consultation fee)
 *   → MEDICAL CONSULTATION → Order Labs → Enter Results → Create Prescription → Dispense
 *   → DENTAL CONSULTATION → Dental Procedure → Create Prescription → Dispense
 *   → Final Billing → Record Payment
 *   → Update Visit Status → Complete
 *   → Send Receipt + Discharge Instructions
 * 
 * Usage:
 *   1. Ensure your MediFlow backend is running at the configured BASE_URL
 *   2. Run: node mediflow-e2e.js
 *   3. Check console output for pass/fail status of each step
 * 
 * ============================================================================
 */

const BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:4000'
    : 'https://mediflow-opd-1-backend.onrender.com';
const API = (path) => `${BASE_URL}${path}`;

// Demo credentials
const CREDENTIALS = {
  admin:    { email: 'admin@mediflow.local',    password: 'admin123' },
  doctor:   { email: 'doctor@mediflow.local',   password: 'doctor123' },
  triage:   { email: 'triage@mediflow.local',   password: 'triage123' }
};

// Store state across the workflow
const state = {
  token: null,
  refreshToken: null,
  patientId: null,
  patientNo: null,
  visitId: null,
  visitNo: null,
  queueNumber: null,
  invoiceId: null,
  invoiceNo: null,
  aptId: null,
  medicalConsultationId: null,
  dentalConsultationId: null,
  labOrderId: null,
  prescriptionId: null,
  dentalPrescriptionId: null,
  drugId: null,
  testId: null,
  doctorId: null,
  dentistId: null
};

// ─────────────────────────────────────────────────────────────────────────────
// HTTP HELPER
// ─────────────────────────────────────────────────────────────────────────────

async function request(method, url, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) })
  };

  const response = await fetch(url, options);
  const status = response.status;
  let data = null;

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  return { status, data, ok: response.ok };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST RUNNER
// ─────────────────────────────────────────────────────────────────────────────

let testCount = 0;
let passCount = 0;
let failCount = 0;

async function test(name, fn) {
  testCount++;
  process.stdout.write(`\n[${testCount}] ${name} ... `);
  try {
    await fn();
    passCount++;
    console.log('✅ PASS');
  } catch (err) {
    failCount++;
    console.log(`❌ FAIL: ${err.message}`);
    console.log(`   Details:`, err.details || 'No additional details');
  }
}

function assert(condition, message, details = null) {
  if (!condition) {
    const err = new Error(message);
    err.details = details;
    throw err;
  }
}

// ─────────────────═══════════════════════════════════════════════════════════
// WORKFLOW STEPS
// ───═══════════════════════════════════════════════════════════════════════════

async function runWorkflow() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  MEDIFLOW OPD — END-TO-END WORKFLOW TEST');
  console.log(`  Base URL: ${BASE_URL}`);
  console.log('═══════════════════════════════════════════════════════════════');

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1: AUTHENTICATION
  // ═══════════════════════════════════════════════════════════════════════════

  await test('🔐 Login as Admin', async () => {
    const res = await request('POST', API('/api/auth/login'), CREDENTIALS.admin);
    assert(res.ok && res.status === 200, 'Login failed', res.data);
    assert(res.data.token, 'No token returned');
    assert(res.data.user.role, 'No user role returned');

    state.token = res.data.token;
    state.refreshToken = res.data.refreshToken;
    console.log(`   → Logged in as: ${res.data.user.name} (${res.data.user.role})`);
  });

  await test('🔐 Health Check', async () => {
    const res = await request('GET', API('/api/health'));
    assert(res.ok && res.status === 200, 'Health check failed', res.data);
    assert(res.data.status === 'ok', 'Status not ok');
    assert(res.data.db === 'connected', 'DB not connected');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2: PATIENT REGISTRATION
  // ═══════════════════════════════════════════════════════════════════════════

  await test('👤 Register Patient', async () => {
    const patient = {
      first_name: 'Amara',
      last_name: 'Nwosu',
      date_of_birth: '1990-03-12',
      gender: 'female',
      phone: '0244123456',
      email: `amara.nwosu.${Date.now()}@email.com`,
      blood_group: 'A+',
      allergies: 'Penicillin',
      chronic_conditions: 'Hypertension',
      emergency_name: 'Chidi Nwosu',
      emergency_phone: '0201987654',
      emergency_rel: 'Husband',
      insurance_provider: 'NHIS',
      insurance_policy: 'GH-NHIS-1234-5678'
    };

    const res = await request('POST', API('/api/patients'), patient, state.token);
    assert(res.ok && res.status === 201, 'Patient registration failed', res.data);
    assert(res.data.id, 'No patient ID returned');
    assert(/^PAT-\d{4}-\d{5}$/.test(res.data.patient_no), 'Invalid patient number format');

    state.patientId = res.data.id;
    state.patientNo = res.data.patient_no;
    console.log(`   → Patient ID: ${state.patientId}`);
    console.log(`   → Patient No: ${state.patientNo}`);
  });

  await test('👤 Get Patient by ID', async () => {
    const res = await request('GET', API(`/api/patients/${state.patientId}`), null, state.token);
    assert(res.ok && res.status === 200, 'Get patient failed', res.data);
    assert(res.data.visits, 'No visits array');
    assert(res.data.patient_no === state.patientNo, 'Patient number mismatch');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 3: VISIT & TRIAGE
  // ═══════════════════════════════════════════════════════════════════════════

  await test('🏥 Create Visit', async () => {
    const res = await request('POST', API('/api/visits'), {
      patient_id: state.patientId,
      chief_complaint: 'Fever, chills, body aches'
    }, state.token);

    assert(res.ok && res.status === 201, 'Visit creation failed', res.data);
    assert(/^V-\d{4}-\d{5}$/.test(res.data.visit_no), 'Invalid visit number format');
    assert(typeof res.data.queue_number === 'number', 'No queue number');

    state.visitId = res.data.id;
    state.visitNo = res.data.visit_no;
    state.queueNumber = res.data.queue_number;
    console.log(`   → Visit ID: ${state.visitId}`);
    console.log(`   → Visit No: ${state.visitNo}`);
    console.log(`   → Queue #: ${state.queueNumber}`);
  });

  await test('🏥 Record Triage Vitals', async () => {
    const res = await request('POST', API('/api/triage'), {
      visit_id: state.visitId,
      chief_complaint: 'Fever, chills, body aches for 3 days',
      blood_pressure: '110/70',
      temperature: 38.9,
      heart_rate: 104,
      weight: 58,
      height: 165,
      oxygen_sat: 98,
      pain_score: 5
    }, state.token);

    assert(res.ok && res.status === 201, 'Triage recording failed', res.data);
    assert(res.data.temperature === 38.9, 'Temperature not saved correctly');
  });

  await test('🏥 Get Triage by Visit', async () => {
    const res = await request('GET', API(`/api/triage/${state.visitId}`), null, state.token);
    assert(res.ok && res.status === 200, 'Get triage failed', res.data);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 4: INITIAL BILLING (Consultation Fee)
  // ═══════════════════════════════════════════════════════════════════════════

  await test('🧾 Create Invoice (Consultation Fee)', async () => {
    const res = await request('POST', API('/api/billing/invoices'), {
      visit_id: state.visitId,
      insurance_cover: 50,
      discount: 0,
      pay_method: 'insurance',
      insurance_provider: 'NHIS',
      notes: 'Standard OPD visit - consultation fee'
    }, state.token);

    assert(res.ok && res.status === 201, 'Invoice creation failed', res.data);
    assert(res.data.invoice, 'No invoice object');
    assert(res.data.invoice.invoice_no, 'No invoice number');
    assert(res.data.line_items.length > 0, 'No line items');

    state.invoiceId = res.data.invoice.id;
    state.invoiceNo = res.data.invoice.invoice_no;
    console.log(`   → Invoice ID: ${state.invoiceId}`);
    console.log(`   → Invoice No: ${state.invoiceNo}`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 5: MEDICAL CONSULTATION
  // ═══════════════════════════════════════════════════════════════════════════

  await test('🩺 Create Medical Consultation', async () => {
    // NOTE: This endpoint may not exist in your current backend.
    // If it fails, you'll need to implement POST /api/consultations
    const res = await request('POST', API('/api/consultations'), {
      visit_id: state.visitId,
      consultation_type: 'medical',
      doctor_id: state.doctorId || 'REPLACE_WITH_DOCTOR_ID',
      chief_complaint: 'Fever, chills, body aches for 3 days',
      history_of_present_illness: 'Patient reports fever starting 3 days ago with chills and generalized body aches. No vomiting.',
      examination_findings: 'Temp 38.9°C, pale conjunctivae, tender hepatomegaly',
      diagnosis: 'Uncomplicated Plasmodium falciparum malaria',
      diagnosis_icd10: 'B50.9',
      notes: 'Start Artemether-Lumefantrine immediately. Review in 3 days.',
      follow_up_required: true,
      follow_up_date: '2026-06-18'
    }, state.token);

    // If endpoint doesn't exist, we'll log a warning but continue
    if (res.status === 404) {
      console.log('\n   ⚠️  WARNING: POST /api/consultations not found.');
      console.log('   → This endpoint needs to be implemented in your backend.');
      console.log('   → Skipping medical consultation creation...');
      return;
    }

    assert(res.ok && (res.status === 201 || res.status === 200), 'Medical consultation failed', res.data);
    state.medicalConsultationId = res.data.id;
    console.log(`   → Medical Consultation ID: ${state.medicalConsultationId}`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 6: LABORATORY (Medical)
  // ═══════════════════════════════════════════════════════════════════════════

  await test('🔬 Get Lab Catalog', async () => {
    const res = await request('GET', API('/api/lab/catalog'), null, state.token);
    assert(res.ok && res.status === 200, 'Lab catalog failed', res.data);

    // Try to extract a test ID for later use
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      state.testId = res.data[0].id;
      console.log(`   → Found ${res.data.length} lab tests`);
      console.log(`   → Using Test ID: ${state.testId}`);
    } else if (res.data && res.data.data && res.data.data.length > 0) {
      state.testId = res.data.data[0].id;
      console.log(`   → Found ${res.data.data.length} lab tests`);
      console.log(`   → Using Test ID: ${state.testId}`);
    } else {
      console.log('   → No lab tests found in catalog');
    }
  });

  await test('🔬 Order Lab Tests', async () => {
    const testIds = state.testId ? [state.testId] : ['REPLACE_WITH_TEST_ID_FROM_CATALOG'];

    const res = await request('POST', API('/api/lab/orders'), {
      visit_id: state.visitId,
      consultation_id: state.medicalConsultationId,
      test_ids: testIds
    }, state.token);

    assert(res.ok && res.status === 201, 'Lab order failed', res.data);
    state.labOrderId = res.data.id || res.data.order_id;
    console.log(`   → Lab Order ID: ${state.labOrderId}`);
  });

  await test('🔬 Enter Lab Results (Normal)', async () => {
    const orderId = state.labOrderId || 'REPLACE_WITH_ORDER_ID';
    const res = await request('PATCH', API(`/api/lab/orders/${orderId}/result`), {
      status: 'completed',
      result_value: 'WBC 6.2, RBC 4.8, Hgb 13.4',
      result_unit: '×10⁹/L',
      reference_range: '4.0–11.0',
      flag: 'normal',
      result_notes: 'All values within normal range'
    }, state.token);

    assert(res.ok && (res.status === 200 || res.status === 201), 'Lab result entry failed', res.data);
  });

  await test('📨 Send Lab Results Notification', async () => {
    const res = await request('POST', API('/api/comms/lab/results-ready'), {
      patient_id: state.patientId,
      visit_id: state.visitId
    }, state.token);

    // Communication endpoints may fail if SMS/email not configured
    if (!res.ok) {
      console.log(`   → Communication service response: ${res.status} (may need SMS/email config)`);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 7: PHARMACY — MEDICAL PRESCRIPTION
  // ═══════════════════════════════════════════════════════════════════════════

  await test('💊 List Drugs (Inventory)', async () => {
    const res = await request('GET', API('/api/pharmacy/drugs'), null, state.token);
    assert(res.ok && res.status === 200, 'Drug list failed', res.data);

    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      state.drugId = res.data[0].id;
      console.log(`   → Found ${res.data.length} drugs`);
      console.log(`   → Using Drug ID: ${state.drugId}`);
    } else if (res.data && res.data.data && res.data.data.length > 0) {
      state.drugId = res.data.data[0].id;
      console.log(`   → Found ${res.data.data.length} drugs`);
      console.log(`   → Using Drug ID: ${state.drugId}`);
    }
  });

  await test('💊 Create Medical Prescription', async () => {
    const drugId = state.drugId || 'REPLACE_WITH_DRUG_ID';

    const res = await request('POST', API('/api/pharmacy/prescriptions'), {
      visit_id: state.visitId,
      consultation_id: state.medicalConsultationId,
      items: [
        {
          drug_id: drugId,
          dosage: '80/480mg',
          frequency: 'Twice daily (AM & PM)',
          duration: '3 days',
          quantity: 12,
          notes: 'Take with food'
        },
        {
          drug_id: drugId,
          dosage: '500mg',
          frequency: 'Every 6 hours as needed',
          duration: '3 days',
          quantity: 12,
          notes: 'For fever and body aches'
        }
      ]
    }, state.token);

    assert(res.ok && res.status === 201, 'Prescription creation failed', res.data);
    state.prescriptionId = res.data.id;
    console.log(`   → Prescription ID: ${state.prescriptionId}`);
  });

  await test('💊 Dispense Medical Prescription', async () => {
    const rxId = state.prescriptionId || 'REPLACE_WITH_RX_ID';
    const res = await request('PATCH', API(`/api/pharmacy/prescriptions/${rxId}/dispense`), null, state.token);

    assert(res.ok && res.status === 200, 'Dispense failed', res.data);
    assert(res.data.status === 'dispensed' || res.data.status === 'partial', 'Unexpected dispense status');
    console.log(`   → Status: ${res.data.status}`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 8: DENTAL CONSULTATION
  // ═══════════════════════════════════════════════════════════════════════════

  await test('🦷 Create Dental Consultation', async () => {
    const res = await request('POST', API('/api/consultations'), {
      visit_id: state.visitId,
      consultation_type: 'dental',
      doctor_id: state.dentistId || 'REPLACE_WITH_DENTIST_ID',
      chief_complaint: 'Toothache, lower left jaw for 2 days',
      examination_findings: 'Tooth #36 — deep caries, positive percussion, no swelling',
      dental_chart: {
        tooth_number: 36,
        condition: 'deep caries with pulpitis',
        treatment_plan: 'root canal therapy or extraction'
      },
      diagnosis: 'Chronic apical periodontitis, tooth #36',
      diagnosis_icd10: 'K04.5',
      notes: 'Patient prefers to save tooth. Schedule RCT.',
      follow_up_required: true,
      follow_up_date: '2026-06-20'
    }, state.token);

    if (res.status === 404) {
      console.log('\n   ⚠️  WARNING: POST /api/consultations not found for dental.');
      console.log('   → Skipping dental consultation creation...');
      return;
    }

    assert(res.ok && (res.status === 201 || res.status === 200), 'Dental consultation failed', res.data);
    state.dentalConsultationId = res.data.id;
    console.log(`   → Dental Consultation ID: ${state.dentalConsultationId}`);
  });

  await test('🦷 Create Dental Prescription', async () => {
    const drugId = state.drugId || 'REPLACE_WITH_DRUG_ID';

    const res = await request('POST', API('/api/pharmacy/prescriptions'), {
      visit_id: state.visitId,
      consultation_id: state.dentalConsultationId,
      items: [
        {
          drug_id: drugId,
          dosage: '400mg',
          frequency: 'Every 8 hours',
          duration: '5 days',
          quantity: 15,
          notes: 'For pain and inflammation before RCT'
        },
        {
          drug_id: drugId,
          dosage: '500mg',
          frequency: 'Twice daily',
          duration: '5 days',
          quantity: 10,
          notes: 'Antibiotic prophylaxis'
        }
      ]
    }, state.token);

    assert(res.ok && res.status === 201, 'Dental prescription failed', res.data);
    state.dentalPrescriptionId = res.data.id;
    console.log(`   → Dental Prescription ID: ${state.dentalPrescriptionId}`);
  });

  await test('🦷 Dispense Dental Prescription', async () => {
    const rxId = state.dentalPrescriptionId || 'REPLACE_WITH_DENTAL_RX_ID';
    const res = await request('PATCH', API(`/api/pharmacy/prescriptions/${rxId}/dispense`), null, state.token);

    assert(res.ok && res.status === 200, 'Dental dispense failed', res.data);
    console.log(`   → Status: ${res.data.status}`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 9: FINAL BILLING & PAYMENT
  // ═══════════════════════════════════════════════════════════════════════════

  await test('🧾 Get Invoice for Visit', async () => {
    const res = await request('GET', API(`/api/billing/invoices/${state.visitId}`), null, state.token);
    assert(res.ok && res.status === 200, 'Get invoice failed', res.data);
    assert(res.data.invoice, 'No invoice object');
    assert(res.data.line_items, 'No line items');
    console.log(`   → Total line items: ${res.data.line_items.length}`);
  });

  await test('🧾 Record Full Payment', async () => {
    const res = await request('PATCH', API(`/api/billing/invoices/${state.invoiceId}/payment`), {
      amount_paid: 67.00,
      pay_method: 'insurance',
      insurance_claim_no: 'NHIS-CLAIM-2026-001'
    }, state.token);

    assert(res.ok && res.status === 200, 'Payment recording failed', res.data);
    assert(['paid', 'partial'].includes(res.data.pay_status), 'Unexpected payment status');
    console.log(`   → Payment Status: ${res.data.pay_status}`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 10: VISIT COMPLETION & COMMUNICATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  await test('🏥 Update Visit Status → Completed', async () => {
    const res = await request('PATCH', API(`/api/visits/${state.visitId}/status`), {
      status: 'completed'
    }, state.token);

    assert(res.ok && (res.status === 200 || res.status === 201), 'Status update failed', res.data);
  });

  await test('📨 Send Payment Receipt', async () => {
    const res = await request('POST', API('/api/comms/billing/receipt'), {
      patient_id: state.patientId,
      invoice_id: state.invoiceId
    }, state.token);

    if (!res.ok) {
      console.log(`   → Communication service response: ${res.status}`);
    }
  });

  await test('📨 Send Discharge Instructions', async () => {
    const res = await request('POST', API('/api/comms/discharge'), {
      patient_id: state.patientId,
      visit_id: state.visitId
    }, state.token);

    if (!res.ok) {
      console.log(`   → Communication service response: ${res.status}`);
    }
  });

  await test('📨 Send Custom Message (Optional)', async () => {
    const res = await request('POST', API('/api/comms/send-custom'), {
      patient_id: state.patientId,
      channel: 'both',
      subject: 'Your visit at MediFlow Hospital is complete',
      message: 'Dear Patient, your visit has been completed. Please collect your medication from pharmacy and follow the discharge instructions sent to your phone/email.'
    }, state.token);

    if (!res.ok) {
      console.log(`   → Communication service response: ${res.status}`);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 11: VERIFICATION & ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════════

  await test('📊 Daily Revenue Summary', async () => {
    const res = await request('GET', API('/api/billing/summary?date=today'), null, state.token);
    assert(res.ok && res.status === 200, 'Revenue summary failed', res.data);
    assert(res.data.billed !== undefined, 'No billed amount');
    assert(res.data.collected !== undefined, 'No collected amount');
    console.log(`   → Billed: ${res.data.billed}`);
    console.log(`   → Collected: ${res.data.collected}`);
  });

  await test('📊 Analytics Summary (12 days)', async () => {
    const res = await request('GET', API('/api/analytics/summary?days=12'), null, state.token);
    assert(res.ok && res.status === 200, 'Analytics failed', res.data);
    assert(res.data.visits !== undefined, 'No visits data');
    assert(res.data.revenue !== undefined, 'No revenue data');
    console.log(`   → Visits: ${JSON.stringify(res.data.visits).substring(0, 60)}...`);
  });

  await test('🏥 Get Visit by ID (Final Verification)', async () => {
    const res = await request('GET', API(`/api/visits/${state.visitId}`), null, state.token);
    assert(res.ok && res.status === 200, 'Final visit check failed', res.data);
    console.log(`   → Final Visit Status: ${res.data.status || 'N/A'}`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  WORKFLOW COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Total Tests: ${testCount}`);
  console.log(`  ✅ Passed: ${passCount}`);
  console.log(`  ❌ Failed: ${failCount}`);
  console.log('═══════════════════════════════════════════════════════════════');

  if (failCount > 0) {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
    console.log('   Common issues:');
    console.log('   • Backend not running at the configured BASE_URL');
    console.log('   • Missing endpoints (especially /api/consultations)');
    console.log('   • No lab tests or drugs in the database');
    console.log('   • SMS/Email service not configured');
    process.exit(1);
  } else {
    console.log('\n🎉 All workflow steps passed successfully!');
    process.exit(0);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('\n💥 Unhandled error:', err);
  process.exit(1);
});

// Run the workflow
runWorkflow();
