const db = require('../config/database');

class Persona {
  // Buscar persona por DNI
  static async findByDni(dni) {
    try {
      const [results] = await db.execute('SELECT * FROM personas WHERE dni = ?', [dni]);
      return results[0] || null;
    } catch (error) {
      console.error('Error buscando persona por DNI:', error);
      throw error;
    }
  }

  // Crear nueva persona
  static async create(personaData) {
    try {
      const { dni, nombres, apellido_paterno, apellido_materno } = personaData;
      const [result] = await db.execute(
        'INSERT INTO personas (dni, nombres, apellido_paterno, apellido_materno) VALUES (?, ?, ?, ?)',
        [dni, nombres, apellido_paterno, apellido_materno]
      );
      
      return { id: result.insertId, ...personaData };
    } catch (error) {
      console.error('Error creando persona:', error);
      throw error;
    }
  }

  // Obtener todas las personas
  static async getAll() {
    try {
      const [results] = await db.execute('SELECT * FROM personas ORDER BY created_at DESC');
      return results;
    } catch (error) {
      console.error('Error obteniendo todas las personas:', error);
      throw error;
    }
  }

  // === NUEVOS MÉTODOS QUE FALTABAN ===
  
  // Buscar personas por término de búsqueda
  static async buscar(termino, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;
      const searchTerm = `%${termino}%`;
      
      const [results] = await db.execute(
        `SELECT * FROM personas 
         WHERE dni LIKE ? OR nombres LIKE ? OR apellido_paterno LIKE ? OR apellido_materno LIKE ?
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [searchTerm, searchTerm, searchTerm, searchTerm, limit, offset]
      );
      
      return results;
    } catch (error) {
      console.error('Error buscando personas:', error);
      throw error;
    }
  }

  // Contar total de personas
  static async count() {
    try {
      const [results] = await db.execute('SELECT COUNT(*) as total FROM personas');
      return results[0].total;
    } catch (error) {
      console.error('Error contando personas:', error);
      throw error;
    }
  }

  // Contar personas en búsqueda
  static async countBusqueda(termino) {
    try {
      const searchTerm = `%${termino}%`;
      const [results] = await db.execute(
        'SELECT COUNT(*) as total FROM personas WHERE dni LIKE ? OR nombres LIKE ? OR apellido_paterno LIKE ? OR apellido_materno LIKE ?',
        [searchTerm, searchTerm, searchTerm, searchTerm]
      );
      return results[0].total;
    } catch (error) {
      console.error('Error contando búsqueda:', error);
      throw error;
    }
  }

  // Buscar persona por ID
  static async findById(id) {
    try {
      const [results] = await db.execute('SELECT * FROM personas WHERE id = ?', [id]);
      return results[0] || null;
    } catch (error) {
      console.error('Error buscando persona por ID:', error);
      throw error;
    }
  }

  // Actualizar persona
  static async update(id, datos) {
    try {
      const { nombres, apellido_paterno, apellido_materno } = datos;
      const [result] = await db.execute(
        'UPDATE personas SET nombres = ?, apellido_paterno = ?, apellido_materno = ? WHERE id = ?',
        [nombres, apellido_paterno, apellido_materno, id]
      );
      
      if (result.affectedRows === 0) {
        return null;
      }
      
      return { id, ...datos };
    } catch (error) {
      console.error('Error actualizando persona:', error);
      throw error;
    }
  }

  // Eliminar persona
  static async delete(id) {
    try {
      const [result] = await db.execute('DELETE FROM personas WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error eliminando persona:', error);
      throw error;
    }
  }
}

module.exports = Persona;