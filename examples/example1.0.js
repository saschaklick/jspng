var fs    = require('fs');
var jspng = require('./jspng.js');

var pixels = jspng.Buffer(128 * 128 * 4).fill(new Buffer([ 0x00, 0x00, 0xff, 0x$

var png = new jspng(pixels, { width: 128, height: 128, inputmode: 'rgba', meta:$

fs.writeFileSync('jspng.png', png.toBuffer());
