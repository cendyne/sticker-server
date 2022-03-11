/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
    .createTable('sticker', function(table) {
        table.increments('id');
        table.string('vanity', 255).notNullable();
        table.integer('artist_id').notNullable();
        table.foreign('artist_id').references('id').inTable('artist');
    })
    .createTable('sticker_file', function(table) {
        table.increments('id');
        table.integer('sticker_id').notNullable();
        table.foreign('sticker_id').references('id').inTable('sticker');
        table.string('content_type', 255).notNullable();
        table.string('source',255).notNullable();
        table.integer('size').notNullable();
        
        table.unique(['sticker_id', 'size', 'content_type'], {
            indexName: 'sticker_id_size_content'
        });
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
  .dropTable('sticker_file')
  .dropTable('sticker');
};
