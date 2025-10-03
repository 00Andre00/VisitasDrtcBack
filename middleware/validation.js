// Validar formato de DNI (8 dígitos)
const validarDNI = (req, res, next) => {
  const { dni } = req.body;
  
  if (!dni || !/^\d{8}$/.test(dni)) {
    return res.status(400).json({ 
      error: 'DNI inválido. Debe tener exactamente 8 dígitos.' 
    });
  }
  
  next();
};

// Validar datos de visita
const validarVisita = (req, res, next) => {
  const { area_visita } = req.body;
  
  if (!area_visita || area_visita.trim() === '') {
    return res.status(400).json({ 
      error: 'El área de visita es obligatoria.' 
    });
  }
  
  next();
};

module.exports = {
  validarDNI,
  validarVisita
};