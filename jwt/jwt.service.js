const jwt = require("jsonwebtoken");
const uuidv1 = require("uuid/v1");
const mockDB = require("../data/data.mock");
const { connectDb, close } = require("../config/mongo.config");

const jwtSecretString = "mysecret";

const jwtService = {
  getAccessToken: payload => {
    return jwt.sign({ user: payload }, jwtSecretString, { expiresIn: "15min" });
  },

  getRefreshToken: async payload => {
    const { db, client } = await connectDb();
    const collection = db.collection("refreshTokens");

    const userRefreshTokens = await collection
      .find({ userId: payload.id })
      .toArray();

    // check if there are 5 or more refresh tokens,
    // which have already been generated. In this case we should
    // remove all this refresh tokens and leave only new one for security reason
    if (userRefreshTokens.length >= 5) {
      await collection.remove({ userId: payload.id });
    }

    const refreshToken = jwt.sign({ user: payload }, jwtSecretString, {
      expiresIn: "30d"
    });

    let result = await collection.insertOne(
      { id: uuidv1(), userId: payload.id, refreshToken },
      (err, result) => {
        if (err) {
          throw err;
        }
      }
    );

    return refreshToken;
  },

  verifyJWTToken: (token) => {
      if (token.startsWith("Bearer ")) {
        token = token.slice(7, token.length);
      }

      const decodedToken = jwt.verify(token, jwtSecretString)
      return decodedToken.user;
  },

  refreshToken: async token => {
    const { db, client } = await connectDb();

    const usersCollection = db.collection("users");
    const collection = db.collection("refreshTokens");

    const decodedToken = jwt.verify(token, jwtSecretString);

    const user = await usersCollection.findOne({ id: decodedToken.user.id });
    // var userDocument = user.hasNext() ? user.next() : null

    if (!user) {
      throw new Error(`Access is forbidden`);
    }

    // get all user's refresh tokens from DB
    const allRefreshTokens = await collection
      .find({ userId: user.id })
      .toArray();

    if (!allRefreshTokens || !allRefreshTokens.length) {
      throw new Error(`There is no refresh token for the user with`);
    }

    const currentRefreshToken = allRefreshTokens.find(
      refreshToken => refreshToken.refreshToken === token
    );

    if (!currentRefreshToken) {
      throw new Error(`Refresh token is wrong`);
    }
    // user's data for new tokens
    const payload = { id: user.id, email: user.email, username: user.username };
    // get new refresh and access token
    const newRefreshToken = await getUpdatedRefreshToken(token, payload);
    const newAccessToken = getAccessToken(payload);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
};

const getUpdatedRefreshToken = async (oldRefreshToken, payload) => {
  const { db, client } = await connectDb();
  const usersCollection = db.collection("users");
  const collection = db.collection("refreshTokens");
  // create new refresh token
  const newRefreshToken = jwt.sign({ user: payload }, jwtSecretString, {
    expiresIn: "30d"
  });
  // replace current refresh token with new one
  mockDB.tokens = await collection.find().map(token => {
    if (token.refreshToken === oldRefreshToken) {
      return { ...token, refreshToken: newRefreshToken };
    }

    return token;
  });

  return newRefreshToken;
};

const getAccessToken = payload => {
  return jwt.sign({ user: payload }, jwtSecretString, { expiresIn: "15min" });
};

module.exports = jwtService;
