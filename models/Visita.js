const db = require('../config/database');

class Visita {
  // Registrar nueva visita (entrada)
  static async create(visitaData) {
    try {
      const { persona_id, area_visita, motivo, observaciones } = visitaData;
      const [result] = await db.execute(
        'INSERT INTO visitas (persona_id, area_visita, motivo, observaciones) VALUES (?, ?, ?, ?)',
        [persona_id, area_visita, motivo, observaciones]
      );
      
      return { id: result.insertId, ...visitaData };
    } catch (error) {
      console.error('Error creando visita:', error);
      throw error;
    }
  }

  // Registrar salida de visita
  static async registrarSalida(visitaId) {
    try {
      const [result] = await db.execute(
        'UPDATE visitas SET fecha_salida = CURRENT_TIMESTAMP WHERE id = ? AND fecha_salida IS NULL',
        [visitaId]
      );
      
      return result;
    } catch (error) {
      console.error('Error registrando salida:', error);
      throw error;
    }
  }

  // Obtener visitas activas
  static async getActivas() {
    try {
      const [results] = await db.execute(`
        SELECT v.*, p.dni, p.nombres, p.apellido_paterno, p.apellido_materno 
        FROM visitas v 
        INNER JOIN personas p ON v.persona_id = p.id 
        WHERE v.fecha_salida IS NULL 
        ORDER BY v.fecha_entrada DESC
      `);
      
      return results;
    } catch (error) {
      console.error('Error obteniendo visitas activas:', error);
      throw error;
    }
  }

  // Obtener historial de visitas
  static async getHistorial() {
    try {
      const [results] = await db.execute(`
        SELECT v.*, p.dni, p.nombres, p.apellido_paterno, p.apellido_materno 
        FROM visitas v 
        INNER JOIN personas p ON v.persona_id = p.id 
        ORDER BY v.fecha_entrada DESC
        LIMIT 100
      `);
      
      return results;
    } catch (error) {
      console.error('Error obteniendo historial de visitas:', error);
      throw error;
    }
  }

  // Buscar visita activa por DNI
  static async findActivaByDni(dni) {
    try {
      const [results] = await db.execute(`
        SELECT v.* 
        FROM visitas v 
        INNER JOIN personas p ON v.persona_id = p.id 
        WHERE p.dni = ? AND v.fecha_salida IS NULL 
        ORDER BY v.fecha_entrada DESC 
        LIMIT 1
      `, [dni]);
      
      return results[0] || null;
    } catch (error) {
      console.error('Error buscando visita activa por DNI:', error);
      throw error;
    }
  }
}

module.exports = Visita;