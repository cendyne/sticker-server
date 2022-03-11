const fs = require('fs');
const path = require('path');
const express = require('express');
const { checkSchema, validationResult } = require('express-validator');
const app = express();
const db = require('./db').knex;
const fileUpload = require('express-fileupload');
const {artistSchema, stickerSchema, stickerFileSchema, stickerFilePathRegex} = require('./schemas');
let filePath = process.env.FILES_PATH || './files/';
if (filePath.endsWith('/')) {
  filePath = filePath.slice(0, -1);
}
filePath = path.resolve(...filePath.split('/'))
console.log('Upload file path', filePath);


app.use(express.json());

app.use(fileUpload({
  limits: {
    fileSize: 1000000 // 1MB
  },
  abortOnLimit: true
}));


app.get('/', async (req, res) => {
  let n = 0;
  n = (await db('sticker').count('id'))[0]['count(`id`)'];
  console.log("n", n)
  
  res.send(`There are ${n} stickers`)
});

app.put('/artist',
  checkSchema(artistSchema),
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
      "status": "ok",
      "value": result[0]
    });
});


app.put('/sticker',
  checkSchema(stickerSchema),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    let {vanity, artist_vanity} = req.body;
    vanity = vanity.toLowerCase();
    artist_vanity = artist_vanity.toLowerCase();
    console.log({vanity, artist_vanity});
    let result = await db('artist').where('vanity', '=', artist_vanity).select('*');
    let artist = null;
    if (result.length > 0) {
      let row = result[0];
      artist = row;
    } else {
      return res.status(400).json({ errors: [
        {
          "value": artist_vanity,
          "msg": "Artist does not exist",
          "param": "artist_vanity",
          "location": "body"
        }
      ]});
    }

    result = await db('sticker').where('vanity', '=', vanity).select('id');
    if (result.length > 0) {
      let row = result[0];
      let id = row['id'];
      // This is an update
      result = await db('sticker').returning('*').where('id', '=', id).update({
        vanity,
        artist_id: artist.id
      });
      if (result > 0) {
        // Is a row count
        result = await db('sticker').where('id', '=', id).select('*');
      } else {
        return res.status(500).json({ errors: ['Expected to update an sticker but could not?'] });
      }
      console.log(result);
    } else {
      result = await db('sticker').returning('*').insert({
        vanity,
        artist_id: artist.id
      })
      console.log(result);
    }

    res.send({
      "status": "ok",
      "value": result[0]
    });
});

const fileRegex = /file\/([^/]+)\/([^.]+)\.([a-z0-9A-Z]+)/;

const stickerFileHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // The only changable thing is source
  let {content_type, source, size, sticker_vanity} = req.body;
  content_type = content_type.toLowerCase();
  sticker_vanity = sticker_vanity.toLowerCase();
  if (source.startsWith('/')) {
    source = source.substring(1); // Drop the initial slash
  }
  console.log({content_type, source, size, sticker_vanity});
  let result = await db('sticker').where('vanity', '=', sticker_vanity).select('*');
  let sticker = null;
  if (result.length > 0) {
    let row = result[0];
    sticker = row;
  } else {
    return res.status(400).json({ errors: [
      {
        "value": sticker_vanity,
        "msg": "Sticker does not exist",
        "param": "sticker_vanity",
        "location": "body"
      }
    ]});
  }

  let fmatch = source.match(fileRegex);
  if (!fmatch) {
    return res.status(400).json({ errors: [
      {
        "value": source,
        "msg": "Source does not match expected format file/<size>/<vanity>.<ext>",
        "param": "source",
        "location": "body"
      }
    ]});
  }

  let filePathSize = fmatch[1];
  let filePathVanity = fmatch[2];
  let filePathExt = fmatch[3].toLowerCase();

  if (parseInt(filePathSize) != size) {
    return res.status(400).json({ errors: [
      {
        "value": size,
        "msg": `size ${size} does not match file path ${source}`,
        "param": "size",
        "location": "body"
      }
    ]});
  }

  if (filePathVanity != sticker_vanity) {
    return res.status(400).json({ errors: [
      {
        "value": sticker_vanity,
        "msg": `sticker_vanity ${sticker_vanity} does not match file path ${source}`,
        "param": "sticker_vanity",
        "location": "body"
      }
    ]});
  }

  if (filePathExt == 'jpeg') {
    filePathExt = 'jpg';
    source = `file/${size}/${sticker_vanity}.${filePathExt}`;
  }

  // TODO check file exists

  if (
    (filePathExt == 'gif' && content_type == 'image/gif') ||
    (filePathExt == 'avif' && content_type == 'image/avif') ||
    (filePathExt == 'jpg' && content_type == 'image/jpeg') || 
    (filePathExt == 'png' && content_type == 'image/png') ||
    (filePathExt == 'webp' && content_type == 'image/webp') ||
    (filePathExt == 'jxl' && content_type == 'image/jxl') ||
    (filePathExt == 'svg' && content_type == 'image/svg+xml') ||
    false // spacer line
    ) {
    // Nothing, it's good
  } else {
    return res.status(400).json({ errors: [
      {
        "value": content_type,
        "msg": `content_type ${content_type} does not match file path ${source}`,
        "param": "content_type",
        "location": "body"
      }
    ]});
  }


  result = await db('sticker_file').where({
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
      source
    });
    if (result > 0) {
      // Is a row count
      result = await db('sticker_file').where('id', '=', id).select('*');
    } else {
      return res.status(500).json({ errors: ['Expected to update an sticker_file but could not?'] });
    }
    console.log(result);
  } else {
    result = await db('sticker_file').returning('*').insert({
      sticker_id: sticker.id,
      content_type,
      size,
      source
    })
    console.log(result);
  }

  res.send({
    "status": "ok",
    "value": result[0]
  });
};

