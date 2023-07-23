import doNothingWork from "./works/doNothingWork.js";
import martingaleWork from "./works/martingaleWork.js";

class TaskHandler {
  checkExecutable(task) {
    if (task.when === "SPECIFIC") return false;

    return true;
  }

  async runTask(task) {
    if (!this.checkExecutable(task)) return;
    switch (task.type) {
      case "GPT":
        // TODO: implement
        break;

      case "SLACK":
        // TODO: implement
        break;

      case "SYSTEM":
        // TODO: implement
        break;

      case "MARTINGALE":
        await martingaleWork(task.data.slackHandler, task.data.excelHandler, task.data.binanceHandler);
        break;

      case "DONOTHING":
        doNothingWork();
        break;

      default:
        break;
    }
  }
}
export default TaskHandler;
