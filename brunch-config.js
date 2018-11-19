// See http://brunch.io for documentation.
exports.files = {
  javascripts: {
    joinTo:
    {
      'app.js': /^app/,
      'vendor.js': /^(?!app).*(?<!(physijs_worker|ammo).js)$/, // We could also use /node_modules/ regex.
      'physijs_worker.js': /^vendor\/physijs_worker.js/, // We could also use /node_modules/ regex.
      'ammo.js': /^vendor\/ammo.js/ // We could also use /node_modules/ regex.
    }
  },
  stylesheets: {joinTo: 'app.css'}
};

exports.npm = {
  globals:{
    'THREE': 'three'
  }
};
