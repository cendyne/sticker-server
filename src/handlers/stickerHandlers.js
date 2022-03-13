// deps
const {validationResult} = require('express-validator');
// project
const debug = require('../debug');
const {baseUrl} = require('../paths');
const {findArtistByVanity, findArtistById} = require('../data/artist');
const {upsertSticker, findStickerByVanity} = require('../data/sticker');
const {findStickerFilesById} = require('../data/stickerFile');
const { contentType } = require('express/lib/response');

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
    debug('Could not find sticker %s', vanity);
    next();
    return;
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

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function stickerHtmlHandler(req, res, next) {
  let vanity = req.params['vanity'];
  let sticker = await findStickerByVanity(vanity);
  if (!sticker) {
    debug('Could not find sticker %s', vanity);
    next();
    return;
  }
  // Stickers don't carry much themselves.
  let {artist_id} = sticker;
  let artist = await findArtistById(artist_id);
  let files = await findStickerFilesById(sticker.id);
  let largest_size = 0;
  for (const file of files) {
    if (largest_size < file.size) {
      largest_size = file.size;
    }
  }
  files = files.filter(({size}) => size == largest_size);
  let sources = files.map((file) => {
    let {content_type, source} = file
    return {
      contentType: content_type,
      url: `${baseUrl}/${source}`,
    };
  });
  // This will get replaced of course
  let fallbackSource = {
    contentType: 'image/jpeg',
    url: `${baseUrl}/not-found.jpg`
  };
  let losslessSource = null;
  let foundJpeg = sources.find(({contentType}) => contentType == 'image/jpeg');
  let foundPng = sources.find(({contentType}) => contentType == 'image/png');
  if (foundJpeg) {
    fallbackSource = foundJpeg;
    sources.splice(sources.indexOf(foundJpeg), 1);
  } else {
    if (foundPng) {
      fallbackSource = foundPng;
      sources.splice(sources.indexOf(foundPng), 1);
    }
    // Otherwise shrug
  }
  if (foundPng) {
    losslessSource = foundPng;
  }

  let jsonUrl = `${baseUrl}/sticker/${vanity}.json`;

  let data = {
    ...(artist ? {
      artistName: artist.name,
      artistHref: artist.href
    } : {}),
    vanity,
    // TODO tags
    sources,
    fallbackSource,
    losslessSource,
    baseUrl,
    jsonUrl,
  };
  res.render('sticker', data)
}

module.exports = {
  upsertStickerHandler,
  stickerJsonHandler,
  stickerHtmlHandler,
}
