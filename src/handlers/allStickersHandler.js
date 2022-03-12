const {findAllStickers, findAllStickersAndFiles} = require('../data/allStickers');
/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function allStickersJsonHandler(req, res) {
  let results = await findAllStickers();
  let response = [];
  for (const {artist_name, artist_vanity, artist_href, sticker_vanity} of results) {
    // TODO tags
    response.push({artist_name, artist_vanity, artist_href, sticker_vanity})
  }
  res.send({
    stickers: response
  })
}

async function allStickersHtmlHandler(req, res) {
  let results = await findAllStickersAndFiles();
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
    let sizes = {};
    let largest_size = 0;
    for (const file of result.files) {
      const {size, content_type, source, length} = file;
      if (size > largest_size) {
        largest_size = size;
      }
      let sizeSet = sizes[size];
      if (!sizeSet) {
        sizeSet = {
          files: [],
          primary: null,
        };
        sizes[size] = sizeSet;
      }
      sizeSet.files.push(file);
    }
    for (const size of Object.keys(sizes)) {
      let contentTypes = new Map();
      const matchingSizeSet = sizes[size];
      for (const file of matchingSizeSet.files) {
        contentTypes.set(file.content_type, file);
      }
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
      let remainingFiles = [];
      for (const file of contentTypes.values()) {
        remainingFiles.push(file);
      }
      remainingFiles.sort((a, b) => (a.length < b.length) ? -1 : 1);
      matchingSizeSet.sources = remainingFiles;
      delete matchingSizeSet.files;
    }
    stickers.push({
      vanity: result.sticker_vanity,
      sizes,
      largest_size
    })
  }
  res.render('index', {artists: Object.values(artists)})
}

module.exports = {
  allStickersJsonHandler,
  allStickersHtmlHandler
}
