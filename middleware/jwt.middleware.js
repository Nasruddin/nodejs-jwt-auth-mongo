const jwtService = require("../jwt/jwt.service");

const jwtMiddleware = {
  validateToken: (req, res, next) => {
    // get token from headers object
    let token = req.headers["x-auth-token"] || req.headers["authorization"];

    // check token
    if (!token) {
      return res.status(401).send("Token is invalid");
    }

    const user = jwtService.verifyJWTToken(token);

    req.user = user;
    next();
  }
};

module.exports = jwtMiddleware;
