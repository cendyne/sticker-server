const crypto = require('crypto');
const debug = require('./debug');

function unguessable() {
  let token = crypto.randomBytes(32).toString('hex');
  console.error(`TOKEN not supplied, using ${token}`)
  return token;
}

// Unguessable fallback.
const token = Buffer.from(process.env.TOKEN || unguessable());

function checkToken(req, res, next) {
  if (!req.token) {
    debug('No token found');
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
      debug('Token found %s', reqToken);
      pass = crypto.timingSafeEqual(token, reqToken)
    } else {
      debug('Token found but not the right length %s', reqToken);
      pass = crypto.timingSafeEqual(token, token) & false;
    }
    if (!pass) {
      debug('Token failed');
      res.status(401).json({ errors: [
        {
          "msg": "Invalid Authorization",
        }
      ]});
    } else {
      debug('Token succeeded');
      next();
    }
  }
}

module.exports = {
  checkToken
}
