const express = require('express');
const { login, verifyToken } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Ruta pública para login
router.post('/login', login);

// Ruta para verificar token (requiere autenticación)
router.get('/verify', authenticateToken, verifyToken);

module.exports = router;