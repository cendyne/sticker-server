// deps
const {validationResult} = require('express-validator');
// project
const {baseUrl} = require('../paths');
const {findArtistByVanity, findArtistById} = require('../data/artist');
const {upsertSticker, findStickerByVanity} = require('../data/sticker');
const {findStickerFilesById} = require('../data/stickerFile');

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function upsertStickerHandler(req, res) {
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

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function stickerJsonHandler(req, res, next) {
  let vanity = req.params['vanity'];
  let sticker = await findStickerByVanity(vanity);
  if (!sticker) {
    console.log('Could not find', vanity)
    next();
  }
  // Stickers don't carry much themselves.
  let {artist_id} = sticker;
  let artist = await findArtistById(artist_id);
  let files = await findStickerFilesById(sticker.id);
  let result = {
    ...(artist ? {
      artist: artist.vanity
    } : {}),
    // TODO tags
    files: files.map((file) => {
      let {size, content_type, source, length} = file
      return {
        size,
        contentType: content_type,
        url: `${baseUrl}/${source}`,
        length
      };
    })
  };
  res.send(result);
}

module.exports = {
  upsertStickerHandler,
  stickerJsonHandler,
}
