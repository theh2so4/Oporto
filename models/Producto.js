const mongoose = require('mongoose');

const ProductoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  tipo: {
    type: String,
    required: true,
    trim: true
  },
  precio: {
    type: Number,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Producto', ProductoSchema);
