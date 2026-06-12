/**
 * ============================================================================
 * MEDIFLOW OPD — CONSULTATION API MODULE
 * ============================================================================
 * 
 * Backend endpoints for Medical and Dental consultations.
 * Integrates with existing MediFlow auth, patients, visits, lab, pharmacy,
 * billing, and communications modules.
 * 
 * File: routes/consultations.js
 * Mount: app.use('/api/consultations', require('./routes/consultations'))
 * 
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE SCHEMA (Add these to your existing database setup)
// ─────────────────────────────────────────────────────────────────────────────

/*
-- Table: consultations
CREATE TABLE consultations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id        UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    consultation_type VARCHAR(20) NOT NULL CHECK (consultation_type IN ('medical', 'dental', 'both')),
    doctor_id       UUID REFERENCES users(id),

    -- Common fields
    chief_complaint TEXT NOT NULL,
    history_of_present_illness TEXT,
    examination_findings TEXT,
    diagnosis       TEXT,
    diagnosis_icd10 VARCHAR(10),
    notes           TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date  DATE,

    -- Dental-specific (stored as JSONB for flexibility)
    dental_chart    JSONB,
    dental_procedure TEXT,
    dental_images   JSONB DEFAULT '[]',

    -- AI-assisted fields
    ai_suggestions  JSONB,
    ai_confidence   DECIMAL(3,2),

    -- Status & timestamps
    status          VARCHAR(20) DEFAULT 'in_progress' 
                    CHECK (status IN ('in_progress', 'completed', 'cancelled')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at    TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_consultations_visit ON consultations(visit_id);
CREATE INDEX idx_consultations_doctor ON consultations(doctor_id);
CREATE INDEX idx_consultations_type ON consultations(consultation_type);
CREATE INDEX idx_consultations_status ON consultations(status);

-- Table: consultation_attachments (for files, images, etc.)
CREATE TABLE consultation_attachments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    file_type       VARCHAR(50) NOT NULL,
    file_url        TEXT NOT NULL,
    description     TEXT,
    uploaded_by     UUID REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
*/

// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────

// Auth middleware (reuse your existing auth middleware)
const authenticate = (req, res, next) => {
  // Your existing JWT verification logic
  // Sets req.user = { id, role, name, email }
  next();
};

// Role-based access control
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `Required role: ${roles.join(' or ')}` 
      });
    }
    next();
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// AI DIAGNOSIS HELPER (Mock — replace with real AI integration)
// ─────────────────────────────────────────────────────────────────────────────

