const express = require('express');
const router = express.Router();
const Venta = require('../models/Venta');
const Usuario = require('../models/Usuario');
const { ensureAuth, ensureAdmin } = require('../middleware/auth');
const moment = require('moment');

// @desc    Mostrar estadísticas
// @route   GET /estadisticas
router.get('/', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    // Obtener fecha de hace 90 días
    const fechaInicio = moment().subtract(90, 'days').startOf('day').toDate();
    
    // Obtener todos los usuarios
    const usuarios = await Usuario.find({}).lean();
    
    // Obtener ventas de los últimos 90 días
    const ventas = await Venta.find({
      createdAt: { $gte: fechaInicio }
    })
      .populate('cliente')
      .populate('creador')
      .populate('repartidor')
      .populate('detalles.producto')
      .lean();
    
    // Estadísticas por usuario
    const estadisticasUsuarios = {};
    
    usuarios.forEach(usuario => {
      estadisticasUsuarios[usuario._id] = {
        _id: usuario._id,
        nombre: usuario.nombre,
        role: usuario.role,
        ventasCreadas: 0,
        ventasRepartidas: 0,
        totalVendido: 0,
        clientesAtendidos: new Set(),
        productosPorTipo: {}
      };
    });
    
    // Procesar ventas
    ventas.forEach(venta => {
      // Estadísticas del creador
      if (estadisticasUsuarios[venta.creador._id]) {
        estadisticasUsuarios[venta.creador._id].ventasCreadas++;
      }
      
      // Estadísticas del repartidor
      if (estadisticasUsuarios[venta.repartidor._id]) {
        const stats = estadisticasUsuarios[venta.repartidor._id];
        stats.ventasRepartidas++;
        stats.totalVendido += venta.total;
        stats.clientesAtendidos.add(venta.cliente._id.toString());
        
        // Contar productos por tipo
        venta.detalles.forEach(detalle => {
          const tipo = detalle.producto.tipo;
          if (stats.productosPorTipo[tipo]) {
            stats.productosPorTipo[tipo] += detalle.cantidad;
          } else {
            stats.productosPorTipo[tipo] = detalle.cantidad;
          }
        });
      }
    });
    
    // Convertir Sets a números
    Object.values(estadisticasUsuarios).forEach(stats => {
      stats.clientesAtendidos = stats.clientesAtendidos.size;
    });
    
    // Estadísticas generales
    const totalVentas = ventas.length;
    const totalVendido = ventas.reduce((sum, venta) => sum + venta.total, 0);
    
    res.render('estadisticas/index', {
      estadisticasUsuarios: Object.values(estadisticasUsuarios),
      totalVentas,
      totalVendido,
      periodo: '90 días'
    });
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});

module.exports = router;
