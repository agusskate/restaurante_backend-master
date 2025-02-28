"use strict";
const app = require('./app');

const puerto = process.env.PUERTO || 5000;
app.listen(puerto, () => {

  console.log(`Listening: http://localhost:${puerto}`);
  /* eslint-enable no-console */
});

// Exporta la aplicación para que Vercel la maneje como una función.
module.exports = app;
