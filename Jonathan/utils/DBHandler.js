import * as mysql from "mysql";
import util from "util";
import { Task } from "../autonomous/taskModel.js";

const LogType = {
  ADDTASK: 0,
  REMOVETASK: 1,
};

class Log {
  constructor(type, data) {
    if (!Object.values(LogType).includes(type)) {
      throw new Error("Invalid type value");
    }
    this.type = type;
    this.data = data;
    this.createdAt = Date.now();
  }
}

class DBHandler {
  constructor(config) {
    this.connection = mysql.createConnection(config);
    this.query = util.promisify(this.connection.query).bind(this.connection);
    this.log = async (log) => {
      await this.query(
        `write id auto-generated, ${log.type}, ${log.data}, ${log.createdAt}`
      );
    };
  }

  async addTask(task) {
    await this.query(`add task sql ${task.type} ${task.when} ${task.data} `);
    this.log(new Log(LogType.ADDTASK, "data"));
  }

  async removeTask(id) {
    await this.query(`soft delete task sql where id = ${id} `);
    this.log(new Log(LogType.REMOVETASK, "data"));
  }

  async getAllTasks() {
    const tasks = await this.query(
      `get all tasks that are valid (not soft removed) from sql`
    );
    return tasks.map(
      (taskData) =>
        new Task(
          taskData.id,
          taskData.type,
          taskData.when,
          taskData.data,
          taskData.createdAt
        )
    );
  }
}

export default DBHandler;
