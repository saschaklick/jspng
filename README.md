# jspng
Generate unoptimized PNG images from raw pixel data.

## Install

```bash
$ npm install jspng
```
## Example

```js
var fs    = require('fs');
var jspng = require('jspng');

var pixels = jspng.Buffer(128 * 128 * 4).fill(new Buffer([ 0x00, 0x00, 0xff, 0x88 ]));

var png = new jspng(pixels, { width: 128, height: 128, inputmode: 'rgba', meta: { 'Software': jspng.VERSION }});

fs.writeFileSync('jspng.png', png.toBuffer());
```
For more examples see `examples` folder.

## Documentation

The *jspng* package was created to run in both server-side application using *NodeJS 0.12* as well as in most - if not all - modern Browsers but specifically *Mozilla Firefox 56+* and *Chromium 61+*.

Its initial use case was the creation of dynamically generated PNG textures for X3D models, which were at first generated and previewed in a clientside Browser application using [X3DOM](https://www.x3dom.org/) and then stored by a server process which regenerated the textures based on parameters provided by the client, rather than being send the whole client-generated binary PNG file.

While originally being developed for *NodeJS*, Browser support was added by implementing a shim stub of *NodeJS*'s `Buffer` class in *ECMAScript* (being the basis for all modern Browser's Javascript implemenation) using `TypedArray` classes and subclasses.

Furthermore the implementation had to remain **dependence-free** due to the very different APIs for handling binary data present in the server and client environment, which results in *jspng* not implementing any kind of compression of the image data in PNG. While this creates unusually big PNG files, the data is quickly decoded when needed; a plus in our *X3DOM* and any similar use case.

## Features
Beside the support for truecolor and greyscale PNG images with and without alpha, adding meta data is supported. See the example above.

### Input modes

The raw pixel data supplied to create the image is somewhat freely configurable, as long as color and alpha data is provided as 8 bits per channel. The default format is `'rgba'`, a basic 32bit-per-pixel format expecting the red, green and blue color data first, followed by an 8-bit alpha channel.

Color and alpha channels can furthermore be freely arranged or even dropped using the `inputmode` option. `'argb'` would interpret the pixel data as starting with the alpha channel, followed by red, green and blue channel. Each pixel would still be 32-bit in size in this example.

A set of-8 bit data points can be visualized in a black-to-red PNG imagemap by using `'r'`, meaning that each pixel only 8-bits in size.

Using `'...b'` on pixel data that is actually encoded in RGBA-format would ignore the first 24 bits of each pixel and visualize the alpha channel as blue in the resulting PNG.

### Image dimension prediction
While you are strongly encouraged to provide the width and height of the image described by your pixel data, *jspng* will try to estimate the image dimenstions should you choose not to. Should one or both dimensions not be specified, *jspng* will use the size of the provided pixel data buffer to fit all pixels into the image.

Providing neither width nor height, *jspng* will assume the image data should be arranged as a square.

## Limitations
* As mentioned there is no compression of image data of any kind, should small image size be desired.
* Indexed/paletted images are not supported.
* 16-bit color and alpha channel depth is not supported.
