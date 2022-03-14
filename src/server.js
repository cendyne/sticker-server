const express = require('express');
const compression = require('compression');
const { checkSchema } = require('express-validator');
const bearerToken = require('express-bearer-token');
const app = express();
const fileUpload = require('express-fileupload');
const {checkToken} = require('./token')
const {artistSchema, stickerSchema, stickerFileSchema, stickerFilePathRegex} = require('./schemas');

const {uploadStickerFileHandler, upsertStickerFileHandler, findStickerFileResourceHandler} = require('./handlers/stickerFileHandlers');
const {upsertStickerHandler, stickerJsonHandler, stickerHtmlHandler} = require('./handlers/stickerHandlers');
const {upsertArtistHandler, allArtistsJsonHandler, artistJsonHandler, artistHtmlHandler} = require('./handlers/artistHandlers');
const {allStickersAndArtistsJsonHandler, allStickersHtmlHandler} = require('./handlers/allStickersHandler');

app.use(express.json());
app.use(bearerToken());
app.use(compression())

app.use(fileUpload({
  limits: {
    fileSize: 1000000 // 1MB
  },
  abortOnLimit: true
}));
app.disable('x-powered-by');
app.set('view engine', 'pug')


app.get('/', allStickersHtmlHandler);
app.get('/.json', allStickersAndArtistsJsonHandler);
app.get('/json', allStickersAndArtistsJsonHandler);

app.put('/artist', checkToken, checkSchema(artistSchema), upsertArtistHandler);
app.get('/artist.json', allArtistsJsonHandler);
app.get('/artist/:vanity', artistHtmlHandler);
app.get('/artist/:vanity.json', artistJsonHandler);
app.put('/sticker', checkToken, checkSchema(stickerSchema), upsertStickerHandler);
app.get('/sticker/:vanity', stickerHtmlHandler);
app.get('/sticker/:vanity.json', stickerJsonHandler);
app.put('/sticker-file', checkToken, checkSchema(stickerFileSchema), upsertStickerFileHandler);
// No schema, these are file uploads
app.put(stickerFilePathRegex, checkToken, uploadStickerFileHandler);
app.post(stickerFilePathRegex, checkToken, uploadStickerFileHandler);

// Send sticker files back
app.get(stickerFilePathRegex, findStickerFileResourceHandler);

express.static.mime.define({'image/avif': ['avif']});
express.static.mime.define({'image/jxl': ['jxl']});

app.use(express.static('static'))

module.exports = app
