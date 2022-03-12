/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
    .alterTable('sticker', function(table) {
        table.index(['artist_id', 'vanity'], 'sticker_artist_id_vanity');
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema
    .alterTable('sticker', function(table) {
        table.dropIndex(['artist_id', 'vanity'], 'sticker_artist_id_vanity')
    })
};
