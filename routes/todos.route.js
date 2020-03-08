const express = require("express");
const todosController = require("../controllers/todos.controller");
const jwtMiddleware = require("../middleware/jwt.middleware");
const todosRouter = express();

todosRouter.get("/", jwtMiddleware.validateToken, todosController.getTodos);

module.exports = todosRouter;
