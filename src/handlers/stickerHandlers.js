// deps
const {validationResult} = require('express-validator');
// project

const {findArtistByVanity} = require('../data/artist');
const {upsertSticker} = require('../data/sticker');


async function upsertStickerHandler (req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  let {vanity, artist_vanity} = req.body;
  vanity = vanity.toLowerCase();
  artist_vanity = artist_vanity.toLowerCase();

  let artist = await findArtistByVanity(artist_vanity);
  if (!artist) {
    return res.status(400).json({ errors: [
      {
        "value": artist_vanity,
        "msg": "Artist does not exist",
        "param": "artist_vanity",
        "location": "body"
      }
    ]});
  }


  let sticker = await upsertSticker(vanity, artist.id);
  if (!sticker) {
    return res.status(500).json({ errors: ['Expected to update an sticker but could not?'] });
  }

  res.send({
    "status": "ok",
    "value": sticker
  });
}

module.exports = {
  upsertStickerHandler,
}
