// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

  development: {
    client: 'better-sqlite3',
    connection: {
      filename: './dev.sqlite3'
    },
    useNullAsDefault: true
  },

  production: {
    client: 'better-sqlite3',
    connection: {
      filename: process.env.DB || './database.sqlite3'
    },
    useNullAsDefault: true
  }

};
