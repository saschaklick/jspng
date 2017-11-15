const JSPNG = require('../jspng.js');
const fs    = require('fs');

const Color = function(r, g, b, a){ Color._buffer = new Buffer([r, g, b, a]); };
const Draw  = function(x, y){ var i;
	i = ((y + 0) * wid + (x + 0)) * 4; if(i > 0 && i < pixels.length) Color._buffer.copy(pixels, i);
	i = ((y + 1) * wid + (x + 0)) * 4; if(i > 0 && i < pixels.length) Color._buffer.copy(pixels, i);
	i = ((y - 1) * wid + (x + 0)) * 4; if(i > 0 && i < pixels.length) Color._buffer.copy(pixels, i);
	i = ((y + 0) * wid + (x + 1)) * 4; if(i > 0 && i < pixels.length) Color._buffer.copy(pixels, i);
	i = ((y + 0) * wid + (x - 1)) * 4; if(i > 0 && i < pixels.length) Color._buffer.copy(pixels, i);
};
Color(0,0,0,0);

var wid = 1205; hei = 1227; pixels = new Buffer(hei * wid * 4).fill(0xff);

Color(0xff, 0x00, 0xff, 0xff); Draw(0, 0);

for(var y = 0; y < hei; y++) for(var x = 0; x < wid; x++){
	var p_i = (y * wid + x) * 4;
	new Buffer([ Math.floor((y / hei) * 0xff), Math.floor(((wid - x) / wid) * 0xff), Math.floor((x / wid) * 0xff), Math.max((x / wid) * 0xff, (y / hei) * 0xff) ]).copy(pixels, p_i);
}
for(var y = 0; y < hei; y++){
	Color(0xff, 0xff, 0xff, 0xff); Draw(Math.floor(wid / 2), y);
}
for(var x = 0; x < wid; x++){
	Color(0xff, 0xff, 0xff, 0xff); Draw(x, Math.floor(hei / 2));
}
for(var x = 0; x < wid; x++){
	var y = Math.floor(Math.cos((x / wid) * Math.PI * 2) * (hei / 4) + (hei / 2));
	Color(0xff, 0x00, 0x00, 0xff); Draw(x, y);
	Color(0x00, 0xff, 0x00, 0xff); Draw(x, hei - y);
}
for(var rad = 0; rad < Math.PI * 2; rad += 0.0001){
	Color(0x00, 0x00, 0xff, 0xff); Draw(Math.floor(Math.cos(rad) * (wid / 4) + (wid / 2)), Math.floor(Math.sin(rad) * (hei / 4) + (hei / 2)));
}

var jspng = new JSPNG(pixels, {
	width     : wid,
	height    : hei,
	inputmode : 'rgba',
	meta      : {
		'Software' : JSPNG.VERSION,
		'Author'   : 'Sascha Klick'
	}
});

var colortypes = ['truecolor', 'truecolor+alpha', 'grayscale', 'grayscale+alpha'];

for(var c_i in colortypes){
	var colortype = colortypes[c_i];
	
	jspng.setColorType(colortype);
	
	require('fs').writeFileSync('/tmp/jspng-example-' + colortype + '.png', jspng.toBuffer());
};



