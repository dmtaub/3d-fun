(function() {
  'use strict';

  var globals = typeof global === 'undefined' ? self : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var aliases = {};
  var has = {}.hasOwnProperty;

  var expRe = /^\.\.?(\/|$)/;
  var expand = function(root, name) {
    var results = [], part;
    var parts = (expRe.test(name) ? root + '/' + name : name).split('/');
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function expanded(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var hot = hmr && hmr.createHot(name);
    var module = {id: name, exports: {}, hot: hot};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var expandAlias = function(name) {
    return aliases[name] ? expandAlias(aliases[name]) : name;
  };

  var _resolve = function(name, dep) {
    return expandAlias(expand(dirname(name), dep));
  };

  var require = function(name, loaderPath) {
    if (loaderPath == null) loaderPath = '/';
    var path = expandAlias(name);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    throw new Error("Cannot find module '" + name + "' from '" + loaderPath + "'");
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  var extRe = /\.[^.\/]+$/;
  var indexRe = /\/index(\.[^\/]+)?$/;
  var addExtensions = function(bundle) {
    if (extRe.test(bundle)) {
      var alias = bundle.replace(extRe, '');
      if (!has.call(aliases, alias) || aliases[alias].replace(extRe, '') === alias + '/index') {
        aliases[alias] = bundle;
      }
    }

    if (indexRe.test(bundle)) {
      var iAlias = bundle.replace(indexRe, '');
      if (!has.call(aliases, iAlias)) {
        aliases[iAlias] = bundle;
      }
    }
  };

  require.register = require.define = function(bundle, fn) {
    if (bundle && typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          require.register(key, bundle[key]);
        }
      }
    } else {
      modules[bundle] = fn;
      delete cache[bundle];
      addExtensions(bundle);
    }
  };

  require.list = function() {
    var list = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        list.push(item);
      }
    }
    return list;
  };

  var hmr = globals._hmr && new globals._hmr(_resolve, require, modules, cache);
  require._cache = cache;
  require.hmr = hmr && hmr.wrap;
  require.brunch = true;
  globals.require = require;
})();

