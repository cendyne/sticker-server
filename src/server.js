const express = require('express');
const { body, validationResult } = require('express-validator');
const app = express();
const db = require('./db').knex;


app.use(express.json());


app.get('/', async (req, res) => {
  let n = 0;
  n = (await db('sticker').count('id'))[0]['count(`id`)'];
  console.log("n", n)
  
  res.send(`There are ${n} stickers`)
});

app.put('/artist',
  body('vanity').matches(/[a-z0-9_\-]{3,}/),
  body('name').isLength({min: 3}),
  body('href').matches(/https?:\/\/.+/),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    let {vanity, name, href} = req.body;
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
      "ok": true
    });
});


module.exports = app
