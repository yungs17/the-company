import Slack from "@slack/bolt";
import * as config from "./Jonathan/utils/config.js";
import AppBuilder from "./Jonathan/utils/AppBuilder.js";
import DBHandler from "./Jonathan/utils/DBHandler.js";
import TaskHandler from "./Jonathan/autonomous/TaskHandler.js";
import * as toadSchedule from "toad-scheduler";

const app = new Slack.App(config.appConfig);
const appBuiler = new AppBuilder(app);
const dbHandler = new DBHandler(config.dbConfig);
const taskHandler = new TaskHandler();

(async () => {
  await app.start(8080);

  appBuiler.registerCommands();

  const processTasks = async () => {
    const tasks = await dbHandler.getAllTasks();

    tasks.forEach(async (task) => {
      await taskHandler.runTask(task);
    });
    console.log(tasks);
  };

  // jonathan cron
  const toadScheduler = new toadSchedule.ToadScheduler();
  const toadTask = new toadSchedule.Task("Jonathan working", processTasks);
  const toadJob = new toadSchedule.SimpleIntervalJob({ seconds: 5 }, toadTask);
  toadScheduler.addSimpleIntervalJob(toadJob);

  console.log("⚡️Jonathan On...\n");
})();
