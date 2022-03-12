const environment = process.env.ENVIRONMENT || 'development'
const config = require('../knexfile.js')[environment];
/**
 * @returns { import("knex").Knex }
 */
const knexFn = function() {
  return require('knex')(config);
}
const knex = knexFn();
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<any> }
 */
const migrateAll = async function(knex) {
  return knex.migrate.latest();
}

module.exports = {
  knex,
  migrateAll
}
