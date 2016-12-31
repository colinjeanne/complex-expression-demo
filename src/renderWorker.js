importScripts('expression.min.js');

const ComplexMath = require('complex-math');

const scaleToUnit = (d, min, max) => (d - min) / (max - min);
const linearScale = (d, min, max) => (max - min) * d + min;

const hsvToRgb = (hue, saturation, value) => {
   const c = value * saturation;
   const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
   const m = value - c;

   let rgb;
   if (hue < 60) {
      rgb = {
         red: c + m,
         green: x + m,
         blue: m
      };
   } else if (hue < 120) {
      rgb = {
         red: x + m,
         green: c + m,
         blue: m
      };
   } else if (hue < 180) {
      rgb = {
         red: m,
         green: c + m,
         blue: x + m
      };
   } else if (hue < 240) {
      rgb = {
         red: m,
         green: x + m,
         blue: c + m
      };
   } else if (hue < 300) {
      rgb = {
         red: x + m,
         green: m,
         blue: c + m
      };
   } else {
      rgb = {
         red: c + m,
         green: m,
         blue: x + m
      };
   }

   return {
      red: Math.floor(linearScale(rgb.red, 0, 255)),
      green: Math.floor(linearScale(rgb.green, 0, 255)),
      blue: Math.floor(linearScale(rgb.blue, 0, 255))
   };
};

const greyscaleColorization = (fn, value, min, max) => {
   let intensity = scaleToUnit(-fn(value).real, -max, -min);
   if (!isFinite(intensity)) {
      intensity = 0;
   }

   return hsvToRgb(0, 0, intensity);
};

const hueFromValue = value => {
   let hue = (Math.PI + ComplexMath.arg(value).real) * 180 / Math.PI;
   if (!isFinite(hue)) {
      hue = 0;
   }

   return hue;
};

const nonconformalColorWithValue = (value, min, max) => {
   const hue = hueFromValue(value);

   let intensity = scaleToUnit(-ComplexMath.abs(value).real, -max, -min);
   if (!isFinite(intensity)) {
      intensity = 0;
   }

   return hsvToRgb(hue, 1, intensity);
};

const conformalColorThin = value => {
   const hue = hueFromValue(value);

   const mag = ComplexMath.abs(value).real;
   const logMagnitude = Math.log(mag);
   const fractionalMagnitude = logMagnitude - Math.floor(logMagnitude);
   const saturation = linearScale(fractionalMagnitude, 0.7, 1);
   const intensity = linearScale(fractionalMagnitude, 0.7, 1);

   return hsvToRgb(hue, saturation, intensity);
};

const colorizationFunctions = {
   conformalColorThin,
   nonconformalColorWithValue
};

const renderGraph = (binaryData, pixelWidth, colorizationMode, colorizationFunction, values, min, max) => {
   switch (colorizationMode) {
      case 'phase':
         colorizationFunction = value =>
            greyscaleColorization(ComplexMath.arg, value, -Math.PI, Math.PI);
         break;

      case 'realPart':
         colorizationFunction = (value, min, max) =>
            greyscaleColorization(ComplexMath.real, value, min, max);
         break;

      case 'imaginaryPart':
         colorizationFunction = (value, min, max) =>
            greyscaleColorization(ComplexMath.imaginary, value, min, max);
         break;
   }

   for (let i = 0; i < binaryData.length; i += 4) {
      const pixel = i / 4;
      const rgb = colorizationFunction(values[pixel], min, max);
      binaryData[i] = rgb.red;
      binaryData[i + 1] = rgb.green;
      binaryData[i + 2] = rgb.blue;
      binaryData[i + 3] = 255;
   }
};

self.onmessage = e => {
   const binaryData = e.data.canvasData.data;
   const pixelWidth = e.data.canvasData.width;
   const colorizationMode = e.data.colorizationMode;
   const colorizationFunction = colorizationFunctions[e.data.colorizationFunction];
   const values = e.data.values;
   const min = e.data.min;
   const max = e.data.max;

   renderGraph(
      binaryData,
      pixelWidth,
      colorizationMode,
      colorizationFunction,
      values,
      min,
      max);

   self.postMessage(e.data.canvasData);
};
