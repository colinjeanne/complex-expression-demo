importScripts('expression.min.js');

const Expression = require('expression').default;
const Complex = require('complex').default;
const ComplexMath = require('complex-math');

const pointFromPixel = (ptPixel, pixelWidth, pixelHeight, ptTopLeft, ptBottomRight) => {
   const width = ptBottomRight[0] - ptTopLeft[0];
   const height = ptBottomRight[1] - ptTopLeft[1];
   return [ptPixel[0] * width / pixelWidth + ptTopLeft[0],
           ptPixel[1] * height / pixelHeight + ptTopLeft[1]];
};

const colorizationModes = {
   magnitude: value => ComplexMath.abs(value).real,
   realPart: value => value.real,
   imaginaryPart: value => value.imaginary,
   phase: value => ComplexMath.arg(value).real
};

const evaluate = (pixelCount, pixelWidth, expression, colorizationMode, ptTopLeft, ptBottomRight) => {
   let min = 0;
   const values = [];
   let max = 0;
   for (let i = 0; i < pixelCount; ++i) {
      const ptPixel = [i % pixelWidth, i / pixelWidth];
      const pt = pointFromPixel(
         ptPixel,
         pixelWidth,
         pixelCount / pixelWidth,
         ptTopLeft,
         ptBottomRight);
      values[i] = expression.evaluate({'w': new Complex(pt[0], pt[1])});

      const value = colorizationMode(values[i]);
      if (0 === i) {
         min = value;
         max = value;
      } else {
         min = (value < min) ? value : min;
         max = (value > max) ? value : max;
      }
   }

   return {
      values: values,
      min: min,
      max: max
   };
};

self.onmessage = e => {
   const pixelCount = e.data.imageData.data.length / 4;
   const pixelWidth = e.data.imageData.width;
   const expression = new Expression(e.data.expression);
   const colorizationMode = colorizationModes[e.data.colorizationMode];
   const ptTopLeft = e.data.ptTopLeft;
   const ptBottomRight = e.data.ptBottomRight;

   const result = evaluate(
      pixelCount,
      pixelWidth,
      expression,
      colorizationMode,
      ptTopLeft,
      ptBottomRight);
   result.imageData = e.data.imageData;
   result.pixelTop = e.data.pixelTop;
   result.index = e.data.index;

   self.postMessage(result);
};
