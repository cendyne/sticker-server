const debug = require('../debug');
const db = require('../db').knex;


async function findStickerByVanity(vanity) {
  let result = await db('sticker').where({vanity}).select('*');
  if (result.length > 0) {
    debug('Found sticker %s', vanity);
    return result[0];
  }
  debug('Could not find sticker %s', vanity);
  return null;
}
async function findStickerById(id) {
  let result = await db('sticker').where({id}).select('*');
  if (result.length > 0) {
    debug('Found sticker by id %d', id);
    return result[0];
  }
  debug('Could not find sticker by id %d', id);
  return null;
}
async function updateSticker(id, artist_id) {
  let result = await db('sticker').where({id}).update({
    artist_id
  });
  if (result > 0) {
    debug('Successfully updated sticker %d', id);
    return await findStickerById(id);
  }
  debug('Failed to update sticker %d', id)
  return null;
}
async function insertSticker(vanity, artist_id) {
  let result = await db('sticker').returning('*').insert({
    vanity,
    artist_id
  });
  if (result && result.length > 0 && result[0]) {
    debug('Inserted sticker %d', result[0].id)
  } else {
    debug('Failed to insert sticker %s', result);
  }

  return result[0];
}

async function upsertSticker(vanity, artist_id) {
  let sticker = await findStickerByVanity(vanity);
  if (sticker) {
    debug('Upsert found sticker %d, therefore updating', sticker.id);
    return await updateSticker(sticker.id, artist_id);
  } else {
    debug('Upsert did not find a sticker, therefore inserting');
    return await insertSticker(vanity, artist_id);
  }
}

module.exports = {
  findStickerByVanity,
  findStickerById,
  updateSticker,
  insertSticker,
  upsertSticker,
}
