const express = require('express');
const router = express.Router();
const Venta = require('../models/Venta');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');
const Usuario = require('../models/Usuario');
const { ensureAuth, ensureAdmin } = require('../middleware/auth');

// @desc    Mostrar todas las ventas
// @route   GET /ventas
router.get('/', ensureAuth, async (req, res) => {
  try {
    let ventas;
    
    if (req.session.user.role === 'admin') {
      // Administradores ven todas las ventas
      ventas = await Venta.find({})
        .populate('cliente')
        .populate('creador')
        .populate('repartidor')
        .sort({ createdAt: -1 })
        .lean();
    } else {
      // Trabajadores solo ven sus ventas
      ventas = await Venta.find({ repartidor: req.session.user._id })
        .populate('cliente')
        .populate('creador')
        .populate('repartidor')
        .sort({ createdAt: -1 })
        .lean();
    }
    
    res.render('ventas/index', {
      ventas
    });
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});

// @desc    Mostrar formulario para agregar venta
// @route   GET /ventas/add
router.get('/add', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const productos = await Producto.find({}).lean();
    const clientes = await Cliente.find({}).lean();
    const usuarios = await Usuario.find({}).lean();
    
    res.render('ventas/add', {
      productos,
      clientes,
      usuarios
    });
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});

// @desc    Procesar formulario de agregar venta
// @route   POST /ventas
router.post('/', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const {
      cliente_id,
      cliente_nuevo,
      repartidor_id,
      producto_ids,
      cantidades,
      metodo_pago,
      monto_pago,
      notas // Capture the notas field
    } = req.body;
    
    // Validar campos básicos
    if (!repartidor_id || !producto_ids || !cantidades || !metodo_pago || !monto_pago) {
      return res.redirect('/ventas/add');
    }
    
    // Manejar cliente (existente o nuevo)
    let clienteId;
    
    if (cliente_id && cliente_id !== 'nuevo') {
      clienteId = cliente_id;
    } else if (cliente_nuevo) {
      // Crear nuevo cliente
      const nuevoCliente = await Cliente.create({
        nombre: cliente_nuevo,
        deuda: 0
      });
      clienteId = nuevoCliente._id;
    } else {
      return res.redirect('/ventas/add');
    }
    
    // Convertir a arrays si no lo son
    const productoIds = Array.isArray(producto_ids) ? producto_ids : [producto_ids];
    const cantidadesArray = Array.isArray(cantidades) ? cantidades : [cantidades];
    
    // Preparar detalles de venta
    const detalles = [];
    let total = 0;
    
    for (let i = 0; i < productoIds.length; i++) {
      const producto = await Producto.findById(productoIds[i]);
      const cantidad = parseInt(cantidadesArray[i]);
      
      if (producto && cantidad > 0) {
        const stockAntes = producto.stock;
        const stockDespues = stockAntes - cantidad;
        
        // Actualizar stock
        producto.stock = stockDespues;
        await producto.save();
        
        // Agregar detalle
        detalles.push({
          producto: producto._id,
          cantidad,
          precio: producto.precio,
          stockAntes,
          stockDespues
        });
        
        total += producto.precio * cantidad;
      }
    }
    
    // Crear pago
    const pagos = [];
    if (monto_pago > 0) {
      pagos.push({ metodo: metodo_pago, monto: +monto_pago });
    }
    
    // Calcular estado de pago
    const pagado = parseFloat(monto_pago);
    let estado = 'pendiente';
    
    if (pagado >= total) {
      estado = 'pagado';
    } else if (pagado > 0) {
      estado = 'deuda';
    }
    
    // Actualizar deuda del cliente si es necesario
    if (estado === 'deuda') {
      const cliente = await Cliente.findById(clienteId);
      cliente.deuda += (total - pagado);
      await cliente.save();
    } else if (pagado > total) {
      // Si hay sobrepago, reducir deuda existente
      const cliente = await Cliente.findById(clienteId);
      const excedente = pagado - total;
      
      if (cliente.deuda > 0) {
        const nuevaDeuda = Math.max(0, cliente.deuda - excedente);
        cliente.deuda = nuevaDeuda;
        await cliente.save();
      }
    }
    
    // Crear venta
    await Venta.create({
      cliente: clienteId,
      creador: req.session.user._id,
      repartidor: repartidor_id,
      detalles,
      pagos,
      total,
      pagado,
      estado,
      notas // Save the notas field
    });
    
    res.redirect('/ventas');
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});

