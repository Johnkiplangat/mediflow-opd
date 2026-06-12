// ============================================
// PHARMACY MODULE - API ROUTES
// Save as: routes/pharmacy.js
// ============================================

const express = require('express');
const router = express.Router();

// ============================================
// DRUGS MANAGEMENT
// ============================================

// GET /api/pharmacy/drugs - List all drugs
router.get('/drugs', async (req, res) => {
    try {
        const db = req.db;
        const drugs = await db.all(`
            SELECT d.*, 
                   COALESCE(i.total_quantity, 0) as stock_quantity,
                   COALESCE(i.available_quantity, 0) as available_stock,
                   CASE 
                       WHEN COALESCE(i.available_quantity, 0) <= d.reorder_level THEN 'low_stock'
                       WHEN COALESCE(i.available_quantity, 0) = 0 THEN 'out_of_stock'
                       ELSE 'in_stock'
                   END as stock_status
            FROM drugs d
            LEFT JOIN inventory i ON d.id = i.drug_id
            ORDER BY d.name
        `);
        res.json({ success: true, data: drugs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/pharmacy/drugs - Add new drug
router.post('/drugs', async (req, res) => {
    try {
        const db = req.db;
        const { name, generic_name, dosage_form, strength, category, unit_of_measure, reorder_level, max_stock } = req.body;

        const result = await db.run(`
            INSERT INTO drugs (name, generic_name, dosage_form, strength, category, unit_of_measure, reorder_level, max_stock)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [name, generic_name, dosage_form, strength, category, unit_of_measure, reorder_level || 50, max_stock || 1000]);

        await db.run('INSERT INTO inventory (drug_id, total_quantity, available_quantity) VALUES (?, 0, 0)', [result.lastID]);

        res.json({ success: true, data: { id: result.lastID } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/pharmacy/drugs/:id - Update drug
router.put('/drugs/:id', async (req, res) => {
    try {
        const db = req.db;
        const { name, generic_name, dosage_form, strength, category, unit_of_measure, reorder_level, max_stock } = req.body;

        await db.run(`
            UPDATE drugs SET 
                name = ?, generic_name = ?, dosage_form = ?, strength = ?,
                category = ?, unit_of_measure = ?, reorder_level = ?, max_stock = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [name, generic_name, dosage_form, strength, category, unit_of_measure, reorder_level, max_stock, req.params.id]);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// INVENTORY MANAGEMENT
// ============================================

// GET /api/pharmacy/inventory - Get inventory with alerts
router.get('/inventory', async (req, res) => {
    try {
        const db = req.db;
        const inventory = await db.all(`
            SELECT d.*, i.total_quantity, i.available_quantity, i.reserved_quantity,
                   CASE 
                       WHEN i.available_quantity <= d.reorder_level THEN 'low_stock'
                       WHEN i.available_quantity = 0 THEN 'out_of_stock'
                       ELSE 'in_stock'
                   END as stock_status
            FROM drugs d
            JOIN inventory i ON d.id = i.drug_id
            ORDER BY d.name
        `);

        const expiryAlerts = await db.all(`
            SELECT db.*, d.name as drug_name, d.generic_name
            FROM drug_batches db
            JOIN drugs d ON db.drug_id = d.id
            WHERE db.expiry_date <= date('now', '+90 days')
            AND db.quantity_remaining > 0
            ORDER BY db.expiry_date
        `);

        res.json({ success: true, data: { inventory, expiryAlerts } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/pharmacy/stock-in - Receive new stock
router.post('/stock-in', async (req, res) => {
    try {
        const db = req.db;
        const { drug_id, batch_number, supplier, quantity, expiry_date, purchase_price, selling_price } = req.body;

        await db.run('BEGIN TRANSACTION');

        const batchResult = await db.run(`
            INSERT INTO drug_batches (drug_id, batch_number, supplier, quantity_received, quantity_remaining, expiry_date, purchase_price, selling_price)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [drug_id, batch_number, supplier, quantity, quantity, expiry_date, purchase_price, selling_price]);

        await db.run(`
            UPDATE inventory SET 
                total_quantity = total_quantity + ?,
                available_quantity = available_quantity + ?,
                last_updated = CURRENT_TIMESTAMP
            WHERE drug_id = ?
        `, [quantity, quantity, drug_id]);

        await db.run(`
            INSERT INTO stock_movements (drug_id, batch_id, movement_type, quantity, reference_type, notes, created_by)
            VALUES (?, ?, 'received', ?, 'purchase_order', ?, ?)
        `, [drug_id, batchResult.lastID, quantity, `Stock received from ${supplier}`, req.user?.id || 1]);

        await db.run('COMMIT');
        res.json({ success: true, data: { batch_id: batchResult.lastID } });
    } catch (error) {
        await db.run('ROLLBACK');
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// PRESCRIPTION FULFILLMENT
// ============================================

// GET /api/pharmacy/prescriptions/:id - Get prescription with items
router.get('/prescriptions/:id', async (req, res) => {
    try {
        const db = req.db;
        const prescriptionId = req.params.id;

        const prescription = await db.get(`
            SELECT p.*, pt.name as patient_name, pt.mrn, u.name as doctor_name
            FROM prescriptions p
            JOIN patients pt ON p.patient_id = pt.id
            JOIN users u ON p.doctor_id = u.id
            WHERE p.id = ?
        `, [prescriptionId]);

        if (!prescription) {
            return res.status(404).json({ success: false, error: 'Prescription not found' });
        }

        const items = await db.all(`
            SELECT pi.*, d.name as drug_name, d.generic_name, d.dosage_form, d.strength,
                   d.unit_of_measure, db.batch_number, db.expiry_date
            FROM prescription_items pi
            JOIN drugs d ON pi.drug_id = d.id
            LEFT JOIN drug_batches db ON pi.batch_id = db.id
            WHERE pi.prescription_id = ?
        `, [prescriptionId]);

        res.json({ success: true, data: { prescription, items } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/pharmacy/pending-prescriptions - List pending prescriptions
router.get('/pending-prescriptions', async (req, res) => {
    try {
        const db = req.db;
        const prescriptions = await db.all(`
            SELECT p.*, pt.name as patient_name, pt.mrn, u.name as doctor_name,
                   COUNT(pi.id) as item_count,
                   SUM(CASE WHEN pi.status = 'pending' THEN 1 ELSE 0 END) as pending_items
            FROM prescriptions p
            JOIN patients pt ON p.patient_id = pt.id
            JOIN users u ON p.doctor_id = u.id
            JOIN prescription_items pi ON p.id = pi.prescription_id
            WHERE pi.status IN ('pending', 'partially_dispensed')
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `);
        res.json({ success: true, data: prescriptions });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/pharmacy/dispense - Dispense drugs
router.post('/dispense', async (req, res) => {
    try {
        const db = req.db;
        const { prescription_id, patient_id, items, notes } = req.body;
        const pharmacist_id = req.user?.id || 1;

        await db.run('BEGIN TRANSACTION');

        const dispResult = await db.run(`
            INSERT INTO dispensations (prescription_id, patient_id, dispensed_by, total_items, notes)
            VALUES (?, ?, ?, ?, ?)
        `, [prescription_id, patient_id, pharmacist_id, items.length, notes]);

        const dispensationId = dispResult.lastID;

        for (const item of items) {
            const { prescription_item_id, drug_id, batch_id, quantity } = item;

            const batch = await db.get('SELECT * FROM drug_batches WHERE id = ?', [batch_id]);
            if (!batch || batch.quantity_remaining < quantity) {
                throw new Error(`Insufficient stock for batch ${batch_id}`);
            }

            await db.run(`
                UPDATE drug_batches SET quantity_remaining = quantity_remaining - ?
                WHERE id = ?
            `, [quantity, batch_id]);

            await db.run(`
                UPDATE inventory SET 
                    total_quantity = total_quantity - ?,
                    available_quantity = available_quantity - ?,
                    last_updated = CURRENT_TIMESTAMP
                WHERE drug_id = ?
            `, [quantity, quantity, drug_id]);

            await db.run(`
                UPDATE prescription_items SET 
                    quantity_dispensed = quantity_dispensed + ?,
                    batch_id = ?,
                    status = CASE 
                        WHEN quantity_dispensed + ? >= quantity_prescribed THEN 'dispensed'
                        ELSE 'partially_dispensed'
                    END,
                    dispensed_by = ?,
                    dispensed_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [quantity, batch_id, quantity, pharmacist_id, prescription_item_id]);

            await db.run(`
                INSERT INTO dispensation_items (dispensation_id, drug_id, batch_id, quantity_dispensed, unit_price, total_price)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [dispensationId, drug_id, batch_id, quantity, batch.selling_price, quantity * batch.selling_price]);

            await db.run(`
                INSERT INTO stock_movements (drug_id, batch_id, movement_type, quantity, reference_type, reference_id, created_by)
                VALUES (?, ?, 'dispensed', ?, 'prescription', ?, ?)
            `, [drug_id, batch_id, -quantity, prescription_id, pharmacist_id]);
        }

        await db.run('COMMIT');
        res.json({ success: true, data: { dispensation_id: dispensationId } });
    } catch (error) {
        await db.run('ROLLBACK');
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// BATCH MANAGEMENT
// ============================================

// GET /api/pharmacy/batches/:drugId - Get available batches (FIFO)
router.get('/batches/:drugId', async (req, res) => {
    try {
        const db = req.db;
        const batches = await db.all(`
            SELECT db.*, d.name as drug_name
            FROM drug_batches db
            JOIN drugs d ON db.drug_id = d.id
            WHERE db.drug_id = ? AND db.quantity_remaining > 0 AND db.expiry_date > date('now')
            ORDER BY db.expiry_date ASC, db.date_received ASC
        `, [req.params.drugId]);
        res.json({ success: true, data: batches });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// REPORTS
// ============================================

// GET /api/pharmacy/reports/stock-levels
router.get('/reports/stock-levels', async (req, res) => {
    try {
        const db = req.db;
        const report = await db.all(`
            SELECT d.name, d.generic_name, d.reorder_level,
                   COALESCE(i.total_quantity, 0) as current_stock,
                   COALESCE(i.available_quantity, 0) as available,
                   CASE 
                       WHEN COALESCE(i.available_quantity, 0) = 0 THEN 'OUT OF STOCK'
                       WHEN COALESCE(i.available_quantity, 0) <= d.reorder_level THEN 'LOW STOCK'
                       ELSE 'OK'
                   END as status
            FROM drugs d
            LEFT JOIN inventory i ON d.id = i.drug_id
            ORDER BY status DESC, d.name
        `);
        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/pharmacy/reports/expiry
router.get('/reports/expiry', async (req, res) => {
    try {
        const db = req.db;
        const days = req.query.days || 90;
        const expiring = await db.all(`
            SELECT db.*, d.name as drug_name, d.generic_name,
                   julianday(db.expiry_date) - julianday('now') as days_remaining
            FROM drug_batches db
            JOIN drugs d ON db.drug_id = d.id
            WHERE db.expiry_date <= date('now', '+${days} days')
            AND db.quantity_remaining > 0
            ORDER BY db.expiry_date
        `);
        res.json({ success: true, data: expiring });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/pharmacy/reports/dispensing
router.get('/reports/dispensing', async (req, res) => {
    try {
        const db = req.db;
        const { start_date, end_date } = req.query;
        const report = await db.all(`
            SELECT d.name, d.generic_name, SUM(di.quantity_dispensed) as total_dispensed,
                   SUM(di.total_price) as total_value
            FROM dispensation_items di
            JOIN drugs d ON di.drug_id = d.id
            JOIN dispensations disp ON di.dispensation_id = disp.id
            WHERE disp.dispensed_at BETWEEN ? AND ?
            GROUP BY d.id
            ORDER BY total_dispensed DESC
        `, [start_date || '2026-01-01', end_date || '2026-12-31']);
        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
