// docs/swagger.js
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

module.exports = function setupSwagger(app) {
  const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Student Management API",
        version: "1.0.0",
        description:
          "API quản lý sinh viên (Auth, Students, Classes, Subjects, Scores) với RBAC.",
      },
      // Back-end của bạn mount dưới /api nên đặt server là /api
      servers: [{ url: "/api" }],
      components: {
        securitySchemes: {
          // Nếu bạn có cho phép gửi Access Token qua header Authorization
          bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
          // Nếu dùng cookie HttpOnly (at) như hiện tại
          cookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: process.env.COOKIE_NAME_AT || "at",
          },
        },
        schemas: {
          User: {
            type: "object",
            properties: {
              _id: { type: "string" },
              username: { type: "string" },
              role: { type: "string", enum: ["admin", "teacher", "student"] },
              studentRef: { type: "string", nullable: true },
            },
          },
          Class: {
            type: "object",
            properties: {
              _id: { type: "string" },
              name: { type: "string" },
              year: { type: "integer" },
              department: { type: "string" },
            },
          },
          Subject: {
            type: "object",
            properties: {
              _id: { type: "string" },
              name: { type: "string" },
              code: { type: "string" },
            },
          },
          Student: {
            type: "object",
            properties: {
              _id: { type: "string" },
              name: { type: "string" },
              studentId: { type: "string" },
              email: { type: "string" },
              gender: { type: "string", enum: ["Male", "Female", "Other"] },
              dateOfBirth: { type: "string", format: "date" },
              classId: { type: "string" },
            },
          },
          Score: {
            type: "object",
            properties: {
              _id: { type: "string" },
              studentId: { type: "string" },
              subjectId: { type: "string" },
              term: { type: "integer" },
              score: { type: "number" },
              note: { type: "string" },
            },
          },
        },
      },
      // Mặc định yêu cầu auth, có thể override từng route
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
    },
    // Nơi đọc JSDoc (thêm comment vào các file routes/*.js)
    apis: ["./routes/*.js"],
  };

  const specs = swaggerJsdoc(options);
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));
  console.log("📚 Swagger available at /docs");
};
