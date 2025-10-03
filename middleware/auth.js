const jwt = require('jsonwebtoken');
const db = require('../config/database'); // Ajusta la ruta según tu estructura

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware para verificar JWT
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const [users] = await db.execute(
            'SELECT id, username, nombre, rol FROM usuarios_sistema WHERE id = ? AND activo = 1',
            [decoded.userId]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Usuario no válido' });
        }

        req.user = users[0];
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido' });
    }
};

// Middleware para verificar rol de administrador
const requireAdmin = (req, res, next) => {
    if (req.user?.rol !== 'admin') {
        return res.status(403).json({ error: 'Se requieren permisos de administrador' });
    }
    next();
};

// Middleware para verificar roles específicos (admin o recepcion)
const requireAdminOrRecepcion = (req, res, next) => {
    if (req.user?.rol !== 'admin' && req.user?.rol !== 'recepcion') {
        return res.status(403).json({ error: 'Se requieren permisos de administrador o recepción' });
    }
    next();
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requireAdminOrRecepcion
};