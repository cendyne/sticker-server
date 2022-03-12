/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
    .createView('stickers_all_files', function (view) {
      // select sticker_id, json_group_array(json_object('size', size, 'content_type', content_type, 'source', source, 'length', length)) as files from (select * from sticker_file order by sticker_id, size, content_type) group by sticker_id;
      let subquery = knex('sticker_file').orderBy('sticker_id', 'size', 'content_type').select('*');
      view.columns(['sticker_id', 'files']);
      view.as(knex(subquery)
        .join('sticker', 'artist.id', '=', 'sticker.artist_id')
        .orderBy(['sticker_id'])
        .groupBy('sticker_id')
        .select(knex.raw('sticker_id, json_group_array(json_object(\'size\', size, \'content_type\', content_type, \'source\', source, \'length\', length)) as files')));
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropView('stickers_all_files');
};
