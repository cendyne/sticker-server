/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
  .createTable('artist', function(table) {
      table.increments('id');
      table.string('name', 255).notNullable();
      table.string('vanity', 255).notNullable();
      table.string('href', 255);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('artist');
};
