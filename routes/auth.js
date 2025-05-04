const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');
const { ensureGuest } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// @desc    Login page
// @route   GET /auth/login
router.get('/login', ensureGuest, (req, res) => {
  res.render('auth/login');
});

// @desc    Login process
// @route   POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validar campos
    if (!username || !password) {
      return res.render('auth/login', {
        error: 'Por favor, complete todos los campos'
      });
    }
    
    // Buscar usuario
    const usuario = await Usuario.findOne({ username });
    
    if (!usuario) {
      return res.render('auth/login', {
        error: 'Credenciales inválidas'
      });
    }
    
    // Verificar contraseña
    const isMatch = await usuario.matchPassword(password);
    
    if (!isMatch) {
      return res.render('auth/login', {
        error: 'Credenciales inválidas'
      });
    }
    
    // Guardar usuario en sesión
    req.session.user = {
      _id: usuario._id,
      username: usuario.username,
      nombre: usuario.nombre,
      role: usuario.role
    };
    
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});

// @desc    Logout
// @route   GET /auth/logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
});

module.exports = router;
