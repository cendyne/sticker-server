const db = require('./db').knex;

async function upsertStickerFile(sticker, content_type, size, source, length, md5) {
  let result = await db('sticker_file').where({
    sticker_id: sticker.id,
    content_type,
    size
  }).select('id');
  if (result.length > 0) {
    let row = result[0];
    let id = row['id'];
    // This is an update
    result = await db('sticker_file').returning('*').where('id', '=', id).update({
      // sticker_id cannot change
      // content_type cannot change
      // size cannot change
      source,
      length,
      md5
    });
    if (result > 0) {
      // Is a row count
      result = await db('sticker_file').where('id', '=', id).select('*');
    } else {
      throw new Error('Expected to update an sticker_file but could not?');
    }
    console.log(result);
    return result[0];
  } else {
    result = await db('sticker_file').returning('*').insert({
      sticker_id: sticker.id,
      content_type,
      size,
      source,
      length,
      md5
    })
    console.log(result);
    return result[0];
  }
}

// TODO findStickerFile

module.exports = {
  upsertStickerFile
}
