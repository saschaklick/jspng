/***********************************************************************
 *
 * @file    Raw pixel data to PNG image converter.
 * @link    https://github.com/saschaklick/jspng
 * @version 1.1.0
 *
 * @author  Sascha Klick
 *
 **********************************************************************/

/** @function JSPNG
 * @param     {Buffer} input
 * @param     {object} options
 * @constructor
 * 
 * The JSPNG class is fed a stream of pixels and converts it into a valid
 * PNG image that can be stored in a file or displayed directly in a
 * browser.
 * 
 * It works in both NodeJS using the native Buffer class and client-side
 * in most browsers (Chrome & Firefox verified) by using its own Buffer
 * implementation that works with TypedArray instances.
 * 
 * It accepts pixel data in a freely configurable format via an input
 * format string and can output in a varierty of color formats supported
 * by the PNG standard.
 * 
 * @author Sascha Klick
 * @see    http://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html
 */
var JSPNG = function(input, options){
	this.options = options || {};
	
	if(JSPNG.Buffer.isBuffer(input)){
		this.setInput(input);
	}else{
		throw new Error('first argument needs to be a buffer');
	}
	
	this._fill  = new JSPNG.Buffer(8).fill(0x00);
	
	this.setInputFormat(this.options['inputmode'] || 'r8g8b8a8');
	this.setColorType(this.options['colortype'] || 'truecolor');
	
	if(!this.options['height']){
		if(!this.options['width']){
			this.options['width'] = this.options['height'] = Math.ceil(Math.sqrt(this._pixels.length / (this._input.bpp / 8)));
		}else{
			this.options['height'] = Math.ceil((this._pixels.length / (this._color_type.bpp / 8)) / this.options['width']);
		}
	}else
	if(!this.options['width']){
		this.options['width'] = Math.ceil((this._pixels.length / (this._color_type.bpp / 8)) / this.options['height']);
	}
	
	this.setSize(this.options['width'], this.options['height']);
};

/** 
 * @desc      JSPNG version number.
 *
 * @author    Sascha Klick
 */
JSPNG.VERSION = 'JSPNG 1.1.0';

/**
 * @desc      List of supported color types.
 * 
 * @author    Sascha Klick
 */
JSPNG.prototype.COLOR_TYPES  = {
	'grayscale'       : { bitDepth : 8, colorType : 0, bpp : 8  },
	'truecolor'       : { bitDepth : 8, colorType : 2, bpp : 24 },
	'grayscale+alpha' : { bitDepth : 8, colorType : 4, bpp : 16 },
	'truecolor+alpha' : { bitDepth : 8, colorType : 6, bpp : 32 }
};

/** @function JSPNG#setInputFormat
 * @param     {string} inputFormat
 * @desc      Set the format of the input data in the Buffer.
 * 
 * The input format is a descriptive string containing the color channels
 * (*r*,*g*,*b* for the different colors, *G* for gray) optionally
 * followed by a number indicating the channels bitsize. Only 8 is
 * allowed at the moment.
 * 
 * Additionally a placeholder *.* can be used to skip over a given number
 * of bits. Again only 8 are allowed at the moment.
 * 
 * An input stream of pixels in RGBA-format (8 bits per channel) would
 * required the input format *rgba* or *r8g8b8a8* for correct conversion.
 * Using input format *...G* on the same input data would ignore all
 * three color channels and convert the alpha channel to grayscale in
 * the resulting image.
 * 
 * @author    Sascha Klick
 */
JSPNG.prototype.setInputFormat = function(inputFormat){
	if(typeof inputFormat !== 'string') throw new Error('input format needs to be string');
	var re    = /([rgbaG\.])(\d*)/g;
	this._input = { bpp : 0 };
	while(match = re.exec(inputFormat)){
		var channel = match[1], bpc = Number(match[2]) || 8;
		if(bpc !== 8)              throw new Error('only 8bit input channels are allowed at the moment');
		if(channel in this._input) throw new Error('illegal multiple definition of same channel in input format: "' + channel + '" at ' + match.index);
		switch(channel){
			case 'G':
				if(this._input.r || this._input.g || this._input.b) throw new Error('cannot not mix grayscale [G] and truecolor [rgb] channels in input format');
			case 'r':
			case 'g':
			case 'b':
				if(this._input.G) throw new Error('cannot not mix grayscale [G] and truecolor [rgb] channels in input format');
			case 'a':
				this._input[channel] = [ Math.floor(this._input.bpp / 8), 0x00ff, 0, 0 ];
			case '.':
				this._input.bpp += bpc;
				break;
		}
	}
	this._input.bpp /= 8;
	if(this._input.bpp === 0) throw new Error('input mode is empty or invalid; no channels [r, g, b, a or G] found');
	if(!this._input.a) this.alpha = 0xffff;
};

