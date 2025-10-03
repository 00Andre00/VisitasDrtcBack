const express = require('express');
const router = express.Router();
const visitaController = require('../controllers/visitaController');
const { validarDNI, validarVisita } = require('../middleware/validation');

// Registrar entrada de visita
router.post('/entrada', validarDNI, validarVisita, visitaController.registrarEntrada);

// Registrar salida de visita
router.post('/salida', validarDNI, visitaController.registrarSalida);

// Obtener visitas activas
router.get('/activas', visitaController.obtenerActivas);

// Obtener historial de visitas
router.get('/historial', visitaController.obtenerHistorial);

module.exports = router;