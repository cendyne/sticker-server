const {validationResult} = require('express-validator');
const {upsertArtist} = require('../data/artist');

async function upsertArtistHandler(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  let {vanity, name, href} = req.body;
  let artist = await upsertArtist(vanity, name, href);
  if (!artist) {
    return res.status(500).json({ errors: ['Expected to update an artist but could not?'] });
  }
  res.send({
    "status": "ok",
    "value": artist
  });
}

module.exports = {
  upsertArtistHandler
}
