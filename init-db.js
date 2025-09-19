const mysql = require('mysql2');
require('dotenv').config();
const bcrypt = require('bcrypt');

// Crear conexión sin especificar base de datos para crearla si no existe
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

console.log('Conectando a MySQL para inicializar la base de datos...');

connection.connect((err) => {
  if (err) {
    console.error('Error de conexión:', err);
    return;
  }
  
  console.log('Conectado a MySQL server');
  
  // Crear la base de datos si no existe
  connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`, (err) => {
    if (err) {
      console.error('Error creando la base de datos:', err);
      connection.end();
      return;
    }
    
    console.log(`Base de datos '${process.env.DB_NAME}' creada o ya existente`);
    
    // Usar la base de datos
    connection.query(`USE ${process.env.DB_NAME}`, (err) => {
      if (err) {
        console.error('Error usando la base de datos:', err);
        connection.end();
        return;
      }
      
      console.log(`Usando base de datos '${process.env.DB_NAME}'`);
      
      // Crear tabla de usuarios del sistema (para login)
      const createUsuariosSistemaTable = `
        CREATE TABLE IF NOT EXISTS usuarios_sistema (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          nombre VARCHAR(100) NOT NULL,
          rol ENUM('admin', 'recepcion', 'seguridad') DEFAULT 'recepcion',
          activo TINYINT(1) DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `;
      
      connection.query(createUsuariosSistemaTable, async (err) => {
        if (err) {
          console.error('Error creando tabla usuarios_sistema:', err);
          connection.end();
          return;
        }
        
        console.log('Tabla usuarios_sistema creada o ya existente');
        
        // Crear usuario administrador por defecto
        try {
          const [existingAdmin] = await connection.promise().query(
            'SELECT id FROM usuarios_sistema WHERE username = ?',
            ['administrador']
          );
          
          if (existingAdmin.length === 0) {
            const passwordHash = await bcrypt.hash('1pTv2025', 10);
            
            await connection.promise().query(
              'INSERT INTO usuarios_sistema (username, password_hash, nombre, rol) VALUES (?, ?, ?, ?)',
              ['administrador', passwordHash, 'Administrador del Sistema', 'admin']
            );
            console.log('Usuario administrador creado con éxito');
          } else {
            console.log('Usuario administrador ya existe');
          }
        } catch (error) {
          console.error('Error al crear usuario administrador:', error);
        }
        
        // Crear tabla de personas
        const createPersonasTable = `
          CREATE TABLE IF NOT EXISTS personas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            dni VARCHAR(8) UNIQUE NOT NULL,
            nombres VARCHAR(100) NOT NULL,
            apellido_paterno VARCHAR(50) NOT NULL,
            apellido_materno VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `;
        
        connection.query(createPersonasTable, (err) => {
          if (err) {
            console.error('Error creando tabla personas:', err);
            connection.end();
            return;
          }
          
          console.log('Tabla personas creada o ya existente');
          
          // Crear tabla de visitas
          const createVisitasTable = `
            CREATE TABLE IF NOT EXISTS visitas (
              id INT AUTO_INCREMENT PRIMARY KEY,
              persona_id INT NOT NULL,
              area_visita VARCHAR(100) NOT NULL,
              motivo TEXT,
              fecha_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              fecha_salida TIMESTAMP NULL,
              observaciones TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE
            )
          `;
          
          connection.query(createVisitasTable, (err) => {
            if (err) {
              console.error('Error creando tabla visitas:', err);
              connection.end();
              return;
            }
            
            console.log('Tabla visitas creada o ya existente');
            
            // Crear índices para mejorar el rendimiento
            const createIndexes = `
              CREATE INDEX IF NOT EXISTS idx_dni ON personas(dni);
              CREATE INDEX IF NOT EXISTS idx_visita_persona ON visitas(persona_id);
              CREATE INDEX IF NOT EXISTS idx_fecha_entrada ON visitas(fecha_entrada);
              CREATE INDEX IF NOT EXISTS idx_username ON usuarios_sistema(username);
            `;
            
            connection.query(createIndexes, (err) => {
              if (err) {
                console.error('Error creando índices:', err);
              } else {
                console.log('Índices creados o ya existentes');
              }
              
              console.log('Base de datos inicializada correctamente');
              connection.end();
            });
          });
        });
      });
    });
  });
});