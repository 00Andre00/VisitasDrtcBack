const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar conexión a la base de datos - AGREGA ESTO
const db = require('./config/database');

// Importar rutas
const personasRoutes = require('./routes/personas');
const visitasRoutes = require('./routes/visitas');
const authRoutes = require('./routes/authRoutes');

// Importar middleware de autenticación
const { authenticateToken, requireAdminOrRecepcion } = require('./middleware/auth');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ================= RUTAS PÚBLICAS =================
app.use('/api/auth', authRoutes);

// Ruta de prueba pública
app.get('/', (req, res) => {
  res.json({ message: 'Sistema de visitas DRTC Huánuco - API funcionando' });
});

// ================= RUTA PÚBLICA PARA HISTORIAL =================
// CONSULTA CORREGIDA con JOIN
app.get('/api/visitas/public/historial', async (req, res) => {
  try {
    console.log('Accediendo a historial público...');
    
    const [visitas] = await db.execute(`
      SELECT 
        v.id,
        p.dni,
        p.nombres,
        p.apellido_paterno,
        p.apellido_materno,
        v.area_visita,
        v.fecha_entrada,
        v.fecha_salida
      FROM visitas v
      INNER JOIN personas p ON v.persona_id = p.id
      WHERE v.fecha_entrada IS NOT NULL
      ORDER BY v.fecha_entrada DESC
      LIMIT 1000
    `);
    
    console.log(`Se encontraron ${visitas.length} visitas`);
    res.json(visitas);
  } catch (error) {
    console.error('Error en historial público:', error);
    res.status(500).json({ error: 'Error al obtener historial de visitas' });
  }
});

// ================= MIDDLEWARE DE AUTENTICACIÓN GLOBAL =================
app.use(authenticateToken);

// ================= RUTAS PROTEGIDAS =================
app.use('/api/personas', requireAdminOrRecepcion, personasRoutes);
app.use('/api/visitas', requireAdminOrRecepcion, visitasRoutes);

// Ruta protegida de ejemplo para verificar el usuario autenticado
app.get('/api/user-profile', (req, res) => {
  res.json({ 
    message: 'Perfil de usuario', 
    user: req.user 
  });
});

// Manejar rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

module.exports = app;