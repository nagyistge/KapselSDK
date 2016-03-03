var Util = require("util"),
    stream = require('stream'),
    RequestQueue = require('./requestQueue.js'),
    Q = require("Q");

function UploadPackageWriteStream(queue, buildId, headers) {
    stream.Writable.call(this);

    this.buildId = buildId;
    this.headers = headers;
    this.queue = queue;
    this._first = true;
    this.count = 0;
    this.totalSize = undefined;
    this.on('finish', function () {
	this.emit('close', {
	    numFragments: this._fragmentId+1
	});
    });
}

Util.inherits(UploadPackageWriteStream, stream.Writable);

UploadPackageWriteStream.prototype._write = function (chunk, encoding, callback) {
    if (!this.totalSize) {
	callback(new Error("Need to set total size"));
	return;
    }

    var len = chunk.length;

    var path = this._first ?
	"/product-api.svc/ApplicationBuildPackages('"+this.buildId+"')/uploadSourceBundle" :
	"/product-api.svc/ApplicationBuildPackages('"+this.buildId+"')/appendChunk";

    this._first = false;

    var headers = this.headers;
    headers['slug-complete-size'] = this.totalSize;
    headers['slug'] = "package.zip";
    headers['content-type'] = 'application/octet-stream';
    headers["accept"] = "application/json";

    var item = {
	path: path,
	method: "POST",
	body: chunk,
	headers: headers
    };

    this.queue.add(item).then(function (o) {
	if (o.statusCode == 200) {
	    console.log("Upload source bundle: Response: " + o.statusCode + "\n" + o.response);
	    var response = JSON.parse(o.response);
	    var status = response.Status;
	    if (status == "OK") {
		callback();
	    } else {
		callback(new Error("Failed to upload bundle with status : " + status));
	    }
	} else {
	    callback(new Error("Failed to upload bundle with response code " + o.statusCode));
	}
    }, function (e) {
	callback(e);
    });
}

module.exports = UploadPackageWriteStream;
