const port = process.env.PORT || 3000;
const db = require('./db');
const app = require('./server');

const run = async () => {
  console.log('Migrating');
  await db.migrateAll(db.knex);
  console.log('Migration complete');
  app.listen(port, () => {
    console.log(`Stickers listening ${port}`)
  });
}

run();