/** @function JSPNG#setSize
 * @param     {number} width
 * @param     {number} height
 * @desc      Set the width and height of the resulting PNG image.
 * 
 * @author    Sascha Klick
 */
JSPNG.prototype.setSize = function(width, height){
	this._width  = !isNaN(width)  ? width : null;
	this._height = !isNaN(height) ? height : null;
};

/** @function JSPNG#setColorType
 * @param     {string} colorType
 * @desc      Set the type of color encoding the generated PNG should use.
 * 
 * @author    Sascha Klick
 */
JSPNG.prototype.setColorType = function(colorType){
	if(colorType in this.COLOR_TYPES){
		this._color_type      = this.COLOR_TYPES[colorType];
		this._bitDepth  = this._color_type.bitDepth;
		this._colorType = this._color_type.colorType;
	}else{
		throw new Error('unknown color type: use only ' + Object.keys(this.COLOR_TYPES).map(function(a){ return '"' + a + '"'; }).join(', '));
	}
	this._compressionMethod = 0;
	this._filterMethod      = 0;
	this._interlacedMethod  = 0;
};

/** @function JSPNG#_IDAT
 * @param     {string} input
 * @desc      Set the Buffer that will be used as input to be converted to a PNG image.
 * 
 * @author    Sascha Klick
 */
JSPNG.prototype.setInput = function(input){
	if(JSPNG.Buffer.isBuffer(input)){
		this._pixels = input;
	}else{
		this._pixels = null;
	}
};

/** @function JSPNG#toBuffer
 * @returns   {Buffer}
 * @desc      Do some sanity checks, then convert the input data into a PNG image.
 * 
 * @author    Sascha Klick
 */
JSPNG.prototype.toBuffer = function(){
	if(this._color_type   === null)   throw new Error('mode not set; call setColorType(mode) with a supported mode string first');
	if(this._width  === null ||
	   this._height === null)   throw new Error('height and/or width not set; call setSize(width, height) first');
	if(this._pixels === null)   throw new Error('pixels not set; call setPixels(buffer) first');
	
	var output = JSPNG.Buffer.concat([ this._header(), this._IHDR(), this._bKGD(), this._IDAT() ]);
	
	for(var keyword in this.options.meta){
		output = JSPNG.Buffer.concat([ output, this._tEXt(keyword, this.options.meta[keyword]) ]);
	}
	
	return JSPNG.Buffer.concat([ output, this._IEND() ]);
};

/** @function JSPNG#_header
 * @returns   {Buffer}
 * @desc      Returns the PNG header magic required to identify a PNG image.
 * @private
 * 
 * @author    Sascha Klick
 */
