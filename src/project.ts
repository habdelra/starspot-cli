import { existsSync, readFileSync, readdirSync } from "fs";
import { dirname } from "path";
import UI from "./ui";
import { Application } from "starspot";
import Task from "./task";
import Command, { ConstructorOptions as CommandConstructorOptions } from "./command";

export interface TaskConstructor {
  new (options: any): Task<any>;
}

export interface CommandConstructor {
  new <T extends Command>(options: CommandConstructorOptions): T;
  command: string;
  aliases?: string[];
}

export interface ConstructorOptions {
  cwd?: string;
  ui?: UI;
  isProduction?: boolean;
}

export default class Project {
  cwd: string;
  rootPath: string;
  isProduction: boolean;
  pkg: any;
  name: string;
  ui: UI;
  private _application: Application;

  constructor(options: ConstructorOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.rootPath = this.findRootPath();
    this.isProduction = options.isProduction || process.env.NODE_ENV === "production";
    this.pkg = JSON.parse(readFileSync(this.rootPath + "/package.json").toString());
    this.name = this.pkg.name;
    this.ui = options.ui || new UI();
  }

  get appPath(): string {
    let path = this.isProduction ? "/dist/app" : "/app"
    return this.rootPath + path;
  }

  getTask<T>(taskName: string): Task<T> {
    let TaskClass: TaskConstructor = require(__dirname + `/tasks/${taskName}`).default;
    return new TaskClass({
      ui: this.ui,
      project: this
    });
  }

  get application(): Application {
    if (this._application) { return this._application; }

    let ApplicationClass = require(this.appPath + "/application").default;
    return this._application =new (ApplicationClass as any)({
      ui: this.ui,
      rootPath: this.appPath
    }) as Application;
  }

  get commands(): CommandConstructor[] {
    let commandList = readdirSync(__dirname + "/commands");
    return commandList
      .filter(path => path.substr(-3).match(/.js|.ts/))
      .map(path => {
        return require("./commands/" + path).default;
      });
  }

  /*
    Walks up from the current working directory, looking for a package.json file
    that indicates we're inside a Starspot project.
  */
  private findRootPath(): string {
    let curPath = this.cwd;
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
}