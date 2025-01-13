const jwt = require("jsonwebtoken");

const JWTSecret = `${process.env.JWT_SECRET}`;

function auth(req, res, next) {
  const authToken = req.headers["authorization"];
  if (authToken != undefined) {
    const bearer = authToken.split(" ");
    var token = bearer[1];
    jwt.verify(token, JWTSecret, (err, data) => {
      if (err) {
        res.status(401);
        res.json({ err: "token inválido" });
      } else {
        req.token = token;
        req.loggedUser = {
          id: data.id,
          email: data.email,
          username: data.username,
        };
        console.log(data);
        next();
      }
    });
  } else {
    res.status(401);
    res.json({ err: "token inválido" });
  }
}

module.exports = auth;
