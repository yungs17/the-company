import fs from "fs/promises";
import path from "path";

class AppBuilder {
  constructor(app) {
    this.app = app;
    this.commandsDir = path.resolve("./Jonathan/commands");
    console.log("⚡️Initializing App");
  }

  async registerCommands() {
    const filenames = await fs.readdir(this.commandsDir);
    console.log("Registering Slack commands");

    await Promise.all(
      filenames.map(async (filename) => {
        if (filename === "index.js") return;
        const moduleName = path.basename(filename, ".js");
        console.log("  " + moduleName);
        const modulePath = `${this.commandsDir}/${filename}`;
        const commandModule = await import(modulePath);
        this.app.command(`/${moduleName}`, commandModule.default);
      })
    );
  }
}

export default AppBuilder;
