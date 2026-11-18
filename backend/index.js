import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';

const startServer = async () => {
  await connectDatabase();
  app.listen(env.port, () => {
    console.log(`DukaanVoice backend listening on port ${env.port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start the server', error);
  process.exit(1);
});
