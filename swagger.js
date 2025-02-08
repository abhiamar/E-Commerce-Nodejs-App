const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0', // Specify the OpenAPI version
  info: {
    title: 'Your API Title',
    version: '1.0.0',
    description: 'Description of your API',
  },
  servers: [
    {
      url: 'http://localhost:5001', // Update with your server URL
    },
  ],
};

const options = {
  swaggerDefinition,
  // Paths to your API routes
  apis: ['./Routes/*.js'], // Specify the path to your route files
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
