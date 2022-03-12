const express = require('express');
const { checkSchema } = require('express-validator');
const app = express();
const db = require('./db').knex;
const fileUpload = require('express-fileupload');
const {artistSchema, stickerSchema, stickerFileSchema, stickerFilePathRegex} = require('./schemas');

const {uploadStickerFileHandler, upsertStickerFileHandler, findStickerFileResourceHandler} = require('./handlers/stickerFileHandlers');
const {upsertStickerHandler} = require('./handlers/stickerHandlers');
const {upsertArtistHandler} = require('./handlers/artistHandlers');

app.use(express.json());

app.use(fileUpload({
  limits: {
    fileSize: 1000000 // 1MB
  },
  abortOnLimit: true
}));


app.get('/', async (req, res) => {
  // TODO extract count
  let n = 0;
  n = (await db('sticker').count('id'))[0]['count(`id`)'];
  console.log("n", n)

  res.send(`There are ${n} stickers`)
});

app.put('/artist', checkSchema(artistSchema), upsertArtistHandler);
app.put('/sticker', checkSchema(stickerSchema), upsertStickerHandler);
app.put('/sticker-file', checkSchema(stickerFileSchema), upsertStickerFileHandler);
// No schema, these are file uploads
app.put(stickerFilePathRegex, uploadStickerFileHandler);
app.post(stickerFilePathRegex, uploadStickerFileHandler);

// Send sticker files back
app.get(stickerFilePathRegex, findStickerFileResourceHandler);

module.exports = app