app.put('/sticker-file', checkSchema(stickerFileSchema), stickerFileHandler);

const uploadHandler = async (req, res) => {
  let source = req.url.substring(1);
  let fmatch = source.match(fileRegex);
  if (!fmatch) {
    return res.status(400).json({ errors: [
      {
        "value": source,
        "msg": "File destination does not match file/<size>/<vanity>.<ext>",
        "param": "path",
        "location": "url"
      }
    ]});
  }

  let filePathSize = fmatch[1];
  let filePathVanity = fmatch[2];
  let filePathExt = fmatch[3].toLowerCase();

  // Normalize jpeg to jpg
  if (filePathExt == 'jpeg') {
    filePathExt = 'jpg';
    source = `file/${filePathSize}/${filePathVanity}.${filePathExt}`;
  }

  console.log({source});
  if (!req.files) {
    return res.status(400).json({ errors: [
      {
        "value": null,
        "msg": "No file found in content body",
        "param": "",
        "location": "body"
      }
    ]});
  }
  console.log(req.files);
  let keys = Object.keys(req.files);
  if (keys.length != 1) {
    return res.status(400).json({ errors: [
      {
        "value": keys,
        "msg": "Multiple files were uploaded, only one is supported",
        "param": "",
        "location": "body"
      }
    ]});
  }
  let file = req.files[keys[0]];
  if (file.truncated) {
    return res.status(400).json({ errors: [
      {
        "value": file.name,
        "msg": "File was too big, it got truncated",
        "param": "",
        "location": "body"
      }
    ]});
  }
  let content_type = null;
  switch (filePathExt) {
    case 'gif': content_type = 'image/gif'; break;
    case 'avif': content_type = 'image/avif'; break;
    case 'jpg': content_type = 'image/jpeg'; break;
    case 'png': content_type = 'image/png'; break;
    case 'webp': content_type = 'image/webp'; break;
    case 'jxl': content_type = 'image/jxl'; break;
    case 'svg': content_type = 'image/svg+xml'; break;
  }
  if (!content_type) {
    // This should be unreachable
    return res.status(400).json({ errors: [
      {
        "value": filePathExt,
        "msg": "File extension did not map to a known content type",
        "param": "",
        "location": "url"
      }
    ]});
  }
  if (file.mimetype && file.mimetype != content_type) {
    return res.status(400).json({ errors: [
      {
        "value": filePathExt,
        "msg": `${filePathExt} did not map to content type on file ${file.mimetype}`,
        "param": "",
        "location": "body"
      }
    ]});
  }

  let fullPath = `${filePath}/${filePathSize}/${filePathVanity}.${filePathExt}`;
  let parentPath = `${filePath}/${filePathSize}`;
  console.log('Creating parent path');

  try {
    await fs.promises.access(parentPath);
  } catch (e) {
    await fs.promises.mkdir(parentPath, {recursive: true});
    console.log(`Created path ${parentPath}`);
  }

  console.log(`Creating file ${fullPath}`);
  await fs.promises.writeFile(fullPath, file.data);
  console.log('Created file!');
  // TODO
  res.send({
    "status": "ok"
  });
};

app.put(stickerFilePathRegex, uploadHandler);
app.post(stickerFilePathRegex, uploadHandler);
app.get(stickerFilePathRegex, async (req, res, next) => {
  let source = req.url.substring(1);
  let fmatch = source.match(fileRegex);
  if (!fmatch) {
    return res.status(400).json({ errors: [
      {
        "value": source,
        "msg": "File destination does not match file/<size>/<vanity>.<ext>",
        "param": "path",
        "location": "url"
      }
    ]});
  }

  let filePathSize = fmatch[1];
  let filePathVanity = fmatch[2];
  let filePathExt = fmatch[3].toLowerCase();

  // Normalize jpeg to jpg
  if (filePathExt == 'jpeg') {
    filePathExt = 'jpg';
  }

  let fullPath = `${filePath}/${filePathSize}/${filePathVanity}.${filePathExt}`;

  if (await fs.promises.stat(fullPath)) {
    // TODO with better cache headers
    res.sendFile(fullPath);
  } else {
    // This handler was not found
    next();
  }
});

module.exports = app
