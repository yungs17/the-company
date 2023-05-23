import fs from "fs/promises";
import path from "path";

const registerCommands = async (app) => {
  const commandsDir = path.resolve("./Jonathan/commands");
  const filenames = await fs.readdir(commandsDir);

  await Promise.all(
    filenames.map(async (filename) => {
      console.log(filename);
      if (filename === "index.js") return;
      const moduleName = path.basename(filename, ".js");
      const modulePath = `${commandsDir}/${filename}`;
      const commandModule = await import(modulePath);
      app.command(`/${moduleName}`, commandModule.default);
    })
  );
};

export { registerCommands };
