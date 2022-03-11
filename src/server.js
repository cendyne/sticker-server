const express = require('express');
const app = express();
const db = require('./db').knex;


app.get('/', async (req, res) => {
  let n = 0;
  n = (await db('sticker').count('id'))[0]['count(`id`)'];
  console.log("n", n)
  
  res.send(`There are ${n} stickers`)
})


module.exports = app
