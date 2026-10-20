import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "LinkPulse User Service API",
      version: "1.0.0",
      description: "API documentation for LinkPulse User and Authentication Service",
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/**/*.js", "./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
