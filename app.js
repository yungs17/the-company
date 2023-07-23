import Slack from "@slack/bolt";
import * as config from "./Jonathan/utils/config.js";
import AppBuilder from "./Jonathan/utils/AppBuilder.js";
// import DBHandler from "./Jonathan/utils/DBHandler.js";
import TaskHandler from "./Jonathan/autonomous/TaskHandler.js";
import * as toadSchedule from "toad-scheduler";
import { Task, TaskType, TaskWhen } from "./Jonathan/autonomous/TaskModel.js";
import SlackHandler from "./Jonathan/utils/SlackHandler.js";
import ExcelHandler from "./Jonathan/utils/ExcelHandler.js";
import BinanceHandler from "./Jonathan/utils/BinanceHandler.js";

const app = new Slack.App(config.appConfig);
const appBuiler = new AppBuilder(app);
// const dbHandler = new DBHandler(config.dbConfig);
const taskHandler = new TaskHandler();
const slackHandler = new SlackHandler(app);
const excelHandler = new ExcelHandler(config.excelConfig);
const binanceHandler = new BinanceHandler(config.binanceConfig);

(async () => {
  await app.start(8080);

  appBuiler.registerCommands();

  const processTasks = async () => {
    // const tasks = await dbHandler.getAllTasks();
    const tasks = [new Task(-1, TaskType.MARTINGALE, TaskWhen.ALWAYS, { slackHandler, excelHandler, binanceHandler }, Date.now())];

    tasks.forEach(async (task) => {
      await taskHandler.runTask(task);
    });
    // console.log(tasks);
  };

  // jonathan cron
  const toadScheduler = new toadSchedule.ToadScheduler();
  const toadTask = new toadSchedule.Task("Jonathan working", processTasks);
  const toadJob = new toadSchedule.SimpleIntervalJob({ seconds: 5 }, toadTask);
  toadScheduler.addSimpleIntervalJob(toadJob);

  console.log("⚡️Jonathan On...\n");
})();
