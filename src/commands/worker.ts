import Command from "../command";

export default class WorkerCommand extends Command {
  static command = "worker";
  static description = "Starts a development worker.";

  static aliases = ["work", "w"];

  static availableOptions = [
    { name: "watcher",              type: String,  default: "events",      aliases: ["w"] },
    { name: "environment",          type: String,  default: "development", aliases: ["e", { "dev": "development" }, { "prod": "production" }] },
    { name: "output-path",          type: "Path",  default: "dist/",       aliases: ["op", "out"] }
  ];

  async run(): Promise<void> {
    if (this.env.isDevelopment) {
      let setupTask = this.project.getTask("setup");
      await setupTask.invoke();
    }

    let workerTask = this.project.getTask("start-worker");

    await Promise.all<void>([workerTask.invoke()]);

    this.ui.info({ name: "worker-started" });
  }
}