const mockDB = require("../data/data.mock");
const { close, connectDb } = require("../config/mongo.config");

const todosController = {
  getTodos: async (req, res, next) => {
    const { db, client } = await connectDb();
    const usersCollection = db.collection("todos");
    const todos = await usersCollection.find().toArray();
    res.send({ todos: todos });
  }
};

module.exports = todosController;
