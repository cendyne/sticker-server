const {validationResult} = require('express-validator');
const db = require('./db').knex;
const {findArtistByVanity} = require('./artist');

async function upsertArtistHandler(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  let {vanity, name, href} = req.body;
  // TODO switch to findArtistByVanity
  let result = await db('artist').where('vanity', '=', vanity).select('id');
  console.log({vanity, name, href});
  if (result.length > 0) {
    let row = result[0];
    let id = row['id'];
    // This is an update
    result = await db('artist').returning('*').where('id', '=', id).update({vanity, name, href});
    if (result > 0) {
      // Is a row count
      result = await db('artist').where('id', '=', id).select('*');
    } else {
      return res.status(500).json({ errors: ['Expected to update an artist but could not?'] });
    }
    console.log(result);
  } else {
    result = await db('artist').returning('*').insert({vanity, name, href})
    console.log(result);
  }
  res.send({
    "status": "ok",
    "value": result[0]
  });
}

module.exports = {
  upsertArtistHandler
}