// @desc    Mostrar detalles de venta
// @route   GET /ventas/:id
router.get('/:id', ensureAuth, async (req, res) => {
  try {
    const venta = await Venta.findById(req.params.id)
      .populate('cliente')
      .populate('creador')
      .populate('repartidor')
      .populate('detalles.producto')
      .lean();
    
    if (!venta) {
      return res.render('error/404');
    }
    
    // Verificar permisos
    if (req.session.user.role !== 'admin' && 
        venta.repartidor._id.toString() !== req.session.user._id.toString()) {
      return res.redirect('/dashboard');
    }
    
    res.render('ventas/show', {
      venta // The sale details, including notas
    });
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});

// @desc    Agregar pago a venta existente
// @route   POST /ventas/:id/pago
router.post('/:id/pago', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { metodo_pago, monto_pago } = req.body;
    const venta = await Venta.findById(req.params.id);
    
    if (!venta) {
      return res.redirect('/ventas');
    }
    
    // Agregar nuevo pago
    venta.pagos.push({
      metodo: metodo_pago,
      monto: parseFloat(monto_pago)
    });
    
    // Actualizar total pagado
    venta.pagado += parseFloat(monto_pago);
    
    // Actualizar estado
    if (venta.pagado >= venta.total) {
      venta.estado = 'pagado';
      
      // Si hay sobrepago, reducir deuda del cliente
      if (venta.pagado > venta.total) {
        const excedente = venta.pagado - venta.total;
        const cliente = await Cliente.findById(venta.cliente);
        
        if (cliente.deuda > 0) {
          cliente.deuda = Math.max(0, cliente.deuda - excedente);
          await cliente.save();
        }
      }
    } else if (venta.pagado > 0) {
      venta.estado = 'deuda';
      
      // Actualizar deuda del cliente
      const cliente = await Cliente.findById(venta.cliente);
      cliente.deuda = cliente.deuda - parseFloat(monto_pago);
      await cliente.save();
    }
    
    await venta.save();
    res.redirect(`/ventas/${venta._id}`);
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});

// @desc    Change the state of a sale
// @route   POST /ventas/:id/estado
router.post('/:id/estado', ensureAdmin, async (req, res) => {
  try {
    const ventaId = req.params.id;
    const nuevoEstado = req.body.estado;

    // Find the sale and update its state
    const venta = await Venta.findById(ventaId);
    if (!venta) {
      return res.status(404).send('Venta no encontrada');
    }

    // Update the state of the sale
    venta.estado = nuevoEstado;
    await venta.save();

    // Redirect back to the sale's details page
    res.redirect(`/ventas/${ventaId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al actualizar el estado de la venta');
  }
});

// @desc    Eliminar una venta y restablecer el stock, actualizar deuda del cliente
// @route   DELETE /ventas/:id
router.delete('/:id', ensureAdmin, async (req, res) => {
  try {
    const ventaId = req.params.id;

    // Buscar la venta para obtener los detalles de los productos, cantidades, y pagos
    const venta = await Venta.findById(ventaId).populate('detalles.producto').populate('cliente');

    if (!venta) {
      return res.status(404).send('Venta no encontrada');
    }

    // Restablecer el stock de los productos
    for (const detalle of venta.detalles) {
      const producto = detalle.producto; // Producto completo, populated
      producto.stock += detalle.cantidad;  // Restablecer el stock al valor original
      await producto.save();
    }

    // Eliminar la venta
    await Venta.findByIdAndDelete(ventaId);

    // Actualizar la deuda del cliente
    const cliente = venta.cliente;  // Cliente que hizo la compra
    const deudaRestante = cliente.deuda - venta.pagado;  // Restar el monto pagado
    cliente.deuda = Math.max(0, deudaRestante);  // Asegurarse de que la deuda no sea negativa
    await cliente.save();

    // Obtener el referer (la página desde donde se hizo la solicitud)
    const referer = req.get('Referer');

    // Redirigir dependiendo de la ruta de origen
    if (referer && referer.includes('/ventas')) {
      return res.redirect('/ventas');
    } else {
      return res.redirect('/dashboard');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al eliminar la venta, restablecer el stock y actualizar la deuda del cliente');
  }
});

module.exports = router;
