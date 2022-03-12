const db = require('./db').knex;
const debug = require('./debug');

async function findStickerFileById(id) {
  let result = await db('sticker_file').where({id}).select('*');
  if (result.length > 0) {
    debug('Found sticker file %d', id);
    return result[0];
  }

  return null;
}

async function findStickerFile(sticker_id, content_type, size) {
  let result = await db('sticker_file').where({
    sticker_id,
    content_type,
    size
  }).select('*');
  if (result.length > 0) {
    debug('Found sticker file %d %s %d', sticker_id, content_type, size);
    return result[0];
  }
  debug('Could not find sticker file %d %s %d', sticker_id, content_type, size);
  return null;
}

async function updateStickerFile(id, source, length, md5) {
  let result = await db('sticker_file').returning('*').where('id', '=', id).update({
    // sticker_id cannot change
    // content_type cannot change
    // size cannot change
    source,
    length,
    md5
  });
  if (result > 0) {
    debug('Successfully updated sticker file %d', id);
    return await findStickerFileById(id);
  }
  debug('Failed to update sticker file %d', id)
  return null;
}

async function insertStickerFile(sticker_id, content_type, size, source, length, md5) {
  let result = await db('sticker_file').returning('*').insert({
    sticker_id,
    content_type,
    size,
    source,
    length,
    md5
  });
  if (result && result.length > 0 && result[0]) {
    debug('Inserted sticker file %d', result[0].id)
  } else {
    debug('Failed to insert sticker file %s', result);
  }
  return result[0];
}

async function upsertStickerFile(sticker, content_type, size, source, length, md5) {
  let stickerFile = await findStickerFile(sticker.id, content_type, size)
  if (stickerFile) {
    debug('Upsert found sticker file %d, therefore updating', stickerFile.id);
    return await updateStickerFile(stickerFile.id, source, length, md5);
  } else {
    debug('Upsert did not find a sticker file, therefore inserting');
    return await insertStickerFile(sticker.id, content_type, size, source, length, md5);
  }
}

// TODO find sticker files by sticker

module.exports = {
  upsertStickerFile,
  findStickerFile
}
