/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
    .createView('artists_stickers_files', function (view) {
      // sselect * from all_stickers join stickers_all_files on all_stickers.sticker_id = stickers_all_files.sticker_id;
      view.columns(['artist_id', 'artist_name', 'artist_vanity', 'artist_href', 'sticker_id', 'sticker_vanity', 'files']);
      view.as(knex('all_stickers')
        .join('stickers_all_files', 'all_stickers.sticker_id', '=', 'stickers_all_files.sticker_id')
        .select('artist_id', 'artist_name', 'artist_vanity', 'artist_href', 'all_stickers.sticker_id', 'sticker_vanity', 'files'));
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {

};
