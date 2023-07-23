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

const excelConfig = {
  spreadSheetEmail: "googlesheet2@testvacation.iam.gserviceaccount.com",
  spreadSheetId: "14ycTiu0eEWNRFGZYROgXL57eo-Qeld2-PgBa5NnzgD4",
  privateKey: process.env.SPREADSHEET_PRIVATE_KEY,
};

const binanceConfig = {
  binanceAPIKey: process.env.BINANCE_API_KEY,
  binanceSecret: process.env.BINANCE_SECRET,
};

export { dbConfig, appConfig, excelConfig, binanceConfig };
