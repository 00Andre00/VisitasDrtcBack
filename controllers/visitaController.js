const Visita = require('../models/Visita');
const Persona = require('../models/Persona');
const personaController = require('./personaController');

// Registrar entrada de visita (versión async/await)
exports.registrarEntrada = async (req, res) => {
  try {
    const { dni, area_visita, motivo, observaciones } = req.body;
    
    console.log(`📝 Registrando entrada para DNI: ${dni}`);
    
    // 1. Verificar si ya tiene visita activa
    const visitaActiva = await Visita.findActivaByDni(dni);
    
    if (visitaActiva) {
      return res.status(400).json({ 
        error: 'Ya existe una visita activa para este DNI. Debe registrar la salida primero.' 
      });
    }
    
    // 2. Buscar persona en BD local
    let persona = await Persona.findByDni(dni);
    
    if (persona) {
      // 3. Crear visita si persona existe
      const visitaData = {
        persona_id: persona.id,
        area_visita,
        motivo,
        observaciones
      };
      
      const nuevaVisita = await Visita.create(visitaData);
      
      console.log('✅ Visita registrada exitosamente');
      return res.json({ 
        message: 'Visita registrada exitosamente',
        visita: nuevaVisita,
        persona 
      });
    }
    
    // 4. Si persona no existe, buscarla/crearla primero
    console.log('👤 Persona no encontrada en BD, consultando API...');
    
    // Simular el request a personaController
    const personaResponse = await new Promise((resolve, reject) => {
      const mockRes = {
        json: (data) => resolve({ success: true, data }),
        status: (code) => ({ json: (data) => resolve({ success: false, code, data }) })
      };
      
      personaController.buscarOCrearPorDNI({ body: { dni } }, mockRes);
    });
    
    if (!personaResponse.success) {
      return res.status(personaResponse.code || 500).json(personaResponse.data);
    }
    
    // 5. Crear visita con la nueva persona
    const visitaData = {
      persona_id: personaResponse.data.persona.id,
      area_visita,
      motivo,
      observaciones
    };
    
    const nuevaVisita = await Visita.create(visitaData);
    
    console.log('✅ Visita registrada con nueva persona');
    res.json({ 
      message: 'Visita registrada exitosamente',
      visita: nuevaVisita,
      persona: personaResponse.data.persona
    });
    
  } catch (error) {
    console.error('❌ Error en registrarEntrada:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Registrar salida de visita (versión async/await)
exports.registrarSalida = async (req, res) => {
  try {
    const { dni } = req.body;
    
    console.log(`🚪 Registrando salida para DNI: ${dni}`);
    
    // 1. Buscar visita activa
    const visitaActiva = await Visita.findActivaByDni(dni);
    
    if (!visitaActiva) {
      return res.status(404).json({ 
        error: 'No se encontró una visita activa para este DNI' 
      });
    }
    
    // 2. Registrar salida
    await Visita.registrarSalida(visitaActiva.id);
    
    console.log('✅ Salida registrada exitosamente');
    res.json({ 
      message: 'Salida registrada exitosamente',
      visita_id: visitaActiva.id
    });
    
  } catch (error) {
    console.error('❌ Error en registrarSalida:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener visitas activas (versión async/await)
exports.obtenerActivas = async (req, res) => {
  try {
    const visitas = await Visita.getActivas();
    res.json(visitas);
  } catch (error) {
    console.error('❌ Error en obtenerActivas:', error);
    res.status(500).json({ error: 'Error obteniendo visitas activas' });
  }
};

// Obtener historial de visitas (versión async/await)
exports.obtenerHistorial = async (req, res) => {
  try {
    const visitas = await Visita.getHistorial();
    res.json(visitas);
  } catch (error) {
    console.error('❌ Error en obtenerHistorial:', error);
    res.status(500).json({ error: 'Error obteniendo historial de visitas' });
  }
};