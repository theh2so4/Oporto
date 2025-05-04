const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');
const { ensureAuth, ensureAdmin } = require('../middleware/auth');

// @desc    Mostrar todos los productos
// @route   GET /productos
router.get('/', ensureAuth, async (req, res) => {
  try {
    const productos = await Producto.find({}).lean();
    res.render('productos/index', {
      productos
    });
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});

// @desc    Mostrar formulario para agregar producto
// @route   GET /productos/add
router.get('/add', ensureAuth, ensureAdmin, (req, res) => {
  res.render('productos/add');
});

// @desc    Procesar formulario de agregar producto
// @route   POST /productos
router.post('/', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { nombre, tipo, precio, stock } = req.body;
    
    // Validar campos
    if (!nombre || !tipo || !precio) {
      return res.render('productos/add', {
        error: 'Por favor, complete todos los campos',
        producto: req.body
      });
    }
    
    // Crear producto
    await Producto.create({
      nombre,
      tipo,
      precio: parseFloat(precio),
      stock: parseInt(stock || 0)
    });
    
    res.redirect('/productos');
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});

// @desc    Mostrar formulario para editar producto
// @route   GET /productos/edit/:id
router.get('/edit/:id', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id).lean();
    
    if (!producto) {
      return res.render('error/404');
    }
    
    res.render('productos/edit', {
      producto
    });
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});

// @desc    Actualizar producto
// @route   PUT /productos/:id
router.put('/:id', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { nombre, tipo, precio, stock } = req.body;
    
    await Producto.findByIdAndUpdate(req.params.id, {
      nombre,
      tipo,
      precio: parseFloat(precio),
      stock: parseInt(stock || 0)
    });
    
    res.redirect('/productos');
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});

// @desc    Eliminar producto
// @route   DELETE /productos/:id
router.delete('/:id', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    await Producto.findByIdAndDelete(req.params.id);
    res.redirect('/productos');
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});

module.exports = router;
