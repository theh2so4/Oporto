const express = require('express');
const router = express.Router();
const Cliente = require('../models/Cliente');
const { ensureAuth } = require('../middleware/auth');

// @desc    Mostrar todos los clientes
// @route   GET /clientes
router.get('/', ensureAuth, async (req, res) => {
  try {
    const clientes = await Cliente.find({}).lean();
    res.render('clientes/index', {
      clientes
    });
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});

// @desc    Mostrar formulario para agregar cliente
// @route   GET /clientes/add
router.get('/add', ensureAuth, (req, res) => {
  res.render('clientes/add');
});

// @desc    Procesar formulario de agregar cliente
// @route   POST /clientes
router.post('/', ensureAuth, async (req, res) => {
  try {
    const { nombre, telefono } = req.body;
    
    // Validar campos
    if (!nombre) {
      return res.render('clientes/add', {
        error: 'Por favor, ingrese al menos el nombre del cliente',
        cliente: req.body
      });
    }
    
    // Crear cliente
    await Cliente.create({
      nombre,
      telefono,
      deuda: 0
    });
    
    res.redirect('/clientes');
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});

// @desc    Mostrar formulario para editar cliente
// @route   GET /clientes/edit/:id
router.get('/edit/:id', ensureAuth, async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id).lean();
    
    if (!cliente) {
      return res.render('error/404');
    }
    
    res.render('clientes/edit', {
      cliente
    });
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});

// @desc    Actualizar cliente
// @route   PUT /clientes/:id
router.put('/:id', ensureAuth, async (req, res) => {
  try {
    const { nombre, telefono, deuda } = req.body;
    
    await Cliente.findByIdAndUpdate(req.params.id, {
      nombre,
      telefono,
      deuda: parseFloat(deuda || 0)
    });
    
    res.redirect('/clientes');
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});

// @desc    Eliminar cliente
// @route   DELETE /clientes/:id
router.delete('/:id', ensureAuth, async (req, res) => {
  try {
    await Cliente.findByIdAndDelete(req.params.id);
    res.redirect('/clientes');
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});

// @desc    Buscar clientes (API)
// @route   GET /clientes/buscar
router.get('/buscar', ensureAuth, async (req, res) => {
  try {
    const clientes = await Cliente.find({
      nombre: { $regex: req.query.q, $options: 'i' }
    }).lean();
    
    res.json(clientes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
