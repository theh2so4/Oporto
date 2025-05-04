const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UsuarioSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  nombre: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'worker'],
    default: 'worker'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encriptar contraseña antes de guardar
UsuarioSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Método para comparar contraseñas
UsuarioSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Usuario', UsuarioSchema);
