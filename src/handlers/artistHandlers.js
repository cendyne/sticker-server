const {validationResult} = require('express-validator');
const {upsertArtist, findAllArtists, findArtistByVanity} = require('../data/artist');

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
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

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function allArtistsJsonHandler(req, res) {
  let artistsRows = await findAllArtists();
  let artists = {};
  for (let {name, vanity, href} of artistsRows) {
    artists[vanity] = {name, href};
  }
  res.send(artists);
}

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function artistJsonHandler(req, res) {
  let vanity = req.params['vanity'];
  let artist = await findArtistByVanity(vanity);
  if (artist) {
    let {name, href} = artist;
    res.send({name, href})
  }
}

module.exports = {
  upsertArtistHandler,
  allArtistsJsonHandler,
  artistJsonHandler,
}
