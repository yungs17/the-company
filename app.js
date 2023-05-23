import pkg from "@slack/bolt";
import { config } from "dotenv";
import * as appBuilder from "./Jonathan/utils/appBuilder.js";
const { App } = pkg;

config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

(async () => {
  await app.start(8080);

  await appBuilder.registerCommands(app);

  console.log("Jonathan On");
})();
