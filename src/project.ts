import { existsSync, readFileSync, readdirSync } from "fs";
import { dirname } from "path";
import UI from "./ui";
import { Application } from "starspot";
import Task from "./tasks";
import Command from "./command";

const isProduction = process.env.NODE_ENV === "production";

export interface TaskConstructor {
  new (options: any): Task<any>;
}

export default class Project {
  rootPath: string;
  appPath: string;
  name: string;
  pkg: any;
  ui: UI;

  constructor() {
    this.ui = new UI();
    this.rootPath = findRootPath();
    this.appPath = this.rootPath + (isProduction ? "/dist/app" : "/app");
    this.pkg = JSON.parse(readFileSync(this.rootPath + "/package.json").toString());
    this.name = this.pkg.name;
  }

  getTask<T>(taskName: string): Task<T> {
    let TaskClass: TaskConstructor = require(__dirname + `/tasks/${taskName}`);
    return this.getTaskClass<T>(TaskClass);
  }

  getTaskClass<T>(TaskClass: TaskConstructor): Task<T> {
    return new TaskClass({
      ui: this.ui,
      project: this
    });
  }

  getApplication(): Application {
    let ApplicationClass = require(this.appPath + "/application").default;
    return new (ApplicationClass as any)({
      ui: this.ui,
      rootPath: this.appPath
    }) as Application;
  }

  get commands(): Command[] {
    let commandList = readdirSync(__dirname + "/commands");
    return commandList
      .filter(path => path.substr(-3) === ".js")
      .map(path => {
        let C = require("./commands/" + path).default;
        return new C();
      });
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