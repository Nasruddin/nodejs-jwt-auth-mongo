const jwtService = require("../jwt/jwt.service");
const { close, connectDb } = require('../config/mongo.config')

const authController = {
  auth: async (req, res, next) => {

    const {db, client} = await connectDb();  
    const usersCollection = db.collection('users');

    const loginData = req.body;

    if (!loginData || !loginData.username || !loginData.username) {
      return res.status(400).send("Please enter valid data!");
    }

    const user = await usersCollection.findOne(
      { username: loginData.username }
    );

    if (!user) {
      return res.status(400).send("Username or password is wrong!");
    }

    if (user && user.password !== loginData.password) {
      return res.status(400).send("Username or password is wrong!");
    }

    const payload = { id: user.id, email: user.email, username: user.username };

    const accessToken = jwtService.getAccessToken(payload);
    const refreshToken = await jwtService.getRefreshToken(payload);
    
    res.send({ user, accessToken, refreshToken });
  },

  getCurrentUser: (req, res) => {
    const currentUser = mockDB.users.find(user => user.id === req.user.id);
    res.send(currentUser);
  },

  refreshToken: async (req, res) => {
    const refreshToken = req.body.refreshToken;

    if (!refreshToken) {
      return res.status(403).send("Access is forbidden");
    }

    try {
      const newTokens = await jwtService.refreshToken(refreshToken, res);
      res.send(newTokens);
    } catch (err) {
      const message = (err && err.message) || err;
      res.status(403).send(message);
    }
  }
};

module.exports = authController;
