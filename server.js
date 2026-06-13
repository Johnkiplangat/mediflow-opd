/**
 * MediFlow OPD — Production Server
 * Serves static frontend files + API routes
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Allow inline scripts for now
}));

// CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── API Routes ───
// Mount your existing API routes here
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/patients', require('./routes/patients'));
// app.use('/api/visits', require('./routes/visits'));
// app.use('/api/consultations', require('./routes/consultations'));
// app.use('/api/billing', require('./routes/billing'));
// etc.

// Mock API endpoints for demo (remove in production)
app.post('/api/auth/login', (req, res) => {
    res.json({
        token: 'demo-jwt-token-' + Date.now(),
        refreshToken: 'demo-refresh-token',
        user: {
            id: 'user-1',
            name: 'Dr. Admin User',
            email: req.body.email || 'admin@mediflow.local',
            role: 'admin'
        }
    });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
});

app.post('/api/patients', (req, res) => {
    res.status(201).json({
        id: 'pat-' + Date.now(),
        patient_no: 'PAT-2026-' + String(Math.floor(Math.random() * 90000) + 10000),
        ...req.body
    });
});

// ─── Static Files (Frontend) ───
// Serve all HTML, CSS, JS files from the root folder
app.use(express.static('.'));

// ─── API Routes ───
// Add your pharmacy routes here
const pharmacyRoutes = require('./routes/pharmacy');
app.use('/api/pharmacy', pharmacyRoutes);

// ─── Error Handling ───
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// ─── Catch-All: Serve index.html for non-API routes ───
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── Start Server ───
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   MediFlow OPD v3.1 - Unified Server                     ║
║   Server running on port ${PORT}                          ║
║                                                            ║
║   Local:    http://localhost:${PORT}                      ║
║   Network:  http://0.0.0.0:${PORT}                        ║
║                                                            ║
║   API Health:  GET /api/health                             ║
║   API Login:   POST /api/auth/login                        ║
║   Frontend:    http://localhost:${PORT}/mediflow-login.html ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
});
