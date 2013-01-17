var EventEmitter = require('EventEmitter')

function inherits (ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false
    }
  });
};

inherits(Stream, EventEmitter);

function Stream () { }

Stream.prototype.pipe = function (dest, options) {
  var source = this;

  function ondata (chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  function ondrain () {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  var didOnEnd = false;
  function onend () {
    if (didOnEnd) return;
    didOnEnd = true;
    dest.end();
  }

  function onclose () {
    if (didOnEnd) return;
    didOnEnd = true;
    if (typeof dest.destroy === 'function') dest.destroy();
  }

  function onerror (err) {
    cleanup();
    if (this.listeners('error').length === 0) {
      throw err; // Unhandled stream error in pipe.
    }
  }

  function cleanup() {
    source.removeListener('data', ondata); dest.removeListener('drain', ondrain);
    source.removeListener('end', onend); source.removeListener('close', onclose);
    source.removeListener('error', onerror); dest.removeListener('error', onerror);
    source.removeListener('end', cleanup); source.removeListener('close', cleanup);
    dest.removeListener('end', cleanup); dest.removeListener('close', cleanup);
  }

  source.on('data', ondata); dest.on('drain', ondrain);
  if ((!options || options.end !== false)) {
    source.on('end', onend); source.on('close', onclose);
  }
  source.on('error', onerror); dest.on('error', onerror);
  source.on('end', cleanup); source.on('close', cleanup);
  dest.on('end', cleanup); dest.on('close', cleanup);

  dest.emit('pipe', source);
  return dest;
};

module.exports = Stream;