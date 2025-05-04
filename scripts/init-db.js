const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Modelo de Usuario
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

// Método para comparar contraseñas
UsuarioSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Usuario = mongoose.model('Usuario', UsuarioSchema);

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB conectado');
  
  try {
    // Verificar si ya existe un usuario admin
    const adminExists = await Usuario.findOne({ username: 'admin' });
    
    if (!adminExists) {
      // Crear usuario admin por defecto
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin', salt);
      
      await Usuario.create({
        username: 'admin',
        password: hashedPassword,
        nombre: 'Administrador',
        role: 'admin'
      });
      
      console.log('Usuario admin creado con éxito');
    } else {
      console.log('El usuario admin ya existe');
    }
    
    // Desconectar de la base de datos
    mongoose.disconnect();
    console.log('Inicialización completada');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    process.exit(1);
  }
})
.catch(err => {
  console.error('Error al conectar a MongoDB:', err);
  process.exit(1);
});
