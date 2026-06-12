# MediFlow Consultation API — Integration Guide

## 1. Installation

### Step 1: Copy the route file
```bash
cp consultations.js /path/to/your/mediflow/routes/
```

### Step 2: Mount the router in your main app
```javascript
// app.js or server.js
const consultationRoutes = require('./routes/consultations');
app.use('/api/consultations', consultationRoutes);
```

### Step 3: Run the database migration
Execute the SQL schema at the top of `consultations.js` to create the `consultations` and `consultation_attachments` tables.

### Step 4: Install dependencies (if not already installed)
```bash
npm install uuid
```

---

## 2. Database Schema

Run this SQL in your PostgreSQL database:

```sql
-- Table: consultations
CREATE TABLE consultations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id        UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    consultation_type VARCHAR(20) NOT NULL CHECK (consultation_type IN ('medical', 'dental', 'both')),
    doctor_id       UUID REFERENCES users(id),

    chief_complaint TEXT NOT NULL,
    history_of_present_illness TEXT,
    examination_findings TEXT,
    diagnosis       TEXT,
    diagnosis_icd10 VARCHAR(10),
    notes           TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date  DATE,

    dental_chart    JSONB,
    dental_procedure TEXT,
    dental_images   JSONB DEFAULT '[]',

    ai_suggestions  JSONB,
    ai_confidence   DECIMAL(3,2),

    status          VARCHAR(20) DEFAULT 'in_progress' 
                    CHECK (status IN ('in_progress', 'completed', 'cancelled')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at    TIMESTAMP
);

CREATE INDEX idx_consultations_visit ON consultations(visit_id);
CREATE INDEX idx_consultations_doctor ON consultations(doctor_id);
CREATE INDEX idx_consultations_type ON consultations(consultation_type);
CREATE INDEX idx_consultations_status ON consultations(status);

-- Table: consultation_attachments
CREATE TABLE consultation_attachments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    file_type       VARCHAR(50) NOT NULL,
    file_url        TEXT NOT NULL,
    description     TEXT,
    uploaded_by     UUID REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. AI Integration

Replace the mock `getAIDiagnosisSuggestion()` function with your real AI service:

```javascript
async function getAIDiagnosisSuggestion(consultationData) {
  // Option 1: OpenAI GPT
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a medical diagnosis assistant...' },
      { role: 'user', content: `Chief complaint: ${consultationData.chief_complaint}...` }
    ]
  });

  // Option 2: Local LLM (Ollama, etc.)
  // Option 3: Custom trained model

  return parseAIResponse(response);
}
```

---

## 4. Updated Workflow Sequence

With consultations added, the complete workflow is now:

```
Login
  │
  ▼
Register Patient
  │
  ▼
Create Visit
  │
  ▼
Record Triage Vitals
  │
  ▼
Create Invoice (consultation fee)
  │
  ▼
┌─────────────────────────────────────┐
│  CONSULTATION BRANCHING             │
│  (Medical / Dental / Both)          │
└─────────────────────────────────────┘
  │
  ├──► Create Medical Consultation
  │      ├──► Order Lab Tests
  │      ├──► Enter Results
  │      └──► Create Prescription → Dispense
  │
  └──► Create Dental Consultation
         ├──► Dental Procedure / X-ray
         └──► Create Prescription → Dispense
  │
  ▼
Complete Consultation(s)
  │
  ▼
Final Billing (auto-aggregated)
  │
  ▼
Record Payment
  │
  ▼
Complete Visit
  │
  ▼
Send Receipt + Discharge Instructions
```

---

## 5. API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/consultations` | Create consultation | Doctor/Admin |
| GET | `/api/consultations` | List all consultations | Doctor/Admin/Receptionist |
| GET | `/api/consultations/:id` | Get single consultation | Doctor/Admin/Receptionist |
| GET | `/api/consultations/visit/:visit_id` | Get consultations for visit | Doctor/Admin/Receptionist |
| PATCH | `/api/consultations/:id` | Update consultation | Doctor/Admin |
| POST | `/api/consultations/:id/complete` | Mark as completed | Doctor/Admin |
| POST | `/api/consultations/:id/ai-suggest` | Get AI suggestions | Doctor/Admin |
| DELETE | `/api/consultations/:id` | Cancel consultation | Admin only |
| GET | `/api/consultations/stats/doctor/:id` | Doctor stats | Doctor/Admin |
| GET | `/api/consultations/stats/overview` | Overall stats | Admin only |

---

## 6. Key Features

- **Dual consultation support**: One visit can have both medical AND dental consultations
- **AI-assisted diagnosis**: Optional AI suggestions with confidence scores
- **Dental charting**: Structured tooth number, condition, treatment plan
- **Auto workflow progression**: Completing all consultations auto-updates visit status to 'billing'
- **Audit logging**: All create/update actions are logged
- **Statistics**: Per-doctor and overall consultation analytics
