const express = require('express');
const { checkSchema } = require('express-validator');
const bearerToken = require('express-bearer-token');
const app = express();
const fileUpload = require('express-fileupload');
const {checkToken} = require('./token')
const {artistSchema, stickerSchema, stickerFileSchema, stickerFilePathRegex} = require('./schemas');

const {uploadStickerFileHandler, upsertStickerFileHandler, findStickerFileResourceHandler} = require('./handlers/stickerFileHandlers');
const {upsertStickerHandler} = require('./handlers/stickerHandlers');
const {upsertArtistHandler, allArtistsJsonHandler, artistJsonHandler} = require('./handlers/artistHandlers');
const {allStickersJsonHandler, allStickersHtmlHandler} = require('./handlers/allStickersHandler');

app.use(express.json());
app.use(bearerToken());

app.use(fileUpload({
  limits: {
    fileSize: 1000000 // 1MB
  },
  abortOnLimit: true
}));
app.disable('x-powered-by');
app.set('view engine', 'pug')


app.get('/', allStickersHtmlHandler);
app.get('/.json', allStickersJsonHandler);

app.put('/artist', checkToken, checkSchema(artistSchema), upsertArtistHandler);
app.get('/artist.json', allArtistsJsonHandler);
app.get('/artist/:vanity.json', artistJsonHandler);
app.put('/sticker', checkToken, checkSchema(stickerSchema), upsertStickerHandler);
app.put('/sticker-file', checkToken, checkSchema(stickerFileSchema), upsertStickerFileHandler);
// No schema, these are file uploads
app.put(stickerFilePathRegex, checkToken, uploadStickerFileHandler);
app.post(stickerFilePathRegex, checkToken, uploadStickerFileHandler);

// Send sticker files back
app.get(stickerFilePathRegex, findStickerFileResourceHandler);

app.use(express.static('static'))

module.exports = app
