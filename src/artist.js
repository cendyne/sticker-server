const db = require('./db').knex;

async function findArtistByVanity(vanity) {
  let result = await db('artist').where('vanity', '=', vanity).select('*');
  if (result.length > 0) {
    let row = result[0];
    return row
  }
  return null;
}

module.exports = {
  findArtistByVanity
}
