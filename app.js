// import Slack from "@slack/bolt";
import express from "express";

// import * as config from "./Jonathan/utils/config.js";
// import AppBuilder from "./Jonathan/utils/AppBuilder.js";
// import DBHandler from "./Jonathan/utils/DBHandler.js";
// import TaskHandler from "./Jonathan/autonomous/TaskHandler.js";
import * as toadSchedule from "toad-scheduler";
// import { Task, TaskType, TaskWhen } from "./Jonathan/autonomous/TaskModel.js";
// import SlackHandler from "./Jonathan/utils/SlackHandler.js";
// import ExcelHandler from "./Jonathan/utils/ExcelHandler.js";
// import BinanceHandler from "./Jonathan/utils/BinanceHandler.js";

// const slackApp = new Slack.App(config.appConfig);
const serverApp = express();
// const appBuiler = new AppBuilder(slackApp);
// const dbHandler = new DBHandler(config.dbConfig);
// const taskHandler = new TaskHandler();
// const slackHandler = new SlackHandler(app);
// const excelHandler = new ExcelHandler(config.excelConfig);
// const binanceHandler = new BinanceHandler(config.binanceConfig);

// Middleware to parse JSON bodies
serverApp.use(express.json());

serverApp.post("/api/v1/ping", (req, res) => {
  const data = req.body;
  console.log("Received data:", data);

  res.status(200).json({ message: "Data received successfully", yourData: data });
});

const PORT = process.env.PORT || 3000;
serverApp.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

(async () => {
  // await slackApp.start(8080);

  // appBuiler.registerCommands();

  const processTasks = async () => {
    // const tasks = await dbHandler.getAllTasks();
    // const tasks = [new Task(-1, TaskType.MARTINGALE, TaskWhen.ALWAYS, { slackHandler, excelHandler, binanceHandler }, Date.now())];
    // const tasks = [new Task(-1, TaskType.MARTINGALE, TaskWhen.ALWAYS, { binanceHandler }, Date.now())];
    // tasks.forEach(async (task) => {
    //   await taskHandler.runTask(task);
    // });
    // console.log(tasks);
  };

  // jonathan cron
  const toadScheduler = new toadSchedule.ToadScheduler();
  const toadTask = new toadSchedule.Task("Jonathan working", processTasks);
  const toadJob = new toadSchedule.SimpleIntervalJob({ seconds: 60 }, toadTask);
  toadScheduler.addSimpleIntervalJob(toadJob);

  console.log("⚡️Jonathan On...\n");
})();
