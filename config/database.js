const mysql = require('mysql2');
require('dotenv').config();

// Crear pool de conexiones
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  typeCast: function (field, next) {
    if (field.type === 'TINY' && field.length === 1) {
      return field.string() === '1';
    }
    return next();
  }
});

// Verificar al inicializar
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Error obteniendo conexión del pool:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos MySQL con pool');
  connection.release();
});

// Eventos del pool (opcional)
pool.on('connection', (connection) => {
  console.log('🔌 Nueva conexión en el pool:', connection.threadId);
});
pool.on('acquire', (connection) => {
  console.log('➡️  Conexión adquirida:', connection.threadId);
});
pool.on('release', (connection) => {
  console.log('⬅️  Conexión liberada:', connection.threadId);
});

// Exportar el pool con promesas
const db = pool.promise();
module.exports = db;

// Verificación periódica
const verificarConexion = async () => {
  try {
    await db.execute('SELECT 1');
    console.log('✅ Conexión a BD verificada -', new Date().toLocaleString());
  } catch (error) {
    console.error('❌ Error verificando conexión a BD:', error.message);
  }
};

// Cada 5 minutos
setInterval(verificarConexion, 5 * 60 * 1000);

// Verificar al iniciar
verificarConexion();