(function() {
var global = typeof window === 'undefined' ? this : window;
var process;
var __makeRelativeRequire = function(require, mappings, pref) {
  var none = {};
  var tryReq = function(name, pref) {
    var val;
    try {
      val = require(pref + '/node_modules/' + name);
      return val;
    } catch (e) {
      if (e.toString().indexOf('Cannot find module') === -1) {
        throw e;
      }

      if (pref.indexOf('node_modules') !== -1) {
        var s = pref.split('/');
        var i = s.lastIndexOf('node_modules');
        var newPref = s.slice(0, i).join('/');
        return tryReq(name, newPref);
      }
    }
    return none;
  };
  return function(name) {
    if (name in mappings) name = mappings[name];
    if (!name) return;
    if (name[0] !== '.' && pref) {
      var val = tryReq(name, pref);
      if (val !== none) return val;
    }
    return require(name);
  }
};
require.register("app.coffee", function(exports, require, module) {
var App, Controls, Player, State, Stats, TWEEN, Terrain,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

State = require('state');

Terrain = require('terrain');

Controls = require('controls');

Player = require('player');

Stats = require('three/examples/js/libs/stats.min');

TWEEN = require('tween.js');

App = (function() {
  function App() {
    this.render = bind(this.render, this);
    this.initScene = bind(this.initScene, this);
    this.config = State;
    this.initScene();
    window.addEventListener('resize', ((function(_this) {
      return function() {
        _this.camera.aspect = window.innerWidth / window.innerHeight;
        _this.camera.updateProjectionMatrix();
        return _this.renderer.setSize(window.innerWidth, window.innerHeight);
      };
    })(this)), false);
  }

  App.prototype.initScene = function() {
    var light, terrain, x;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMapSoft = true;
    document.getElementById('viewport').appendChild(this.renderer.domElement);
    if (State.enable_stats) {
      this.renderStats = new Stats;
      this.renderStats.domElement.style.position = 'absolute';
      this.renderStats.domElement.style.top = '0px';
      this.renderStats.domElement.style.zIndex = 100;
      this.renderStats.domElement.title = 'for rendering';
      document.getElementById('viewport').appendChild(this.renderStats.domElement);
      this.physicsStats = new Stats;
      this.physicsStats.domElement.style.position = 'absolute';
      this.physicsStats.domElement.style.top = '50px';
      this.physicsStats.domElement.style.zIndex = 100;
      this.physicsStats.domElement.title = 'for physics';
      document.getElementById('viewport').appendChild(this.physicsStats.domElement);
    }
    this.scene = new Physijs.Scene({
      fixedTimeStep: State.slow_factor / 120
    });
    this.scene.setGravity(new THREE.Vector3(0, -80, 0));
    this.scene.addEventListener('update', (function(_this) {
      return function() {
        var x, y, z;
        TWEEN.update();
        _this.scene.simulate(void 0, 1);
        if (State.enable_stats) {
          _this.physicsStats.update();
        }
        if (_this.playerCamera) {
          x = _this.player.shape.position.x + 20;
          y = _this.player.shape.position.y + 20;
          z = _this.player.shape.position.z + 20;
          _this.camera.position.set(x, y, z);
          _this.camera.lookAt(_this.player.shape.position);
        }
        if (_this.player.shape.position.y < -20) {
          _this.scene.remove(_this.player.shape);
          _this.player.resetPosition();
          _this.scene.add(_this.player.shape);
        }
      };
    })(this));
    x = 2.5;
    this.camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 1000);
    this.camera.position.set(60 * x, 50 * x, 60 * x);
    this.camera.lookAt(this.scene.position);
    this.scene.add(this.camera);
    this.playerCamera = false;
    kd.ESC.up((function(_this) {
      return function() {
        if (_this.playerCamera) {
          _this.playerCamera = false;
          _this.camera.position.set(60 * x, 50 * x, 60 * x);
          return _this.camera.lookAt(_this.scene.position);
        } else {
          return _this.playerCamera = true;
        }
      };
    })(this));
    light = new THREE.DirectionalLight(0xFFFFFF);
    light.position.set(20, 40, -15);
    light.target.position.copy(this.scene.position);
    light.castShadow = true;
    light.shadow.camera.left = -60;
    light.shadow.camera.top = -60;
    light.shadow.camera.right = 60;
    light.shadow.camera.bottom = 60;
    light.shadow.camera.near = 20;
    light.shadow.camera.far = 200;
    light.shadow.bias = -.0001;
    light.shadow.mapSize.width = light.shadow.mapSize.height = 2048;
    this.scene.add(light);
    if (State.fancy_ball) {
      this.cubeCamera = new THREE.CubeCamera(1, 200, 512);
    }
    terrain = new Terrain(this.scene, (function(_this) {
      return function() {
        requestAnimationFrame(_this.render);
        _this.scene.simulate();
        _this.player = new Player();
        _this.controls = new Controls(_this.player);
        if (State.fancy_ball) {
          _this.player.shape.material.envMap = _this.cubeCamera.renderTarget.texture;
        }
        _this.scene.add(_this.player.shape);
        _this.controls.setupActions(terrain);
        return _this.scene.addEventListener('update', function() {
          _this.controls.moveWithKeys();
          if (State.fancy_ball) {
            return _this.cubeCamera.update(_this.renderer, _this.scene);
          }
        });
      };
    })(this));
  };

  App.prototype.render = function() {
    requestAnimationFrame(this.render);
    this.renderer.render(this.scene, this.camera);
    if (State.enable_stats) {
      this.renderStats.update();
    }
  };

  return App;

})();

module.exports = App;
});

;require.register("controls.coffee", function(exports, require, module) {
var Controls, State,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

State = require('state');

module.exports = (function(_this) {
  return function(player) {
    return new Controls(player);
  };
})(this);

Controls = (function() {
  Controls.prototype.jumpVelocity = 22;

  Controls.prototype.linearDamping = 0.5;

  Controls.prototype.angularDamping = 0.8;

  Controls.prototype.linearFactor = 0.3 * State.slow_factor;

  Controls.prototype.rotationalFactor = 10 * State.slow_factor;

  function Controls(player1) {
    this.player = player1;
    this.moveWithKeys = bind(this.moveWithKeys, this);
    this.setupActions = bind(this.setupActions, this);
    this.jump = bind(this.jump, this);
    this.player.shape.setDamping(this.linearDamping, this.angularDamping);
  }

  Controls.prototype.jump = function(scale) {
    var v;
    if (scale == null) {
      scale = 2;
    }
    v = this.player.shape.getLinearVelocity();
    v.y = this.jumpVelocity * scale;
    return this.player.shape.setLinearVelocity(v);
  };

  Controls.prototype.setupActions = function(terrain) {
    var delay, doAfterDelay;
    this.terrain = terrain;
    doAfterDelay = (function(_this) {
      return function() {
        return _this.jump();
      };
    })(this);
    delay = State.transition_time / 2;
    kd.W.up((function(_this) {
      return function() {
        _this.terrain.setTarget(2);
        if (_this.terrain.lastScale < 1) {
          _this.jump();
          return setTimeout(doAfterDelay, delay);
        }
      };
    })(this));
    kd.A.up((function(_this) {
      return function() {
        _this.terrain.setTarget(_this.terrain.lastScale);
        if (_this.terrain.lastScale > 1) {
          _this.jump();
          return setTimeout(doAfterDelay, delay);
        }
      };
    })(this));
    kd.S.up((function(_this) {
      return function() {
        return _this.terrain.setTarget(0);
      };
    })(this));
    kd.D.up((function(_this) {
      return function() {
        return _this.terrain.setTarget(1);
      };
    })(this));
    return kd.E.up((function(_this) {
      return function() {
        return _this.terrain.setTarget(Math.random());
      };
    })(this));
  };

  Controls.prototype.moveWithKeys = function() {
    var contactGround, u3, v3;
    if (State.disable_arrows) {
      return;
    }
    v3 = this.player.shape.getLinearVelocity();
    u3 = this.player.shape.getAngularVelocity();
    contactGround = this.player.shape._physijs.touches.length > 0;
    if (kd.RIGHT.isDown()) {
      v3.x += this.linearFactor;
      v3.z -= this.linearFactor;
      if (contactGround) {
        u3.x -= this.rotationalFactor;
        u3.z -= this.rotationalFactor;
      } else {

      }
    }
    if (kd.LEFT.isDown()) {
      v3.x -= this.linearFactor;
      v3.z += this.linearFactor;
      if (contactGround) {
        u3.x += this.rotationalFactor;
        u3.z += this.rotationalFactor;
      } else {

      }
    }
    if (kd.UP.isDown()) {
      v3.x -= this.linearFactor;
      v3.z -= this.linearFactor;
      if (contactGround) {
        u3.x -= this.rotationalFactor;
        u3.z += this.rotationalFactor;
      } else {

      }
    }
    if (kd.DOWN.isDown()) {
      v3.x += this.linearFactor;
      v3.z += this.linearFactor;
      if (contactGround) {
        u3.x += this.rotationalFactor;
        u3.z -= this.rotationalFactor;
      } else {

      }
    }
    if (kd.SPACE.isDown() && contactGround) {
      v3.y = this.jumpVelocity;
    }
    u3.clamp(State.min_vector, State.max_vector);
    v3.clamp(State.min_vector, State.max_vector);
    this.player.shape.setAngularVelocity(u3);
    this.player.shape.setLinearVelocity(v3);
  };

  return Controls;

})();
});

;require.register("initialize.js", function(exports, require, module) {
App = require('app');

document.addEventListener('DOMContentLoaded', function() {
  // do your setup here
  console.log('Initialized brunch app');
  window.game = new App();
});

});

require.register("player.coffee", function(exports, require, module) {
var BASE_MASS, Player, State, TWEEN,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

State = require('state');

BASE_MASS = 14.1 * 8;

TWEEN = require('tween.js');

module.exports = Player = (function() {
  function Player() {
    this.resetPosition = bind(this.resetPosition, this);
    var playerMass, sphere_geometry;
    sphere_geometry = new THREE.SphereGeometry(1.5, State.ball_long_divs, State.ball_lat_divs);
    this.material = new THREE.MeshPhongMaterial({
      opacity: 0,
      transparent: true,
      reflectivity: 0.9,
      combine: THREE.AddOperation,
      flatShading: THREE.FlatShading,
      color: 'gray',
      specular: 'white',
      emissive: '#222',
      shininess: 40
    });
    playerMass = BASE_MASS * State.slow_factor;
    this.shape = new Physijs.SphereMesh(sphere_geometry, this.material, playerMass);
    console.log("MASS: ", playerMass);
    this.material.color.setRGB(Math.random() * 100 / 100, Math.random() * 100 / 100, Math.random() * 100 / 100);
    this.shape.castShadow = true;
    this.resetPosition();
  }

  Player.prototype.resetPosition = function() {
    this.material.opacity = 0;
    this.shape.position.set(Math.random() * 30 - 15, State.max_height + 5, Math.random() * 30 - 15);
    this.shape.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    return new TWEEN.Tween(this.material).to({
      opacity: 1
    }, 1500).start();
  };

  return Player;

})();
});

;require.register("state.coffee", function(exports, require, module) {
var MAX_VECTOR, SLOW, STATS, State;

SLOW = false;

STATS = true;

MAX_VECTOR = new THREE.Vector3(20, 5000, 20);

State = (function() {
  function State() {}

  State.disable_arrows = false;

  State.enable_stats = STATS;

  State.slow_factor = SLOW ? 3 : 1;

  State.max_height = 0;

  State.ground_friction = 0;

  State.ground_restitution = .2;

  State.fancy_ball = false;

  State.ball_lat_divs = 6;

  State.ball_long_divs = 12;

  State.max_vector = MAX_VECTOR;

  State.min_vector = MAX_VECTOR.clone().multiplyScalar(-1);

  State.transition_time = 1500;

  State.staying_time = 500;

  return State;

})();

module.exports = State;
});

;require.register("terrain.coffee", function(exports, require, module) {
var SquareTerrain, State, TWEEN, TextureLoader,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

require('three.terrain.js');

TextureLoader = new THREE.TextureLoader();

State = require('state');

TWEEN = require('tween.js');

module.exports = SquareTerrain = (function() {
  SquareTerrain.prototype.xS = 63;

  SquareTerrain.prototype.yS = 63;

  SquareTerrain.prototype.xSize = 128;

  SquareTerrain.prototype.ySize = 128;

  SquareTerrain.prototype.maxHeight = State.max_height;

  SquareTerrain.prototype.minHeight = -20;

  SquareTerrain.prototype.snowTop = 20;

  function SquareTerrain(scene, afterLoad) {
    this.afterLoad = afterLoad;
    this.addEarth = bind(this.addEarth, this);
    this.adjustTile = bind(this.adjustTile, this);
    this.setTarget = bind(this.setTarget, this);
    this.regenerate = bind(this.regenerate, this);
    this.addSky = bind(this.addSky, this);
    this.scatterMeshes = bind(this.scatterMeshes, this);
    this.addDefault = bind(this.addDefault, this);
    this.addEarth(scene, this.afterLoad);
  }

  SquareTerrain.prototype.addDefault = function(scene) {
    this.material = new THREE.MeshBasicMaterial({
      color: 0x5566aa
    });
    return this.regenerate(scene);
  };

  SquareTerrain.prototype.scatterMeshes = function() {
    var decoScene;
    decoScene = THREE.Terrain.ScatterMeshes(this.geo, {
      mesh: new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 12, 6)),
      w: this.xS,
      h: this.yS,
      spread: 0.02,
      randomness: Math.random
    });
    return this.visual.add(decoScene);
  };

  SquareTerrain.prototype.addSky = function(scene) {
    return TextureLoader.load('img/sky1.jpg', function(t1) {
      var skyDome;
      t1.minFilter = THREE.LinearFilter;
      skyDome = new THREE.Mesh(new THREE.SphereGeometry(8192 / 12, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), new THREE.MeshBasicMaterial({
        map: t1,
        side: THREE.BackSide,
        fog: false
      }));
      skyDome.position.y = 0;
      skyDome.rotation.x = Math.PI;
      return scene.add(skyDome);
    });
  };

  SquareTerrain.prototype.regenerate = function(scene) {
    var groundMaterial;
    this.visual = THREE.Terrain({
      easing: THREE.Terrain.Linear,
      frequency: 2.5,
      heightmap: THREE.Terrain.DiamondSquare,
      material: this.material || new THREE.MeshLambertMaterial({
        color: 0x2194ce
      }),
      maxHeight: this.maxHeight,
      minHeight: this.minHeight,
      steps: 10,
      useBufferGeometry: false,
      xSegments: this.xS,
      xSize: this.xSize,
      ySegments: this.yS,
      ySize: this.ySize
    });
    this.geo = this.visual.children[0].geometry;
    this.geo.zBase = this.geo.vertices.map(function(v) {
      return v.clone();
    });
    if (this.visual) {
      scene.remove(this.visual);
    }
    if (this.tangible) {
      scene.remove(this.tangible);
    }
    groundMaterial = Physijs.createMaterial(new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.05,
      wireframe: true
    }), State.ground_friction, State.ground_restitution);
    this.geo.computeFaceNormals();
    this.geo.computeVertexNormals();
    this.tangible = new Physijs.HeightfieldMesh(this.geo, groundMaterial, 0, this.xS, this.yS);
    this.tangible.rotation.x = Math.PI / -2;
    this.visual.children[0].receiveShadow = true;
    scene.add(this.tangible);
    scene.add(this.visual);
    return this.scene = scene;
  };

  SquareTerrain.prototype.setTarget = function(fraction) {
    if (fraction == null) {
      fraction = 0.5;
    }
    if (!this.geo.zBase) {
      throw "Need to have a base heightfield";
    }
    this.geo.z = this.geo.vertices.map(function(v) {
      return v.clone();
    });
    if (this.terrainScale === void 0) {
      this.terrainScale = 1;
    }
    if (this.tween) {
      this.lastScale = this.terrainScale;
      this.tween.stop();
    } else {
      this.lastScale = fraction;
    }
    console.log(TWEEN);
    return this.tween = new TWEEN.Tween(this).to({
      terrainScale: fraction
    }, State.transition_time).onUpdate(this.adjustTile).easing(TWEEN.Easing.Sinusoidal.InOut).delay(State.staying_time).start();
  };

  SquareTerrain.prototype.adjustTile = function(t) {
    var i, j, newZ, ref;
    if (!this.geo.zBase) {
      return;
    }
    for (i = j = 0, ref = this.geo.vertices.length - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
      newZ = this.minHeight + (this.geo.zBase[i].z - this.minHeight) * this.terrainScale;
      this.geo.vertices[i].z = newZ;
      this.tangible.setPointByThreeGeomIndex(i, newZ);
    }
    this.tangible.flagUpdate();
    return this.geo.verticesNeedUpdate = true;
  };

  SquareTerrain.prototype.addEarth = function(scene, cb) {
    var loader;
    loader = TextureLoader;
    return loader.load('img/sand1.jpg', (function(_this) {
      return function(t1) {
        return loader.load('img/grass1.jpg', function(t2) {
          return loader.load('img/stone1.jpg', function(t3) {
            return loader.load('img/snow1.jpg', function(t4) {
              _this.material = THREE.Terrain.generateBlendedMaterial([
                {
                  texture: t1
                }, {
                  texture: t2,
                  levels: [_this.minHeight * 3 / 4, _this.minHeight / 2, 0, _this.maxHeight / 2]
                }, {
                  texture: t3,
                  levels: [_this.maxHeight / 2, _this.maxHeight * 3 / 4, _this.maxHeight * 3 / 4, _this.maxHeight]
                }, {
                  texture: t4,
                  glsl: "1.0 - smoothstep(" + (20 - _this.snowTop) + ".0 + smoothstep(-" + _this.xSize + ".0, " + _this.xSize + ".0, vPosition.x) * 10.0, 20.0, vPosition.z)"
                }, {
                  texture: t3,
                  glsl: 'slope > 0.7853981633974483 ? 0.2 : 1.0 - smoothstep(0.47123889803846897, 0.7853981633974483, slope) + 0.2'
                }
              ]);
              _this.regenerate(scene);
              if (cb) {
                return cb();
              }
            });
          });
        });
      };
    })(this));
  };

  return SquareTerrain;

})();
});

;require.alias("buffer/index.js", "buffer");
require.alias("process/browser.js", "process");process = require('process');require.register("___globals___", function(exports, require, module) {
  

// Auto-loaded modules from config.npm.globals.
window.THREE = require("three");


});})();require('___globals___');


//# sourceMappingURL=app.js.map