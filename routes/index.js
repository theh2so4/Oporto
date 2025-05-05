const express = require('express');
const router = express.Router();
const { ensureAuth, ensureAdmin } = require('../middleware/auth');
const Venta = require('../models/Venta');
const Cliente = require('../models/Cliente');
const Producto = require('../models/Producto');
const moment = require('moment');

// @desc    Dashboard
// @route   GET /dashboard
router.get('/dashboard', ensureAuth, async (req, res) => {
  try {
    const hoy = moment().startOf('day');
    const manana = moment(hoy).add(1, 'days');
    
    // Consultas comunes para ambos roles
    const ventasHoy = await Venta.find({
      createdAt: {
        $gte: hoy.toDate(),
        $lt: manana.toDate()
      }
    }).populate('cliente').populate('repartidor').lean();
    
    const clientesHoy = await Cliente.countDocuments({
      createdAt: {
        $gte: hoy.toDate(),
        $lt: manana.toDate()
      }
    });
    
    // Datos específicos para cada rol
    if (req.session.user.role === 'admin') {
      // Dashboard para administradores
      const productos = await Producto.find({}).lean();
      const clientes = await Cliente.find({}).lean();
      
      res.render('dashboard/admin', {
        ventasHoy,
        clientesHoy,
        productos,
        clientes,
        totalVentas: ventasHoy.length,
        fecha: moment().format('LL')
      });
    } else {
      // Dashboard para trabajadores
      const ventasRepartidor = await Venta.find({
        repartidor: req.session.user._id,
        createdAt: {
          $gte: hoy.toDate(),
          $lt: manana.toDate()
        }
      })
      .populate('cliente')
      .populate('detalles.producto')
      .lean();      
      
      // Agrupar productos entregados por tipo
      const productosEntregados = {};
      ventasRepartidor.forEach(venta => {
        venta.detalles.forEach(detalle => {
          if (productosEntregados[detalle.producto.tipo]) {
            productosEntregados[detalle.producto.tipo] += detalle.cantidad;
          } else {
            productosEntregados[detalle.producto.tipo] = detalle.cantidad;
          }
        });
      });
      
      res.render('dashboard/worker', {
        ventasRepartidor,
        clientesAtendidos: ventasRepartidor.length,
        productosEntregados,
        fecha: moment().format('LL')
      });
    }
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});

// @desc    Página de inicio
// @route   GET /
router.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/auth/login');
  }
});

module.exports = router;
