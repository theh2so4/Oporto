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
  eq: function (a, b) {
    return a === b;
  },
  ne: function (a, b) {
    return a !== b;
  },
  lt: function (a, b) {
    return a < b;
  },
  lte: function (a, b) {
    return a <= b;
  },
  gt: function (a, b) {
    return a > b;
  },
  gte: function (a, b) {
    return a >= b;
  },
  multiply: function(a, b) {
    return a * b;
  },
  subtract: function(a, b) {
    return a - b;
  },
  not: function(v) {
    return !v;
  },
  and: function(a, b) {
    return a && b;
  },
  json: function(context) {
    return JSON.stringify(context, null, 2);
  }
};