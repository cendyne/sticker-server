/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
    .alterTable('sticker_file', function(table) {
        table.string('md5', 255);
        table.integer('length').defaultTo(0);
    })
    .createTable('sticker_tag', function(table) {
        table.increments('id');
        table.string('tag', 255).notNullable();
        table.integer('sticker_id').notNullable();
        table.foreign('sticker_id').references('id').inTable('sticker');
        table.unique(['sticker_id', 'tag'], {
            indexName: 'sticker_tag_to_id'
        });
    })
    .alterTable('sticker', function(table) {
        table.index(['artist_id'], 'sticker_artist_id');
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema
    .alterTable('sticker_file', function(table) {
        table.dropColumn('md5');
        table.dropColumn('size');
    })
    .dropTable('sticker_tag')
    .alterTable('sticker', function(table) {
        table.dropIndex(['artist_id'], 'sticker_artist_id');
    })
};
