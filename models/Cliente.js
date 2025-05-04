const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  telefono: {
    type: String,
    trim: true
  },
  deuda: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Cliente', ClienteSchema);
