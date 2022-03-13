// node
const crypto = require('crypto');
const fs = require('fs');
// deps
const {validationResult} = require('express-validator');
// project
const {filePath, staticPath} = require('../paths');
const {fileRegex} = require('../schemas');
const {findStickerByVanity} = require('../data/sticker');
const {upsertStickerFile} = require('../data/stickerFile');

const md5File = async (fullPath) => {
  const fileBuffer = await fs.promises.readFile(fullPath);
  const hashSum = crypto.createHash('md5');
  hashSum.update(fileBuffer);

  return hashSum.digest('hex');
}

const extensionToContentTypeMap = {
  'gif': 'image/gif',
  'avif': 'image/avif',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'webp': 'image/webp',
  'jxl': 'image/jxl',
  'svg': 'image/svg+xml',
};

const contentTypeToExtensionMap = {
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/jxl': 'jxl',
  'image/svg+xml': 'svg',
};

const extensionToContentType = (ext) => {
  let contentType = extensionToContentTypeMap[ext];
  if (!contentType) {
    throw new Error(`Extension ${ext} unknown`);
  }
  return contentType;
}

const contentTypeToExtension = (contentType) => {
  let ext = contentTypeToExtensionMap[contentType];
  if (!ext) {
    throw new Error(`Content Type ${contentType} unknown`);
  }
  return ext;
}

/**
 *
 * @param {string} ext
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function notFoundHandler(ext, res, next) {
  // Only happens when the sticker record exists but not the format
  let fullPath = null;
  switch(ext) {
    case 'avif': fullPath = `${staticPath}/not-found.avif`; break;
    case 'gif': fullPath = `${staticPath}/not-found.gif`; break;
    case 'jpg': fullPath = `${staticPath}/not-found.jpg`; break;
    case 'jxl': fullPath = `${staticPath}/not-found.jxl`; break;
    case 'png': fullPath = `${staticPath}/not-found.png`; break;
    case 'webp': fullPath = `${staticPath}/not-found.webp`; break;
    case 'svg': fullPath = `${staticPath}/not-found.svg`; break;
  }
  if (fullPath) {
    res.status(404);
    res.sendFile(fullPath, {
      maxAge: 60_000
    }, (err) => {
      if (err) {
        next();
      }
    });
    return;
  }
  // Should be covered unless they go with svg I guess
  console.log(`unhandled extension ${ext}`);
  next();
}

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function upsertStickerFileHandler (req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // The only changable thing is source from the end user
  let {content_type, source, size, sticker_vanity} = req.body;
  content_type = content_type.toLowerCase();
  sticker_vanity = sticker_vanity.toLowerCase();
  if (source.startsWith('/')) {
    source = source.substring(1); // Drop the initial slash
  }
  console.log({content_type, source, size, sticker_vanity});
  let result = null; // TODO refactor until first use
  let sticker = await findStickerByVanity(sticker_vanity);
  if (!sticker) {
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

  let fullPath = `${filePath}/${filePathSize}/${filePathVanity}.${filePathExt}`;

  let md5 = null;
  let length = null;
  try {
    console.log(`checking that ${fullPath} exists`)
    let stat = await fs.promises.stat(fullPath);
    console.log('stat', stat);
    length = stat.size;
  } catch (e) {
    return res.status(400).json({ errors: [
      {
        "value": source,
        "msg": `source ${source} was not found`,
        "param": "source",
        "location": "body"
      }
    ]});
  }

  md5 = await md5File(fullPath);
  let expectedExt = contentTypeToExtension(content_type);

  if (filePathExt != expectedExt) {
    return res.status(400).json({ errors: [
      {
        "value": content_type,
        "msg": `content_type ${content_type} does not match file path ${source}, expected ${expectedExt}`,
        "param": "content_type",
        "location": "body"
      }
    ]});
  }

  result = await upsertStickerFile(sticker, content_type, size, source, length, md5);

  res.send({
    "status": "ok",
    "value": result
  });
};

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function uploadStickerFileHandler (req, res) {
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

  let filePathSize = parseInt(fmatch[1]);
  let filePathVanity = fmatch[2];
  let filePathExt = fmatch[3].toLowerCase();

  // Normalize jpeg to jpg
  if (filePathExt == 'jpeg') {
    filePathExt = 'jpg';
    source = `file/${filePathSize}/${filePathVanity}.${filePathExt}`;
  }

  // TODO verify that the entity exists

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
  let content_type = extensionToContentType(filePathExt);

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

  let sticker = await findStickerByVanity(filePathVanity);
  if (!sticker) {
    return res.status(400).json({ errors: [
      {
        "value": filePathVanity,
        "msg": `No sticker found for ${filePathVanity}`,
        "param": "",
        "location": "url"
      }
    ]});
  }

  let fullPath = `${filePath}/${filePathSize}/${filePathVanity}.${filePathExt}`;
  let parentPath = `${filePath}/${filePathSize}`;
  console.log('Creating parent path');

  // Uploading is such an infrequent op that this does not need to be refactored and cached.
  try {
    await fs.promises.access(parentPath);
  } catch (e) {
    await fs.promises.mkdir(parentPath, {recursive: true});
    console.log(`Created path ${parentPath}`);
  }

  console.log(`Creating file ${fullPath}`);
  await fs.promises.writeFile(fullPath, file.data);
  console.log('Created file!');
  let stickerFile = await upsertStickerFile(sticker, content_type, filePathSize, source, file.size, file.md5);
  res.send({
    status: "ok",
    value: stickerFile
  });
};

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
 async function findStickerFileResourceHandler(req, res, next) {
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

  let sticker = await findStickerByVanity(filePathVanity);
  if (!sticker) {
    return await notFoundHandler(filePathExt, res, next);
  }

  let fullPath = `${filePath}/${filePathSize}/${filePathVanity}.${filePathExt}`;

  let contentType = extensionToContentType(filePathExt);
  if (contentType) {
    res.setHeader('Content-Type', contentType);
  }
  // TODO more cache headers?
  res.sendFile(fullPath, {
    // One hour for a file should be enough under normal circumstances
    maxAge: 3_600_000
  }, async (err) => {
    if (err) {
      return await notFoundHandler(filePathExt, res, next);
    }
  });
};


module.exports = {
  uploadStickerFileHandler,
  upsertStickerFileHandler,
  findStickerFileResourceHandler,
}
