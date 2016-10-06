import * as dotenv from "dotenv";
import * as chokidar from "chokidar";

import { Application, Container } from "starspot";
import Task from "../task";

export default class WorkerTask extends Task {
  protected async run(): Promise<void> {
    dotenv.config({
      path: this.project.rootPath + "/.env",
      silent: true
    });

    let app = await this.bootApp();

    this.startWatcher(app.container);
 
    return Promise.resolve();
  }
  
  async bootApp(): Promise<Application> {
    let app = this.project.application();

    await app.boot();

    return app;
  }

  startWatcher(container: Container) {
    chokidar.watch(this.project.rootPath + "/app", {
      ignored: /[\/\\]\./,
      ignoreInitial: true
    }).on("all", (_: string, path: string) => {
      container.fileDidChange(path);
    });
  }
}