async function getAIDiagnosisSuggestion(consultationData) {
  // TODO: Integrate with your AI service (OpenAI, local model, etc.)
  // This is a mock implementation for demonstration

  const { chief_complaint, examination_findings, consultation_type } = consultationData;

  const mockSuggestions = {
    medical: {
      differential: [
        { diagnosis: 'Uncomplicated malaria', confidence: 0.85, icd10: 'B50.9' },
        { diagnosis: 'Typhoid fever', confidence: 0.60, icd10: 'A01.0' },
        { diagnosis: 'Viral hepatitis', confidence: 0.35, icd10: 'B19.9' }
      ],
      recommended_tests: ['Malaria RDT', 'Full Blood Count', 'Widal Test'],
      recommended_drugs: [
        { name: 'Artemether-Lumefantrine', dosage: '80/480mg', duration: '3 days' }
      ],
      red_flags: ['Jaundice', 'Altered consciousness', 'Severe anemia'],
      follow_up: 'Review in 3 days or immediately if condition worsens'
    },
    dental: {
      differential: [
        { diagnosis: 'Chronic apical periodontitis', confidence: 0.78, icd10: 'K04.5' },
        { diagnosis: 'Dental caries with pulpitis', confidence: 0.92, icd10: 'K02.9' },
        { diagnosis: 'Periapical abscess', confidence: 0.45, icd10: 'K04.7' }
      ],
      recommended_imaging: ['Periapical X-ray', 'OPG'],
      recommended_procedures: ['Root Canal Therapy', 'Extraction (if RCT not possible)'],
      recommended_drugs: [
        { name: 'Ibuprofen', dosage: '400mg', duration: '5 days' },
        { name: 'Amoxicillin', dosage: '500mg', duration: '5 days' }
      ],
      follow_up: 'Schedule RCT within 1 week'
    }
  };

  return mockSuggestions[consultation_type] || mockSuggestions.medical;
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/consultations
 * Create a new consultation (Medical or Dental)
 * 
 * Body: {
 *   visit_id: string (required),
 *   consultation_type: 'medical' | 'dental' | 'both' (required),
 *   doctor_id: string (required),
 *   chief_complaint: string (required),
 *   history_of_present_illness: string,
 *   examination_findings: string,
 *   diagnosis: string,
 *   diagnosis_icd10: string,
 *   notes: string,
 *   follow_up_required: boolean,
 *   follow_up_date: string (YYYY-MM-DD),
 *   
 *   // Dental-specific
 *   dental_chart: {
 *     tooth_number: number,
 *     condition: string,
 *     treatment_plan: string
 *   },
 *   dental_procedure: string,
 *   dental_images: string[],
 *   
 *   // AI
 *   use_ai: boolean (default: false)
 * }
 */
router.post('/', authenticate, requireRole('doctor', 'admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const {
      visit_id,
      consultation_type,
      doctor_id,
      chief_complaint,
      history_of_present_illness,
      examination_findings,
      diagnosis,
      diagnosis_icd10,
      notes,
      follow_up_required,
      follow_up_date,
      dental_chart,
      dental_procedure,
      dental_images,
      use_ai = false
    } = req.body;

    // ─── Validation ───
    if (!visit_id || !consultation_type || !doctor_id || !chief_complaint) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'visit_id, consultation_type, doctor_id, and chief_complaint are required'
      });
    }

    const validTypes = ['medical', 'dental', 'both'];
    if (!validTypes.includes(consultation_type)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `consultation_type must be one of: ${validTypes.join(', ')}`
      });
    }

    // ─── Verify visit exists ───
    const visitCheck = await db.query(
      'SELECT id, patient_id, status FROM visits WHERE id = $1',
      [visit_id]
    );
    if (visitCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Visit not found' });
    }
    const visit = visitCheck.rows[0];

    // ─── Verify doctor exists ───
    const doctorCheck = await db.query(
      'SELECT id, role FROM users WHERE id = $1 AND is_active = true',
      [doctor_id]
    );
    if (doctorCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Doctor not found or inactive' });
    }

    // ─── AI Suggestion (if requested) ───
    let ai_suggestions = null;
    let ai_confidence = null;

    if (use_ai) {
      try {
        const aiResult = await getAIDiagnosisSuggestion({
          chief_complaint,
          examination_findings,
          consultation_type
        });
        ai_suggestions = aiResult;
        ai_confidence = aiResult.differential?.[0]?.confidence || null;
      } catch (aiErr) {
        console.error('AI suggestion failed:', aiErr.message);
        // Continue without AI — don't fail the request
      }
    }

    // ─── Insert consultation ───
    const insertQuery = `
      INSERT INTO consultations (
        visit_id, consultation_type, doctor_id,
        chief_complaint, history_of_present_illness, examination_findings,
        diagnosis, diagnosis_icd10, notes,
        follow_up_required, follow_up_date,
        dental_chart, dental_procedure, dental_images,
        ai_suggestions, ai_confidence,
        status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const values = [
      visit_id, consultation_type, doctor_id,
      chief_complaint, history_of_present_illness || null, examination_findings || null,
      diagnosis || null, diagnosis_icd10 || null, notes || null,
      follow_up_required || false, follow_up_date || null,
      dental_chart ? JSON.stringify(dental_chart) : null,
      dental_procedure || null,
      dental_images ? JSON.stringify(dental_images) : '[]',
      ai_suggestions ? JSON.stringify(ai_suggestions) : null,
      ai_confidence,
      'in_progress'
    ];

    const result = await db.query(insertQuery, values);
    const consultation = result.rows[0];

    // ─── Update visit status ───
    await db.query(
      "UPDATE visits SET status = 'consultation', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [visit_id]
    );

    // ─── Audit log ───
    await db.query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, created_at)
       VALUES ($1, 'CREATE', 'consultation', $2, $3, CURRENT_TIMESTAMP)`,
      [
        req.user.id,
        consultation.id,
        JSON.stringify({ consultation_type, visit_id, doctor_id, diagnosis })
      ]
    );

    // ─── Response ───
    res.status(201).json({
      success: true,
      message: `${consultation_type.charAt(0).toUpperCase() + consultation_type.slice(1)} consultation created`,
      data: {
        ...consultation,
        ai_suggestions: consultation.ai_suggestions,
        dental_chart: consultation.dental_chart,
        dental_images: consultation.dental_images
      }
    });

  } catch (err) {
    console.error('Create consultation error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

/**
 * GET /api/consultations
 * List all consultations (with filters)
 * 
 * Query params:
 *   visit_id: filter by visit
 *   patient_id: filter by patient (joins through visits)
 *   doctor_id: filter by doctor
 *   consultation_type: medical | dental | both
 *   status: in_progress | completed | cancelled
 *   date_from, date_to: date range
 *   page, limit: pagination
 */
router.get('/', authenticate, requireRole('doctor', 'admin', 'receptionist'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const {
      visit_id,
      patient_id,
      doctor_id,
      consultation_type,
      status,
      date_from,
      date_to,
      page = 1,
      limit = 20
    } = req.query;

    let whereClauses = [];
    let values = [];
    let paramIndex = 1;

    if (visit_id) {
      whereClauses.push(`c.visit_id = $${paramIndex++}`);
      values.push(visit_id);
    }
    if (doctor_id) {
      whereClauses.push(`c.doctor_id = $${paramIndex++}`);
      values.push(doctor_id);
    }
    if (consultation_type) {
      whereClauses.push(`c.consultation_type = $${paramIndex++}`);
      values.push(consultation_type);
    }
    if (status) {
      whereClauses.push(`c.status = $${paramIndex++}`);
      values.push(status);
    }
    if (date_from) {
      whereClauses.push(`c.created_at >= $${paramIndex++}`);
      values.push(`${date_from}T00:00:00`);
    }
    if (date_to) {
      whereClauses.push(`c.created_at <= $${paramIndex++}`);
      values.push(`${date_to}T23:59:59`);
    }
    if (patient_id) {
      whereClauses.push(`v.patient_id = $${paramIndex++}`);
      values.push(patient_id);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Main query with joins
    const query = `
      SELECT 
        c.*,
        v.visit_no,
        v.patient_id,
        p.first_name || ' ' || p.last_name as patient_name,
        p.patient_no,
        u.full_name as doctor_name,
        u.department as doctor_department
      FROM consultations c
      JOIN visits v ON c.visit_id = v.id
      JOIN patients p ON v.patient_id = p.id
      JOIN users u ON c.doctor_id = u.id
      ${whereStr}
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    values.push(parseInt(limit), offset);

    const countQuery = `
      SELECT COUNT(*) FROM consultations c
      JOIN visits v ON c.visit_id = v.id
      ${whereStr}
    `;

    const [dataResult, countResult] = await Promise.all([
      db.query(query, values),
      db.query(countQuery, values.slice(0, -2)) // Remove limit/offset for count
    ]);

    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: dataResult.rows.map(row => ({
        ...row,
        ai_suggestions: row.ai_suggestions,
        dental_chart: row.dental_chart,
        dental_images: row.dental_images
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (err) {
    console.error('List consultations error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

/**
 * GET /api/consultations/:id
 * Get a single consultation by ID
 */
router.get('/:id', authenticate, requireRole('doctor', 'admin', 'receptionist'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    const query = `
      SELECT 
        c.*,
        v.visit_no,
        v.patient_id,
        v.chief_complaint as visit_chief_complaint,
        p.first_name || ' ' || p.last_name as patient_name,
        p.patient_no,
        p.phone as patient_phone,
        p.email as patient_email,
        u.full_name as doctor_name,
        u.department as doctor_department,
        u.phone as doctor_phone
      FROM consultations c
      JOIN visits v ON c.visit_id = v.id
      JOIN patients p ON v.patient_id = p.id
      JOIN users u ON c.doctor_id = u.id
      WHERE c.id = $1
    `;

    const result = await db.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Consultation not found' });
    }

    // Get associated data
    const [labOrders, prescriptions, attachments] = await Promise.all([
      db.query('SELECT * FROM lab_orders WHERE consultation_id = $1', [id]),
      db.query('SELECT * FROM prescriptions WHERE consultation_id = $1', [id]),
      db.query('SELECT * FROM consultation_attachments WHERE consultation_id = $1', [id])
    ]);

    const consultation = result.rows[0];

    res.json({
      success: true,
      data: {
        ...consultation,
        ai_suggestions: consultation.ai_suggestions,
        dental_chart: consultation.dental_chart,
        dental_images: consultation.dental_images,
        lab_orders: labOrders.rows,
        prescriptions: prescriptions.rows,
        attachments: attachments.rows
      }
    });

  } catch (err) {
    console.error('Get consultation error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

/**
 * GET /api/consultations/visit/:visit_id
 * Get all consultations for a specific visit
 */
router.get('/visit/:visit_id', authenticate, requireRole('doctor', 'admin', 'receptionist'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { visit_id } = req.params;

    const query = `
      SELECT 
        c.*,
        u.full_name as doctor_name,
        u.department as doctor_department
      FROM consultations c
      JOIN users u ON c.doctor_id = u.id
      WHERE c.visit_id = $1
      ORDER BY c.created_at ASC
    `;

    const result = await db.query(query, [visit_id]);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        ...row,
        ai_suggestions: row.ai_suggestions,
        dental_chart: row.dental_chart,
        dental_images: row.dental_images
      }))
    });

  } catch (err) {
    console.error('Get visit consultations error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

/**
 * PATCH /api/consultations/:id
 * Update a consultation (add diagnosis, notes, complete, etc.)
 * 
 * Body: Any subset of consultation fields
 */
router.patch('/:id', authenticate, requireRole('doctor', 'admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const updates = req.body;

    // ─── Check if consultation exists ───
    const checkResult = await db.query('SELECT * FROM consultations WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Consultation not found' });
    }
    const existing = checkResult.rows[0];

    // ─── Build dynamic update ───
    const allowedFields = [
      'chief_complaint', 'history_of_present_illness', 'examination_findings',
      'diagnosis', 'diagnosis_icd10', 'notes',
      'follow_up_required', 'follow_up_date',
      'dental_chart', 'dental_procedure', 'dental_images',
      'status'
    ];

    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (['dental_chart', 'dental_images', 'ai_suggestions'].includes(key)) {
          setClauses.push(`${key} = $${paramIndex++}`);
          values.push(JSON.stringify(value));
        } else {
          setClauses.push(`${key} = $${paramIndex++}`);
          values.push(value);
        }
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'Bad Request', message: 'No valid fields to update' });
    }

    // If completing, set completed_at
    if (updates.status === 'completed') {
      setClauses.push(`completed_at = CURRENT_TIMESTAMP`);
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE consultations
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    const consultation = result.rows[0];

    // ─── Audit log ───
    await db.query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, created_at)
       VALUES ($1, 'UPDATE', 'consultation', $2, $3, CURRENT_TIMESTAMP)`,
      [req.user.id, id, JSON.stringify(updates)]
    );

    res.json({
      success: true,
      message: 'Consultation updated',
      data: {
        ...consultation,
        ai_suggestions: consultation.ai_suggestions,
        dental_chart: consultation.dental_chart,
        dental_images: consultation.dental_images
      }
    });

  } catch (err) {
    console.error('Update consultation error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

/**
 * POST /api/consultations/:id/complete
 * Mark consultation as completed
 * 
 * Body: {
 *   final_diagnosis: string,
 *   final_notes: string,
 *   next_appointment_date: string (optional)
 * }
 */
router.post('/:id/complete', authenticate, requireRole('doctor', 'admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { final_diagnosis, final_notes, next_appointment_date } = req.body;

    const checkResult = await db.query('SELECT * FROM consultations WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Consultation not found' });
    }

    const result = await db.query(
      `UPDATE consultations 
       SET status = 'completed', 
           diagnosis = COALESCE($1, diagnosis),
           notes = COALESCE($2, notes),
           completed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [final_diagnosis || null, final_notes || null, id]
    );

    const consultation = result.rows[0];

    // ─── If visit has no more active consultations, mark visit for billing ───
    const activeConsults = await db.query(
      "SELECT COUNT(*) FROM consultations WHERE visit_id = $1 AND status = 'in_progress'",
      [consultation.visit_id]
    );

    if (parseInt(activeConsults.rows[0].count) === 0) {
      await db.query(
        "UPDATE visits SET status = 'billing', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [consultation.visit_id]
      );
    }

    // ─── Schedule follow-up appointment if requested ───
    if (next_appointment_date) {
      // This would call your appointments module
      console.log(`Follow-up appointment requested for ${next_appointment_date}`);
    }

    res.json({
      success: true,
      message: 'Consultation completed',
      data: consultation
    });

  } catch (err) {
    console.error('Complete consultation error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

/**
 * POST /api/consultations/:id/ai-suggest
 * Get AI diagnosis suggestions for a consultation
 */
router.post('/:id/ai-suggest', authenticate, requireRole('doctor', 'admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    const result = await db.query('SELECT * FROM consultations WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Consultation not found' });
    }

    const consultation = result.rows[0];
    const suggestions = await getAIDiagnosisSuggestion({
      chief_complaint: consultation.chief_complaint,
      examination_findings: consultation.examination_findings,
      consultation_type: consultation.consultation_type
    });

    // Save suggestions to consultation
    await db.query(
      'UPDATE consultations SET ai_suggestions = $1, ai_confidence = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [JSON.stringify(suggestions), suggestions.differential?.[0]?.confidence || null, id]
    );

    res.json({
      success: true,
      data: suggestions
    });

  } catch (err) {
    console.error('AI suggest error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

/**
 * DELETE /api/consultations/:id
 * Cancel/delete a consultation (soft delete via status)
 */
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    const result = await db.query(
      "UPDATE consultations SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Consultation not found' });
    }

    res.json({
      success: true,
      message: 'Consultation cancelled',
      data: result.rows[0]
    });

  } catch (err) {
    console.error('Cancel consultation error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD / ANALYTICS ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/consultations/stats/doctor/:doctor_id
 * Get consultation statistics for a doctor
 */
router.get('/stats/doctor/:doctor_id', authenticate, requireRole('doctor', 'admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { doctor_id } = req.params;
    const { date_from, date_to } = req.query;

    const query = `
      SELECT 
        consultation_type,
        status,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/60) as avg_duration_minutes
      FROM consultations
      WHERE doctor_id = $1
        AND ($2::timestamp IS NULL OR created_at >= $2)
        AND ($3::timestamp IS NULL OR created_at <= $3)
      GROUP BY consultation_type, status
    `;

    const result = await db.query(query, [
      doctor_id,
      date_from ? `${date_from}T00:00:00` : null,
      date_to ? `${date_to}T23:59:59` : null
    ]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error('Doctor stats error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

/**
 * GET /api/consultations/stats/overview
 * Get overall consultation statistics (admin only)
 */
router.get('/stats/overview', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { days = 30 } = req.query;

    const query = `
      SELECT 
        consultation_type,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '1 day') as today
      FROM consultations
      WHERE created_at >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
      GROUP BY consultation_type
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      period_days: parseInt(days),
      data: result.rows
    });

  } catch (err) {
    console.error('Overview stats error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

module.exports = router;
