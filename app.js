require("dotenv").config();

const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

(async () => {
  // Start your app
  await app.start(8080);

  console.log("Jonathan On");
})();

app.command("/test", async ({ ack }) => {
  await ack();
  console.log("req received");
});
