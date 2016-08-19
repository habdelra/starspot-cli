import { existsSync, readFileSync } from "fs";
import { dirname } from "path";
import UI from "./ui";
import { Application } from "starspot";

export default class Project {
  rootPath: string;
  appPath: string;
  name: string;
  pkg: any;
  ui: UI;

  constructor() {
    this.ui = new UI();
    this.rootPath = findRootPath();
    this.appPath = this.rootPath + "/src/app";
    this.pkg = JSON.parse(readFileSync(this.rootPath + "/package.json").toString());
    this.name = this.pkg.name;
  }

  getTask<T>(TaskClass: { new (options: any): T }): T {
    return new TaskClass({
      ui: this.ui,
      project: this
    }) as T;
  }

  getApplication(): Application {
    let ApplicationClass = require(this.appPath + "/application").default;
    return new (ApplicationClass as any)({
      ui: this.ui,
      rootPath: this.appPath
    }) as Application;
  }
}

/*
  Walks up from the current working directory, looking for a package.json file
  that indicates we're inside a Starspot project.
*/
function findRootPath(): string {
  let curPath = process.cwd();
  let found = false;

  while (!found && curPath !== "/") {
    if (existsSync(curPath + "/package.json")) {
      found = true;
    } else {
      curPath = dirname(curPath);
    }
  }

  if (!found) { return null; }

  return curPath;
}