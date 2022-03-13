const debug = require('../debug');
const {baseUrl} = require('../paths');
const {findAllStickersAndFiles} = require('../data/allStickers');

function organizeSizes(files, chooseFallback) {
  let sizes = new Map();
  for (const file of files) {
    const {size, content_type, source, length} = file;
    let sizeSet = sizes.get(size);
    if (!sizeSet) {
      sizeSet = {
        files: [],
      };
      if (chooseFallback) {
        sizeSet.primary = null;
      }
      sizes.set(size, sizeSet)
    }
    sizeSet.files.push(file);
  }
  for (const size of sizes.keys()) {
    let contentTypes = new Map();
    const matchingSizeSet = sizes.get(size);
    for (const file of matchingSizeSet.files) {
      contentTypes.set(file.content_type, file);
    }
    if (chooseFallback) {
      if (contentTypes.has('image/jpeg')) {
        matchingSizeSet.primary = contentTypes.get('image/jpeg');
        contentTypes.delete('image/jpeg');
      } else if (contentTypes.has('image/png')) {
        matchingSizeSet.primary = contentTypes.get('image/png');
        contentTypes.delete('image/png');
      } else if (contentTypes.has('image/gif')) {
        matchingSizeSet.primary = contentTypes.get('image/gif');
        contentTypes.delete('image/gif');
      } else {
        // Choose the first I guess
        const [contentType] = contentTypes.keys();
        matchingSizeSet.primary = contentTypes.get(contentType);
        contentTypes.delete(contentType);
      }
    }

    let remainingFiles = [];
    for (const {content_type, source, length} of contentTypes.values()) {
      remainingFiles.push({content_type, source, length});
    }
    remainingFiles.sort((a, b) => (a.length < b.length) ? -1 : 1);
    matchingSizeSet.sources = remainingFiles;
    delete matchingSizeSet.files;
  }
  return sizes;
}

async function loadAllStickers() {
  debug('Index load all stickers with files');
  let results = await findAllStickersAndFiles();
  debug('Index prepare results');
  let artists = {};
  for (const result of results) {
    let artist = artists[result.artist_id];
    if (!artist) {
      artist = {
        stickers: [],
        name: result.artist_name,
        vanity: result.artist_vanity,
        href: result.artist_href,
      };
      artists[result.artist_id] = artist;
    }
    stickers = artist.stickers;
    let sizes = organizeSizes(result.files, true);
    let available_sizes = [...sizes.keys()].map((n) => parseInt(n)).sort((a, b) => a > b ? -1 : 1)
    stickers.push({
      vanity: result.sticker_vanity,
      sizes,
      available_sizes,
      largest_size: available_sizes.slice(-1)[0]
    })
  }
  debug('Index results prepared')
  return {
    artists: Object.values(artists),
    baseUrl
  };
}

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function allStickersHtmlHandler(req, res) {
  let data = await loadAllStickers();
  // res.json({artists: Object.values(artists)})
  res.render('index', data)
}

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function allStickersAndArtistsJsonHandler(req, res) {
  debug('Index json load all stickers with files');
  let results = await findAllStickersAndFiles();
  debug('Index json loaded');
  let stickers = {};
  let artists = {};
  for (const {artist_name, artist_vanity, artist_href, sticker_vanity, files} of results) {
    // TODO tags
    let sizes = organizeSizes(files, false);
    let sizeObj = {};
    for (let size of sizes.keys()) {
      let sizeMap = sizes.get(size);
      size = parseInt(size);
      if (size <= 32) {
        // Seems superfluous
        continue;
      }
      let sizeResult = [];
      for (let {content_type} of sizeMap.sources) {
        sizeResult.push(content_type.split('/')[1]);
      }
      sizeObj[size] = sizeResult;
    }
    stickers[sticker_vanity] = {artist: artist_vanity, sizes: sizeObj};
    artists[artist_vanity] = {artist_name, artist_href};
  }
  debug('Index json response prepared');
  res.send({
    stickers,
    artists
  })
}

module.exports = {
  allStickersAndArtistsJsonHandler,
  allStickersHtmlHandler
}
