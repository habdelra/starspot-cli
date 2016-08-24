import { existsSync, readFileSync, readdirSync } from "fs";
import { dirname, relative } from "path";
import UI from "./ui";
import { Application } from "starspot";
import Task from "./task";
import Command, { ConstructorOptions as CommandConstructorOptions } from "./command";

export interface TaskConstructor {
  new (options: any): Task;
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
    let path = this.isProduction ? "/dist/app" : "/app";
    return this.rootPath + path;
  }

  getTask(taskName: string): Task {
    let TaskClass: TaskConstructor = require(__dirname + `/tasks/${taskName}`).default;
    return new TaskClass({
      ui: this.ui,
      project: this
    });
  }

  get application(): Application {
    if (this._application) { return this._application; }

    let ApplicationClass: any;
    let applicationPath = this.appPath + "/application";
    let relativePath = relative(this.cwd, applicationPath);
    let fileExtension = this.fileExtension;

    try {
      ApplicationClass = require(applicationPath).default;
    } catch (e) {
      throw new Error(`Starspot couldn't find an Application class to instantiate. Create a new file at ${relativePath}.${fileExtension} and make sure it exports a subclass of Application as its default export.`);
    }

    if (!ApplicationClass) {
      throw new Error(`Starspot loaded your ${relativePath}.${fileExtension} file but it doesn't have a default export. Make sure you export a subclass of Application as the default export.`);
    }

    return this._application = new (ApplicationClass as any)({
      ui: this.ui,
      rootPath: this.appPath
    }) as Application;
  }

  get commands(): CommandConstructor[] {
    let commandList = readdirSync(__dirname + "/commands");
    return commandList
      .filter(path => isJSOrTS(path))
      .map(path => {
        return require("./commands/" + path).default;
      });
  }

  public get isTypeScript(): boolean {
    let pkg = this.pkg;
    let deps = pkg.dependencies || {};
    let devDeps = pkg.devDependencies || {};

    return !!(deps["typescript"] || devDeps["typescript"]);
  }

  private get fileExtension(): string {
    return this.isTypeScript ? "ts" : "js";
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

function isJSOrTS(path: string): boolean {
  let extension = path.substr(-3);

  if (extension === ".js") { return true; }
  if (extension === ".ts") {
    return path.substr(-5) !== ".d.ts";
  }
}