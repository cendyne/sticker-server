const db = require('../db').knex;
const debug = require('../debug');

async function findArtistByVanity(vanity) {
  let result = await db('artist').where({vanity}).select('*');
  if (result.length > 0) {
    debug('Found artist %s', vanity);
    return result[0];
  }
  debug('Could not find artist %s', vanity);
  return null;
}

async function findArtistById(id) {
  let result = await db('artist').where({id}).select('*');
  if (result.length > 0) {
    debug('Found artist %s', id);
    return result[0];
  }
  debug('Could not find artist by id%s', id);
  return null;
}

async function findAllArtists() {
  return await db('artist').select('*');
}

async function updateArtist(id, name, href) {
  let result = await db('artist').where({id}).update({
    name,
    href
  });
  if (result > 0) {
    debug('Successfully updated artist %d', id);
    return await findArtistById(id);
  }
  debug('Failed to update artist %d', id)
  return null;
}

async function insertArtist(vanity, name, href) {
  let result = await db('artist').returning('*').insert({
    vanity,
    name,
    href
  });
  if (result && result.length > 0 && result[0]) {
    debug('Inserted artist %d', result[0].id)
  } else {
    debug('Failed to insert artist %s', result);
  }

  return result[0];
}

async function upsertArtist(vanity, name, href) {
  let artist = await findArtistByVanity(vanity);
  if (artist) {
    debug('Upsert found artist %d, therefore updating', artist.id);
    return await updateArtist(artist.id, name, href);
  } else {
    debug('Upsert did not find a artist, therefore inserting');
    return await insertArtist(vanity, name, href);
  }
}

module.exports = {
  findArtistByVanity,
  upsertArtist,
  findAllArtists,
  findArtistById,
}
