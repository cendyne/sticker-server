const artistSchema = {
  vanity: {
    matches: {
      options: /[a-z0-9_\-]{3,}/
    }
  },
  name: {
    isLength : {
      options: {
        min: 3
      }
    }
  },
  href: {
    matches: {
      options: /https?:\/\/.+/
    }
  }
};

const stickerFileSchema = {
  content_type: {
    matches: {
      options: /image\/(gif|avif|jpeg|png|webp|jxl|svg+xml)/
    }
  },
  source: {
    matches: {
      // file/<size>/<vanity>.<ext>
      // file/512/hmm.jpeg - matches
      // file/1/whatever.jpeg - no match (size too small)
      // file/10000/whatever.jpeg - no match (size too small)
      // file/256/whatever.pdf - no match (extenision is not supported)
      options: /file\/[0-9]{2,4}\/[a-z0-9_\-]{3,}\.(gif|avif|jpe?g|png|webp|jxl|svg)/
    }
  },
  size: {
    isInt: {
      options: {
        min: 10,
        max: 1024
      }
    }
  },
  // no whole body validation for size and regex match line up.
  // would have to do that in the handler
  sticker_vanity: {
    matches: {
      options: /[a-z0-9_\-]{1,}/
    }
  }
};

const stickerSchema = {
  vanity: {
    matches: {
      options: /[a-z0-9_\-]{1,}/
    }
  },
  artist_vanity: {
    matches: {
      options: /[a-z0-9_\-]{3,}/
    }
  }
}

module.exports = {
  artistSchema,
  stickerFileSchema,
  stickerSchema
}