JSPNG.prototype._header = function(){
	return new JSPNG.Buffer([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
};

/** @function JSPNG#_IHDR
 * @returns   {Buffer}
 * @desc      Prepare an IHDR (image header) chunk.
 * @private
 * 
 * @author    Sascha Klick
 */
JSPNG.prototype._IHDR = function(){
	var ihdr = new JSPNG.Buffer(13);
	ihdr.writeUInt32BE(this._width, 0);
	ihdr.writeUInt32BE(this._height, 4);
	ihdr.writeUInt8(this._bitDepth, 8);
	ihdr.writeUInt8(this._colorType, 9);
	ihdr.writeUInt8(this._compressionMethod, 10);
	ihdr.writeUInt8(this._filterMethod, 11);
	ihdr.writeUInt8(this._interlacedMethod, 12);
	return this._chunk('IHDR', ihdr);
};

/** @function JSPNG#_IEND
 * @returns   {Buffer}
 * @desc      Prepare an IEND (file end) chunk.
 * @private
 * 
 * @author    Sascha Klick
 */
JSPNG.prototype._IEND = function(){
	return this._chunk('IEND', new JSPNG.Buffer(0));
};

/** @function JSPNG#_tEXt
 * @returns   {Buffer}
 * @desc      Prepare an tEXt (textual meta data) chunk.
 * @private
 * 
 * @author    Sascha Klick
 */
JSPNG.prototype._tEXt = function(keyword, text){
	return this._chunk('tEXt', JSPNG.Buffer.concat([ new JSPNG.Buffer(keyword).slice(0, 80), new JSPNG.Buffer([0]), new JSPNG.Buffer(text) ]));
};

/** @function JSPNG#_IDAT
 * @returns   {Buffer}
 * @desc      Prepare a bKGD (transparency) chunk.
 * @private
 * 
 * @author    Sascha Klick
 */
JSPNG.prototype._bKGD = function(){ return new JSPNG.Buffer(0);
	if(!(this._colorType & 4)) return new JSPNG.Buffer(0);
	if(this._colorType & 1){
		return this._chunk('bKGD', new JSPNG.Buffer([0x00]));	
	}else
	if(this._colorType & 2){
		return this._chunk('bKGD', new JSPNG.Buffer([0xff, 0xff, 0xff, 0xff, 0xff, 0xff]));	
	}else{
		return this._chunk('bKGD', new JSPNG.Buffer([0xff, 0xff]));	
	}
	return new JSPNG.Buffer(0);
};

/** @function JSPNG#_IDAT
 * @returns   {Buffer}
 * @desc      Prepare an IDAT (image data) chunk.
 * @private
 * 
 * @author    Sascha Klick
 */
JSPNG.prototype._IDAT = function(){
	var imagedata = new JSPNG.Buffer(((this._width * Math.floor(this._color_type.bpp / 8)) + 1) * this._height), buf_pos = 0, p_i = 0;
	for(var y = 0; y < this._height; y++){
		imagedata[buf_pos++] = 0;
		for(var x = 0; x < this._width; x++){
			var pixel = this._pixels.slice(p_i, p_i + this._input.bpp);
			p_i += this._input.bpp;
			if(pixel.length !== this._input.bpp){
				pixel = this._fill;
			}
			var colors = {};
			if(this._input.G){
				colors.r = colors.g = colors.b = (pixel.readUInt8(this._input.G[0]) & this._input.G[1]) << this._input.G[2] >> this._input.G[3];
				colors.a = this._input.a ? (pixel.readUInt8(this._input.a[0]) & this._input.a[1]) << this._input.a[2] >> this._input.a[3] : 0xffff;
			}else{
				colors.r = this._input.r ? (pixel.readUInt8(this._input.r[0]) & this._input.r[1]) << this._input.r[2] >> this._input.r[3] : 0x0000;
				colors.g = this._input.g ? (pixel.readUInt8(this._input.g[0]) & this._input.g[1]) << this._input.g[2] >> this._input.g[3] : 0x0000;
				colors.b = this._input.b ? (pixel.readUInt8(this._input.b[0]) & this._input.b[1]) << this._input.b[2] >> this._input.b[3] : 0x0000;
				colors.a = this._input.a ? (pixel.readUInt8(this._input.a[0]) & this._input.a[1]) << this._input.a[2] >> this._input.a[3] : 0xffff;
			}
			if(this._colorType === 0){
				imagedata[buf_pos++] = Math.floor((colors.r + colors.g + colors.b) / 3) & 0x00ff;
			}else
			if(this._colorType === 2){
				imagedata[buf_pos++] = colors.r & 0x00ff;
				imagedata[buf_pos++] = colors.g & 0x00ff;
				imagedata[buf_pos++] = colors.b & 0x00ff;
			}
			else
			if(this._colorType === 4){
				imagedata[buf_pos++] = Math.floor((colors.r + colors.g + colors.b) / 3) & 0x00ff;
				imagedata[buf_pos++] = colors.a & 0x00ff;
			}else
			if(this._colorType === 6){
				imagedata[buf_pos++] = colors.r & 0x00ff;
				imagedata[buf_pos++] = colors.g & 0x00ff;
				imagedata[buf_pos++] = colors.b & 0x00ff;
				imagedata[buf_pos++] = colors.a & 0x00ff;
			}
		}
	}
	return this._chunk('IDAT', ZLIBDEFLATE(imagedata));
};

/** @function JSPNG#_chunk
 * @param     {string} type
 * @param     {Buffer} buffer
 * @returns   {Buffer}
 * @desc      Wrap binary data into a PNG chunk.
 * @private
 * 
 * @author    Sascha Klick
 */
JSPNG.prototype._chunk = function(type, buffer){
	var ret = new JSPNG.Buffer(buffer.length + 12);
	ret.writeUInt32BE(buffer.length, 0, 4);
	ret.write(type, 4, 4, 'ascii');
	buffer.copy(ret, 8);
	ret.writeUInt32BE(CRC32(ret.slice(4, ret.length - 4)), ret.length - 4);
	return ret;
};

/** @function CRC32
 * @param     {Buffer} in_buf
 * @returns   {number}
 * @desc      Calculate CRC32 checksum.
 * 
 * @author    Sascha Klick
 * @see       https://en.wikipedia.org/wiki/Cyclic_redundancy_check
 */
var CRC32 = function(in_buf){
	const crc32table = CRC32._crc32table || (CRC32._crc32table = function(){
		var table = Array(256);
		for (var n = 0; n < 256; n++){
			var c = n;
				for (var k = 0; k < 8; k++){
					if(c & 1) c = 0xedb88320 ^ (c >>> 1); else c = c >>> 1;
				}
				table[n] = c;
		}
		return table;
	}(), CRC32._crc32table);
	
	var crc32 = 0xffffffff;

	for (var n = 0; n < in_buf.length; n++) {
		crc32 = crc32table[(crc32 ^ in_buf[n]) & 0xff] ^ (crc32 >>> 8);
	}
	
	return crc32 = (-1 ^ crc32) >>> 0;
};

/** @function ADLER32
 * @param     {Buffer} in_buf
 * @returns   {number}
 * @desc      Calculate Adler-32 checksum.
 * 
 * @author    Sascha Klick
 * @see       https://en.wikipedia.org/wiki/Adler-32
 */
var ADLER32 = function(in_buf){
	const MOD_ADLER = 65521;

    var A = 1, B = 0;
    for (i = 0; i < in_buf.length; i++){
        A = (A + in_buf[i]) % MOD_ADLER;
        B = (B + A) % MOD_ADLER;
    }
    var ret = ((B * 65536) + A);
    return ret;
};

/** @function ZLIBDEFLATE 
 * @param     {Buffer} in_buf
 * @returns   {Buffer}
 * @desc      Transform binary data into a zlib-compatible DEFLATE data stream.
 *
 * @author    Sascha Klick
 * @see       https://en.wikipedia.org/wiki/DEFLATE
 */
var ZLIBDEFLATE = function(in_buf){
	var in_i = 0, out_i = 0;
	var out_buf = new JSPNG.Buffer(2 + in_buf.length + (Math.ceil(in_buf.length / ZLIBDEFLATE.MAX_BLOCK_SIZE) * 5) + 4);
	
	const cmf = 0x78, flg = 0x01;
	out_buf.writeUInt8(cmf, out_i++);
	out_buf.writeUInt8(flg, out_i++);
	
	for(; in_i < in_buf.length; in_i += ZLIBDEFLATE.MAX_BLOCK_SIZE){
		var block = in_buf.slice(in_i, in_i + ZLIBDEFLATE.MAX_BLOCK_SIZE), block_len = block.length;
		out_buf.writeUInt8((in_buf.length > in_i + ZLIBDEFLATE.MAX_BLOCK_SIZE) ? 0x00 : 0x01, out_i++);
		out_buf.writeUInt16LE(block_len & 0xffff, out_i);
		out_i += 2;
		out_buf.writeUInt16LE((block_len & 0xffff) ^ 0xffff, out_i);
		out_i += 2;
		block.copy(out_buf, out_i);
		out_i += block_len;
	}
	
	out_buf.writeUInt32BE(ADLER32(in_buf), out_i);
	
	return out_buf;
};
ZLIBDEFLATE.MAX_BLOCK_SIZE = 32767;

JSPNG.ADLER32 = ADLER32;
JSPNG.CRC32   = CRC32;

if(typeof module === 'object' && typeof module.exports === 'object'){
	module.exports = JSPNG;
}

/***********************************************************************
 *
 * Limited NodeJS-compatible Buffer shim for client-side Browser
 * support.
 * 
 * Contains just enough capabilities to ensure JSPNG to function in a
 * browser without NodeJS-compatible Buffer class.
 * 
 * Use as a replacement for a proper Buffer anywhere else at your own
 * risk. It will probably not work.
 * 
 **********************************************************************/
JSPNG.Buffer = (typeof module !== 'undefined' && module.exports) ? Buffer : function(){
	var Buffer = Uint8ClampedArray;
	Buffer.isBuffer = function(obj){
		return obj instanceof Buffer;
	};
	Buffer.concat = function(buffers){
		var len = 0, pos = 0;
		for(var i = 0; i < buffers.length; i++) len += buffers[i].length;  
		var ret = new Buffer(len);
		for(var i = 0; i < buffers.length; i++){ ret.set(buffers[i], pos); pos += buffers[i].length; }
		return ret;
	};
	Buffer.prototype.copy = function(target, pos){
		target.set(this, pos);
	};
	Buffer.prototype.readUInt8 = function(pos){
		return new DataView(this.buffer).getUint8(pos);
	};
	Buffer.prototype.writeUInt8 = function(value, pos){
		new DataView(this.buffer).setUint8(pos, value);
	};
	Buffer.prototype.writeUInt32BE = function(value, pos){
		new DataView(this.buffer).setUint32(pos, value, false);
	};
	Buffer.prototype.writeUInt16LE = function(value, pos){
		new DataView(this.buffer).setUint16(pos, value, true);
	};
	Buffer.prototype.write = function(text, pos, len, enc){
		const encoder = new TextEncoder();
		encoder.encoding = enc || 'utf-8';
		this.set(encoder.encode(text), pos);
	};
	return Buffer;
}(this);
