module.exports = {
  ensureAuth: function (req, res, next) {
    if (req.session.user) {
      return next();
    } else {
      res.redirect('/auth/login');
    }
  },
  ensureGuest: function (req, res, next) {
    if (!req.session.user) {
      return next();
    } else {
      res.redirect('/dashboard');
    }
  },
  ensureAdmin: function (req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
      return next();
    } else {
      res.redirect('/dashboard');
    }
  }
};
