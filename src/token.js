const crypto = require('crypto');

// Unguessable fallback.
const token = Buffer.from(process.env.TOKEN || crypto.randomBytes(32).toString('hex'));


function checkToken(req, res, next) {
  if (!req.token) {
    res.status(401).json({ errors: [
      {
        "msg": "Authorization missing",
      }
    ]});
  } else {
    let reqToken = Buffer.from(req.token);
    let pass = false;
    if (reqToken.length == token.length) {
      // Do the work anyway
      pass = crypto.timingSafeEqual(token, reqToken)
    } else {
      pass = crypto.timingSafeEqual(token, token) & false;
    }
    if (!pass) {
      res.status(401).json({ errors: [
        {
          "msg": "Invalid Authorization",
        }
      ]});
    } else {
      next();
    }
  }
}

module.exports = {
  checkToken
}
