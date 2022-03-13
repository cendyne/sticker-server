const db = require('../db').knex;
const debug = require('../debug');

async function findAllStickers() {
  debug('Loading all stickers');
  let results = await db('all_stickers').select('*');
  debug('Loaded %d stickers', results.length);
  return results;
}
async function findAllStickersAndFiles() {
  debug('Loading all stickers');
  let results = await db('artists_stickers_files').orderBy('sticker_vanity').select('*');
  let output = [];
  for (const row of results) {
    let files = row.files;
    delete row.files;
    output.push({...row, files: JSON.parse(files)});
  }
  debug('Loaded %d stickers', results.length);
  return output;
}

module.exports = {
  findAllStickers,
  findAllStickersAndFiles
}
