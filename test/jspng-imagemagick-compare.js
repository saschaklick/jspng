const JSPNG  = require('../jspng');

const fs     = require('fs');
const os     = require('os');
const exec   = require('child_process').exec;
const chai   = require('chai');
const chaipr = require("chai-as-promised"); chai.use(chaipr);
const expect = chai.expect;

describe("imagemagick and jspng compare output", function() {
	
	var generate_solid_color_buffer = function(w, h, r, g, b){
		var image = JSPNG.Buffer(w * h * 3);
		for(var i = 0; i < w * h * 3; i += 3){ image[i + 0] = r; image[i + 1] = g; image[i + 2] = b; }
		return image;
	}
	var generate_solid_color_alpha_buffer = function(w, h, r, g, b, a){
		var image = JSPNG.Buffer(w * h * 4);
		for(var i = 0; i < w * h * 4; i += 4){ image[i + 0] = r; image[i + 1] = g; image[i + 2] = b;  image[i + 3] = a; }
		return image;
	}
	
	describe("image buffer generation helpers", function() {
		it("generate_solid_color_buffer", function(){
			var image = generate_solid_color_buffer(2, 2, 0xff, 0x88, 0x44);
			expect(image).to.deep.equal(new JSPNG.Buffer([0xff, 0x88, 0x44, 0xff, 0x88, 0x44, 0xff, 0x88, 0x44, 0xff, 0x88, 0x44]));
		});
		it("generate_solid_color_alpha_buffer", function(){
			var image = generate_solid_color_alpha_buffer(2, 2, 0xff, 0x88, 0x44, 0x22);
			expect(image).to.deep.equal(new JSPNG.Buffer([0xff, 0x88, 0x44, 0x22, 0xff, 0x88, 0x44, 0x22, 0xff, 0x88, 0x44, 0x22, 0xff, 0x88, 0x44, 0x22]));
		});
	});
	
	describe("jspng and graphicsmagick output compare", function() {
		var sizes      = [ [13, 17], [523, 747], [4127, 37], [37, 4127] ];
		var colors     = [
			{ r : 0x00, g : 0x00, b : 0x00, a : 0x00 },
			{ r : 0xff, g : 0xff, b : 0xff, a : 0xff },
			{ r : 0xfe, g : 0x87, b : 0x45, a : 0xab },
			{ r : 0xa7, g : 0x3e, b : 0xf4, a : 0x21 }
		];
		for(var s_i in sizes){
			var size = sizes[s_i];
			
			for(var c_i in colors){
				var color      = colors[c_i];
				var color_rgb  = '#' + new JSPNG.Buffer([color.r, color.g, color.b]).toString('hex').toUpperCase();
				var color_rgba = '#' + new JSPNG.Buffer([color.r, color.g, color.b, color.a]).toString('hex').toUpperCase();
				
				var colortype = 'truecolor';
				it("generate " + colortype + "@" + size[0] + "x" + size[1] + "  " + color_rgb, function(size, color, colordesc, colortype){ return function(done) {
					var jspng_file = os.tmpdir() + '/image-' +  colordesc + '-' + colortype + '@' + size[0] + 'x' + size[1] + '-jspng.png';
					
					var png = new JSPNG(generate_solid_color_buffer(size[0], size[1], color.r, color.g, color.b), { width : size[0], height : size[1], colortype : colortype, inputmode: 'r8g8b8' }).toBuffer();
					fs.writeFileSync(jspng_file, png);
					expect(fs.statSync(jspng_file).size).to.equal(png.length);
					done();
				} }(size, color, color_rgb, colortype));
				
				it("compare " + colortype + "@" + size[0] + "x" + size[1] + "  " + color_rgb, function(size, color, colordesc, colortype){ return function(done) {
					var jspng_file = os.tmpdir() + '/image-' +  colordesc + '-' + colortype + '@' + size[0] + 'x' + size[1] + '-jspng.png',
						gm_file    = os.tmpdir() + '/image-' +  colordesc + '-' + colortype + '@' + size[0] + 'x' + size[1] + '-gm.png';
			
					var promise = new Promise(function(resolve, reject){
						exec('convert -size ' + size[0] + 'x' + size[1] + ' xc:#' + JSPNG.Buffer([color.r, color.g, color.b]).toString('hex') + ' "' + gm_file + '"', function(error, stdout, stderr){
							if(error) reject(error); else {
								exec('compare -metric mse "' + jspng_file + '" "' + gm_file + '" null', function(error, stdout, stderr){
									resolve(Number(stderr.split(' ')[0]));
								});
							}
						});
					});
					expect(promise).to.eventually.equal(0).notify(done);
				} }(size, color, color_rgb, colortype));
				
				var colortype = 'truecolor+alpha';
				it("generate " + colortype + "@" + size[0] + "x" + size[1] + " " + color_rgba, function(size, color, colordesc, colortype){ return function(done) {
					var jspng_file = os.tmpdir() + '/image-' +  colordesc + '-' + colortype + '@' + size[0] + 'x' + size[1] + '-jspng.png';
					
					var png = new JSPNG(generate_solid_color_alpha_buffer(size[0], size[1], color.r, color.g, color.b, color.a), { width : size[0], height : size[1], colortype : colortype, inputmode: 'r8g8b8a8' }).toBuffer();
					fs.writeFileSync(jspng_file, png);
					expect(fs.statSync(jspng_file).size).to.equal(png.length);
					done();
				} }(size, color, color_rgba, colortype));
				
				it("compare " + colortype + "@" + size[0] + "x" + size[1] + "  " + color_rgb, function(size, color, colordesc, colortype){ return function(done) {
					var jspng_file = os.tmpdir() + '/image-' +  colordesc + '-' + colortype + '@' + size[0] + 'x' + size[1] + '-jspng.png',
						gm_file    = os.tmpdir() + '/image-' +  colordesc + '-' + colortype + '@' + size[0] + 'x' + size[1] + '-gm.png';
			
					var promise = new Promise(function(resolve, reject){
						exec('convert -size ' + size[0] + 'x' + size[1] + ' xc:#' + JSPNG.Buffer([color.r, color.g, color.b, color.a]).toString('hex') + ' "' + gm_file + '"', function(error, stdout, stderr){
							if(error) reject(error); else {
								exec('compare -metric mse "' + jspng_file + '" "' + gm_file + '" null', function(error, stdout, stderr){
									resolve(Number(stderr.split(' ')[0]));
								});
							}
						});
					});
					expect(promise).to.eventually.equal(0).notify(done);
				} }(size, color, color_rgba, colortype));
			}
		}
	});
});
	
