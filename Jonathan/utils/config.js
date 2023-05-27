import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "main",
  connectionLimit: 1,
};

const appConfig = {
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
};

export { dbConfig, appConfig };
