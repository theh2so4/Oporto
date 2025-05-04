const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');
const { ensureAuth, ensureAdmin } = require('../middleware/auth');

// @desc    Mostrar todos los usuarios
// @route   GET /usuarios
router.get('/', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const usuarios = await Usuario.find({}).lean();
    res.render('usuarios/index', {
      usuarios
    });
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});

// @desc    Mostrar formulario para agregar usuario
// @route   GET /usuarios/add
router.get('/add', ensureAuth, ensureAdmin, (req, res) => {
  res.render('usuarios/add');
});

// @desc    Procesar formulario de agregar usuario
// @route   POST /usuarios
router.post('/', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { username, password, nombre, role } = req.body;
    
    // Validar campos
    if (!username || !password || !nombre || !role) {
      return res.render('usuarios/add', {
        error: 'Por favor, complete todos los campos',
        usuario: req.body
      });
    }
    
    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({ username });
    
    if (usuarioExistente) {
      return res.render('usuarios/add', {
        error: 'El nombre de usuario ya está en uso',
        usuario: req.body
      });
    }
    
    // Crear usuario
    await Usuario.create({
      username,
      password,
      nombre,
      role
    });
    
    res.redirect('/usuarios');
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});

// @desc    Mostrar formulario para editar usuario
// @route   GET /usuarios/edit/:id
router.get('/edit/:id', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).lean();
    
    if (!usuario) {
      return res.render('error/404');
    }
    
    res.render('usuarios/edit', {
      usuario
    });
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});

// @desc    Actualizar usuario
// @route   PUT /usuarios/:id
router.put('/:id', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { nombre, role } = req.body;
    let usuario = await Usuario.findById(req.params.id);
    
    if (!usuario) {
      return res.render('error/404');
    }
    
    // Actualizar usuario
    usuario.nombre = nombre;
    usuario.role = role;
    
    // Si se proporciona una nueva contraseña, actualizarla
    if (req.body.password && req.body.password.trim() !== '') {
      usuario.password = req.body.password;
    }
    
    await usuario.save();
    
    res.redirect('/usuarios');
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});

// @desc    Eliminar usuario
// @route   DELETE /usuarios/:id
router.delete('/:id', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    await Usuario.findByIdAndDelete(req.params.id);
    res.redirect('/usuarios');
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});

module.exports = router;
