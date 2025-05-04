const moment = require('moment');
moment.locale('es');

module.exports = {
  formatDate: function (date, format) {
    return moment(date).format(format);
  },
  select: function (selected, options) {
    return options
      .fn(this)
      .replace(
        new RegExp(' value="' + selected + '"'),
        '$& selected="selected"'
      );
  },
  isAdmin: function (role) {
    return role === 'admin';
  },
  eq: (a, b) => a === b
};