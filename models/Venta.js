const mongoose = require('mongoose'); 

const DetalleVentaSchema = new mongoose.Schema({
  producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producto',
    required: true
  },
  cantidad: {
    type: Number,
    required: true
  },
  precio: {
    type: Number,
    required: true
  },
  stockAntes: {
    type: Number,
    required: true
  },
  stockDespues: {
    type: Number,
    required: true
  }
});

const PagoSchema = new mongoose.Schema({
  metodo: {
    type: String,
    enum: ['efectivo', 'bizum', 'cajero'],
    required: true
  },
  monto: {
    type: Number,
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  }
});

const VentaSchema = new mongoose.Schema({
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  creador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  repartidor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  detalles: [DetalleVentaSchema],
  pagos: [PagoSchema],
  total: {
    type: Number,
    required: true
  },
  pagado: {
    type: Number,
    required: true,
    default: 0
  },
  estado: {
    type: String,
    enum: ['pendiente', 'pagado', 'deuda'],
    default: 'pendiente'
  },
  notas: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Venta', VentaSchema);