/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
  .createView('all_stickers', function (view) {
    // select a.id as artist_id, name as artist_name, vanity as artist_vanity, href as artist_href, s.id as sticker_id, s.vanity as sticker_vanity from artist a join sticker s on s.artist_id = a.id order by a.vanity, s.vanity;
    view.columns(['artist_id', 'artist_name', 'artist_vanity', 'artist_href', 'sticker_id', 'sticker_vanity']);
    view.as(knex('artist')
      .join('sticker', 'artist.id', '=', 'sticker.artist_id')
      .orderBy(['artist.vanity', 'sticker.vanity'])
      .select(knex.raw('artist.id as artist_id, artist.name as artist_name, artist.vanity as artist_vanity, artist.href as artist_href, sticker.id as sticker_id, sticker.vanity as sticker_vanity')));
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
  .dropView('all_stickers');
};
