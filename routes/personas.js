const express = require('express');
const router = express.Router();
const personaController = require('../controllers/personaController');
const { validarDNI } = require('../middleware/validation');

// Buscar o crear persona por DNI
router.post('/buscar', validarDNI, personaController.buscarOCrearPorDNI);

// Obtener todas las personas (para administración)
router.get('/', personaController.obtenerTodas);

module.exports = router;