const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware de base
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// ==========================================
// MIDDLEWARE AUTHELIA (SÉCURITÉ SSO)
// ==========================================
app.use((req, res, next) => {
    req.medecin = {
        username: req.headers['remote-user'] || 'Inconnu',
        name: req.headers['remote-name'] || 'Utilisateur Non Authentifié',
        groups: req.headers['remote-groups'] || ''
    };
    next();
});

// ==========================================
// ROUTES API
// ==========================================

// Route principale - Page d'accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API - Identité du médecin connecté (Pour le frontend)
app.get('/api/me', (req, res) => {
    res.json({ success: true, user: req.medecin });
});

// API - Test connexion (Santé)
app.get('/api/health', async (req, res) => {
    try {
        const connection = await oracledb.getConnection();
        await connection.execute('SELECT 1 FROM DUAL');
        await connection.close();
        res.json({ status: 'OK', message: 'Connexion à Oracle réussie', timestamp: new Date().toISOString() });
    } catch (err) {
        res.status(500).json({ status: 'ERROR', message: err.message });
    }
});

// API - Liste des patients
app.get('/api/patients', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `SELECT patient_id, nom, prenom, TO_CHAR(date_naissance, 'DD/MM/YYYY') as date_naissance, numero_secu, email, telephone, adresse FROM patients ORDER BY nom, prenom`
        );
        res.json({ success: true, count: result.rows.length, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally { if (connection) await connection.close(); }
});

// API - Détails d'un patient
app.get('/api/patients/:id', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `SELECT patient_id, nom, prenom, TO_CHAR(date_naissance, 'DD/MM/YYYY') as date_naissance, numero_secu, email, telephone, adresse FROM patients WHERE patient_id = :id`,
            [req.params.id]
        );
        res.json(result.rows.length === 0 ? { success: false, message: 'Patient non trouvé' } : { success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally { if (connection) await connection.close(); }
});

// API - Créer un patient
app.post('/api/patients', async (req, res) => {
    // --- VÉRIFICATION RBAC (Médecins et Administratifs uniquement) ---
    const groupes = req.medecin.groups || '';
    if (!groupes.includes('<AD_GROUP_DOCTORS>') && !groupes.includes('<AD_GROUP_STAFF>')) {
        return res.status(403).json({ success: false, message: 'Accès refusé : Seuls les médecins et le secrétariat peuvent créer un dossier.' });
    }
    // -----------------------------------------------------------------

    let connection;
    try {
        const { nom, prenom, date_naissance, numero_secu, email, telephone, adresse } = req.body;
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `INSERT INTO patients (patient_id, nom, prenom, date_naissance, numero_secu, email, telephone, adresse) VALUES (patient_seq.NEXTVAL, :nom, :prenom, TO_DATE(:date_naissance, 'YYYY-MM-DD'), :numero_secu, :email, :telephone, :adresse) RETURNING patient_id INTO :id`,
            { nom, prenom, date_naissance, numero_secu, email, telephone, adresse, id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } }
        );
        res.status(201).json({ success: true, message: 'Patient créé avec succès', patient_id: result.outBinds.id[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally { if (connection) await connection.close(); }
});

// API - Modifier un patient
app.put('/api/patients/:id', async (req, res) => {
    // --- VÉRIFICATION RBAC (Médecins et Administratifs uniquement) ---
    const groupes = req.medecin.groups || '';
    if (!groupes.includes('<AD_GROUP_DOCTORS>') && !groupes.includes('<AD_GROUP_STAFF>')) {
        return res.status(403).json({ success: false, message: 'Accès refusé : Seuls les médecins et le secrétariat peuvent modifier un dossier.' });
    }
    // -----------------------------------------------------------------

    let connection;
    try {
        const { email, telephone, adresse } = req.body;
        connection = await oracledb.getConnection();
        await connection.execute(
            `UPDATE patients SET email = :email, telephone = :telephone, adresse = :adresse WHERE patient_id = :id`,
            { email, telephone, adresse, id: req.params.id }
        );
        res.json({ success: true, message: 'Dossier mis à jour' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally { if (connection) await connection.close(); }
});

// ==========================================
// DÉMARRAGE ET ARRÊT PROPRE
// ==========================================

async function startup() {
    try {
        await db.initialize();
        app.listen(PORT, '0.0.0.0', () => {
            console.log('===========================================');
            console.log(`🏥 --- HDS MEDICAL APP STARTED --- (Sécurisée)`);
            console.log(`🚀 Serveur démarré sur http://0.0.0.0:${PORT}`);
            console.log(`🔒 Prêt à recevoir les connexions d'Authelia`);
            console.log('===========================================');
        });
    } catch (err) {
        console.error('Erreur démarrage:', err);
        process.exit(1);
    }
}

process.on('SIGTERM', async () => {
    console.log('SIGTERM reçu, arrêt en cours...');
    await db.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT reçu, arrêt en cours...');
    await db.close();
    process.exit(0);
});

startup();
