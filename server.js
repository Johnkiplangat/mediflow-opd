const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.post('/api/auth/login', (req, res) => {
    res.json({ token: 'demo-jwt-token-' + Date.now(), refreshToken: 'demo-refresh-token', user: { id: 'user-1', name: 'Dr. Admin User', email: req.body.email || 'admin@mediflow.local', role: 'admin' }});
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.post('/api/patients', (req, res) => {
    res.status(201).json({ id: 'pat-' + Date.now(), patient_no: 'PAT-2026-' + String(Math.floor(Math.random() * 90000) + 10000), ...req.body });
});

const pharmacyRoutes = require('./routes/pharmacy');
app.use('/api/pharmacy', pharmacyRoutes);

app.use(express.static('.'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API endpoint not found' });
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
