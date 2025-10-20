/**
 * 🔐 API ROUTES - AUTENTICACIÓN
 * Rutas para autenticación del dashboard
 */

const express = require('express');
const router = express.Router();

// POST /api/auth/login - Login simple
router.post('/login', (req, res) => {
    const { password } = req.body;
    
    // Password simple para el dueño
    if (password === process.env.ADMIN_PASSWORD || password === 'husky2024') {
        res.json({
            success: true,
            token: 'simple-token-husky',
            message: 'Acceso autorizado'
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Password incorrecto'
        });
    }
});

// POST /api/auth/verify - Verificar token
router.post('/verify', (req, res) => {
    const { token } = req.body;
    
    if (token === 'simple-token-husky') {
        res.json({
            success: true,
            message: 'Token válido'
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
});

module.exports = router;