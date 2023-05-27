import pkg from "@slack/bolt";
import { config } from "dotenv";
import AppBuilder from "./Jonathan/utils/AppBuilder.js";
import DBHandler from "./Jonathan/utils/DBHandler.js";
import * as toadSchedule from "toad-scheduler";
const { App } = pkg;

config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "main",
  connectionLimit: 1,
};

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

(async () => {
  await app.start(8080);

  const appBuiler = new AppBuilder(app);
  const dbHandler = new DBHandler(dbConfig);

  appBuiler.registerCommands();

  // jonathan logics under here
  const processTasks = async () => {
    // go through tasks from db and call work function according to their types
    const tasks = await dbHandler.getAllTasks();
    console.log(tasks);
  };

  const toadScheduler = new toadSchedule.ToadScheduler();
  const toadTask = new toadSchedule.Task("Jonathan working", processTasks);
  const toadJob = new toadSchedule.SimpleIntervalJob({ seconds: 5 }, toadTask);
  toadScheduler.addSimpleIntervalJob(toadJob);

  console.log("Jonathan On");
})();
