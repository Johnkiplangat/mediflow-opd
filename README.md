# MediFlow OPD — Complete Frontend + Backend Package

## 📁 Files Overview

### Backend Files
| File | Description |
|------|-------------|
| `consultations.js` | Express.js route module for Medical & Dental consultations |
| `INTEGRATION_GUIDE.md` | Step-by-step backend setup instructions |
| `mediflow-postman-v3.1.json` | Updated Postman collection with consultation endpoints |
| `mediflow-e2e.js` | End-to-end test script for the complete workflow |

### Frontend Files
| File | Description |
|------|-------------|
| `mediflow-login.html` | Login page with health check & demo credentials |
| `mediflow-dashboard.html` | Patient queue, stats, appointments, quick actions |
| `mediflow-consultation-ui.html` | Medical & Dental consultation screens |
| `mediflow-billing.html` | Invoice, payment recording, receipt generation |

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
# Copy the consultation routes
cp consultations.js /your-mediflow/routes/

# Mount in your main app.js
app.use('/api/consultations', require('./routes/consultations'));

# Run database migrations (SQL in INTEGRATION_GUIDE.md)
psql -d mediflow -f schema.sql

# Install dependencies
npm install uuid
```

### 2. Frontend Setup

No build step required! Just open the HTML files in a browser:

```bash
# Option 1: Direct open
open mediflow-login.html

# Option 2: Serve via local server
npx serve .
# Visit http://localhost:3000/mediflow-login.html
```

---

## 🔄 Application Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  mediflow-      │────▶│  mediflow-       │────▶│  mediflow-          │
│  login.html     │     │  dashboard.html  │     │  consultation-      │
│                 │     │                  │     │  ui.html              │
│ • Health check│     │ • Patient queue  │     │                      │
│ • Demo creds  │     │ • Quick actions  │     │ • Medical consult    │
│ • JWT auth    │     │ • Appointments   │     │ • Dental chart       │
└─────────────────┘     └──────────────────┘     │ • AI diagnosis       │
                                                  │ • Prescriptions      │
                                                  └─────────────────────┘
                                                            │
                                                            ▼
                                                  ┌─────────────────────┐
                                                  │  mediflow-          │
                                                  │  billing.html       │
                                                  │                      │
                                                  │ • Invoice display    │
                                                  │ • Payment recording  │
                                                  │ • Receipt generation │
                                                  │ • Visit completion   │
                                                  └─────────────────────┘
```

---

## 🎨 UI Features

### Login Page
- Gradient branding panel with feature list
- Health check indicator (green = online, red = offline)
- One-click demo credential fill
- Password visibility toggle
- JWT token storage in localStorage

### Dashboard
- **Stats cards**: Today's visits, waiting count, completed, revenue
- **Patient queue table**: Queue #, patient info, complaint, status, wait time, actions
- **Status badges**: Waiting (yellow), In Triage (blue), In Consultation (green), Billing (orange), Completed (gray)
- **Quick actions**: Register Patient, Create Visit, Start Consultation, Process Billing, Order Labs, Dispense Drugs
- **Today's appointments**: Time, patient, type, status

### Consultation UI
- **Triage vitals display**: Color-coded (red = alert)
- **AI Diagnosis Assistant**: Confidence bars, differential diagnoses, recommended tests, red flags, treatment plans
- **Apply AI Diagnosis**: One-click form fill
- **Dental Chart**: Interactive 32-tooth FDI notation grid, click-to-select, condition picker, treatment plan
- **Prescription Builder**: Add/remove drugs with dosage, frequency, duration
- **Action bar**: Save draft, cancel, complete

### Billing Page
- **Invoice display**: Patient info, line items, subtotal, insurance coverage, total, payment history
- **Payment methods**: Cash, Mobile Money, Insurance, Card
- **Dynamic fields**: Insurance claim #, MoMo number/provider
- **Receipt modal**: Styled receipt with PAID stamp, print-ready
- **Complete visit**: Sends discharge instructions, redirects to dashboard

---

## 🔌 API Integration

All frontend files use:
```javascript
const API_BASE = 'http://localhost:4000';
const TOKEN = localStorage.getItem('mediflow_token');
```

Change `API_BASE` to match your backend URL.

---

## 📱 Responsive Design

- **Desktop**: Full sidebar (260px), multi-column layouts
- **Tablet**: Collapsed sidebar (70px icons only)
- **Mobile**: Single column, touch-friendly buttons

---

## 🧪 Testing

```bash
# Run the E2E test
node mediflow-e2e.js

# Or import the Postman collection
# mediflow-postman-v3.1.json
```

---

## 🔮 Next Steps

1. **Connect to real backend**: Update `API_BASE` URLs
2. **Add WebSocket**: Real-time queue updates
3. **Add PWA**: Offline capability for rural clinics
4. **Add print styles**: Better invoice/receipt printing
5. **Add SMS integration**: Twilio or Africa's Talking
