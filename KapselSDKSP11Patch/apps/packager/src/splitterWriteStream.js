var Util = require("util");
var stream = require('stream');

function SplitterWriteStream(options) {
    stream.Writable.call(this);

    var that = this;
    
    function writeNextBuffer(idx) {
	var buf;
	if (idx < that._fragmentId) {
	    buf = that._buffs[idx];
	} else {
	    buf = new Buffer(that._off);
	    that._buffs[idx].copy(buf, 0, 0, that._off);
	}
	var ret = that._stream.write(buf, function (er) {
	    if (er) {
		that.emit('error', new Error('Failed to write to stream'));
		return;
	    }
	    if (idx < that._fragmentId) {
		writeNextBuffer(idx+1);
	    } else {
		that.emit('close', {});
	    }
	});
    }

    this._stream = options.stream;
    this.options = options;
    this._buffs = [];
    this._buffs.push(new Buffer(this.options.size));
    this._off = 0;
    this._fragmentId = 0;
    this._totalSize = 0;
    this.on('finish', function () {
	that._stream.totalSize = that._totalSize;
	writeNextBuffer(0);
    });
    this._stream.on('error', function (er) {
    });
}

Util.inherits(SplitterWriteStream, stream.Writable);


SplitterWriteStream.prototype._write = function (chunk, encoding, callback) {
    var that = this;

    function writeChunk(chunk, chunkOff, callback) {
	var len = chunk.length;
	while (len > 0) {
	    var amount = 0;
	    if (len > that.options.size - that._off) {
		amount = that.options.size - that._off;
	    } else {
		amount = len;
	    }
	    if (amount > 0) {
		try {
		    chunk.copy(that._buffs[that._fragmentId], that._off, chunkOff, chunkOff + amount);
		} catch (e) {
		    console.log('ERROR: this off ' + that._off + '; chunkOff: ' + chunkOff + '; amount: ' + amount + '; chunk len: ' + chunk.length);
		    throw e;
		}
	    }
	    len -= amount;
	    that._off += amount;
	    chunkOff += amount;
	    that._totalSize += amount;
	    if (that._off >= that.options.size) {
		// save the buffer
		that._fragmentId += 1;
		that._buffs.push(new Buffer(that.options.size));
		that._off = 0;
	    }
	}
    
	callback();
    }
    
    writeChunk(chunk, 0, callback);
}

module.exports = SplitterWriteStream;
