const TaskType = {
  GPT: "GPT",
  SLACK: "SLACK",
  SYSTEM: "SYSTEM",
  DONOTHING: "DONOTHING",
};

const TaskWhen = {
  INSTANT: "INSTANT",
  ALWAYS: "ALWAYS",
  SPECIFIC: "SPECIFIC",
};

class Task {
  constructor(id, type, when, data, createdAt) {
    if (
      !Object.values(TaskType).includes(type) ||
      !Object.values(TaskWhen).includes(when)
    ) {
      throw new Error("Invalid type or when value");
    }

    this.id = id;
    this.type = type;
    this.when = when;
    this.data = data;
    this.createdAt = createdAt;
  }
}

export { Task, TaskType, TaskWhen };
