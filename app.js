const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const { engine } = require('express-handlebars');
const methodOverride = require('method-override');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const connectDB = require('./config/db');

// Cargar configuración
dotenv.config();

// Conectar a la base de datos
connectDB()
  .then(seedAdmin)
  .catch(err => console.error(err));

const app = express();

// Body parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Method override
app.use(methodOverride('_method'));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Handlebars Helpers
const helpers = require('./helpers/hbs');

// Handlebars
app.engine(
  '.hbs',
  engine({
    helpers,
    defaultLayout: 'main',
    extname: '.hbs'
  })
);
app.set('view engine', '.hbs');

// Sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
  })
);

// Set global variable
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/usuarios', require('./routes/usuarios'));
app.use('/productos', require('./routes/productos'));
app.use('/ventas', require('./routes/ventas'));
app.use('/clientes', require('./routes/clientes'));
app.use('/estadisticas', require('./routes/estadisticas'));

/**
 * Crea un admin con pass random si no existe ninguno
 */
const crypto = require('crypto');
const Usuario = require('./models/Usuario');

async function seedAdmin() {
  const exists = await Usuario.findOne({ role: 'admin' });
  if (exists) return;

  const randomPass = crypto.randomBytes(8).toString('hex');
  const admin = new Usuario({
    username: 'admin',
    password: randomPass,
    nombre:   'Administrador',
    role:     'admin'
  });
  await admin.save();
  console.log(`🛠️  Cuenta Administracion → Usuario: admin | Contraseña: ${randomPass} (SOLO SE MOSTRARÁ UNA VEZ!)`);
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`📢  Servidor iniciado en puerto ${PORT}`);
});
