const response = require("../components/response")
const jwt = require("jsonwebtoken")

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token === null) return response.res401(res);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return response.res401(res)
    req.email = decoded.email;
    next()
  })
}

exports.verifyTokenAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token === null) return response.res401(res);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_ADMIN, (err, decoded) => {
    if (err) return response.res401(res)
    req.email = decoded.email;
    next()
  })
}