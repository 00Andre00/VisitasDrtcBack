const Persona = require('../models/Persona');
const axios = require('axios');
const https = require('https');

// Consultar a API Perú Dev
const consultarApiPeru = async (dni) => {
  try {
    const requestData = JSON.stringify({ dni: dni });
    
    const response = await axios.post(process.env.API_PERU_URL, requestData, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_PERU_TOKEN}`
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 10000
    });
    
    if (response.data && response.data.success) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error('Error consultando API Perú:', error.message);
    return null;
  }
};

// Buscar o crear persona por DNI (versión simplificada y funcional)
exports.buscarOCrearPorDNI = async (req, res) => {
  try {
    const { dni } = req.body;

    // Validación básica
    if (!dni || !/^\d{8}$/.test(dni)) {
      return res.status(400).json({ 
        error: 'DNI inválido. Debe tener exactamente 8 dígitos.' 
      });
    }

    console.log(`Buscando DNI: ${dni}`);
    
    // 1. Primero buscar en base de datos local
    const personaLocal = await Persona.findByDni(dni);
    
    if (personaLocal) {
      console.log('✅ Encontrado en BD local');
      return res.json({ 
        persona: personaLocal, 
        fuente: 'base_datos_local' 
      });
    }

    console.log('❌ No encontrado en BD local, consultando API...');
    
    // 2. Consultar API externa si no está en BD
    const apiData = await consultarApiPeru(dni);
    
    if (!apiData) {
      return res.status(404).json({ 
        error: 'No se encontraron datos para el DNI proporcionado' 
      });
    }

    // 3. Guardar en BD local
    const personaData = {
      dni: dni,
      nombres: apiData.nombres || '',
      apellido_paterno: apiData.apellido_paterno || '',
      apellido_materno: apiData.apellido_materno || ''
    };

    // Validar datos mínimos
    if (!personaData.nombres || !personaData.apellido_paterno) {
      return res.status(422).json({ 
        error: 'Datos incompletos de la API' 
      });
    }

    let nuevaPersona;
    try {
      nuevaPersona = await Persona.create(personaData);
      console.log('✅ Persona guardada en BD local');
    } catch (dbError) {
      // Si hay error de duplicado (otra request creó primero), buscar again
      if (dbError.code === 'ER_DUP_ENTRY') {
        console.log('⚠️  DNI duplicado, buscando nuevamente...');
        const personaExistente = await Persona.findByDni(dni);
        if (personaExistente) {
          return res.json({ 
            persona: personaExistente, 
            fuente: 'base_datos_local' 
          });
        }
      }
      throw dbError;
    }

    res.json({ 
      persona: nuevaPersona, 
      fuente: 'api_peru_dev' 
    });

  } catch (error) {
    console.error('Error crítico en buscarOCrearPorDNI:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
};

// Obtener todas las personas
exports.obtenerTodas = async (req, res) => {
  try {
    const personas = await Persona.getAll();
    res.json(personas);
  } catch (error) {
    console.error('Error obteniendo personas:', error);
    res.status(500).json({ error: 'Error obteniendo personas' });
  }
};

// Métodos adicionales (opcionales) - mantener solo si los necesitas
exports.buscar = async (req, res) => {
  try {
    const { termino } = req.query;
    const { page = 1, limit = 50 } = req.query;
    
    const offset = (page - 1) * limit;
    const personas = await Persona.buscar(termino, { limit, offset });
    const total = await Persona.countBusqueda(termino);
    
    res.json({
      personas,
      paginacion: {
        pagina: parseInt(page),
        limite: parseInt(limit),
        total,
        paginas: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error buscando personas:', error);
    res.status(500).json({ error: 'Error en búsqueda' });
  }
};