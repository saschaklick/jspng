const JSPNG  = require('../jspng');

const fs     = require('fs');
const os     = require('os');
const exec   = require('child_process').exec;
const chai   = require('chai');
const chaipr = require('chai-as-promised'); chai.use(chaipr);
const expect = chai.expect;

describe('checksum functions', function() {
	
	var checksum_results = [
		[ 'The quick brown fox jumps over the lazy dog',                      'ascii', 0x414FA339, 0x5bdc0fda],
		[ '0000000000000000000000000000000000000000000000000000000000000000', 'hex'  , 0x190A55AD, 0x00200001],
		[ 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', 'hex'  , 0xFF6CAB0B, 0x0e2e1fe1],
		[ '000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F', 'hex'  , 0x91267E8A, 0x157001f1]
	];
	
	describe('ADLER32', function(){
		for(var i in checksum_results){
			var test = checksum_results[i];
			it('"' + test[0] + '"', function() {
				expect(JSPNG.ADLER32(new Buffer(test[0], test[1]))).to.equal(test[3]);
			});
		}
	});
	describe('CRC32', function(){
		for(var i in checksum_results){
			var test = checksum_results[i];
			it('"' + test[0] + '"', function() {
				expect(JSPNG.CRC32(new Buffer(test[0], test[1]))).to.equal(test[2]);
			});
		}
	});
});
	
