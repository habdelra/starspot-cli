import { existsSync, readFileSync, readdirSync } from "fs";
import { dirname, relative } from "path";

import { Application } from "starspot";

import UI from "./ui";
import Task from "./task";
import Addon from "./addon";
import Environment from "./environment";
import { CommandConstructor } from "./command";

export interface TaskConstructor {
  new (options: any): Task;
}

export interface ConstructorOptions {
  cwd?: string;
  ui?: UI;
  isProduction?: boolean;
  env?: Environment;
}

type AddonPkg = [string, any];

export default class Project {
  cwd: string;
  rootPath: string;
  env: Environment;
  pkg: any;
  name: string;
  ui: UI;
  private _application: Application;

  constructor(options: ConstructorOptions = {}) {
    this.cwd = options.cwd || process.cwd();

    this.env = options.env || new Environment();
    this.ui = options.ui || new UI();

    this.rootPath = this.findRootPath();

    this.pkg = JSON.parse(readFileSync(this.rootPath + "/package.json").toString());
    this.name = this.pkg.name;
  }

  get appPath(): string {
    let path = this.env.isProduction ? "/dist/app" : "/app";
    return this.rootPath + path;
  }

  get addonsPath(): string {
    let path = this.env.isProduction ? "/dist/addons" : "/addons";
    return this.rootPath + path;
  }

  getTask(taskName: string): Task {
    let TaskClass: TaskConstructor = require(__dirname + `/tasks/${taskName}`).default;
    return new TaskClass({
      ui: this.ui,
      project: this
    });
  }

  application(options?: any): Application {
    if (this._application) { return this._application; }

    let ApplicationClass: { new(options: any): Application };

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

    let applicationOptions = defaults(options, {
      ui: this.ui,
      rootPath: this.appPath
    });

    return this._application = new ApplicationClass(applicationOptions);
  }

  get commands(): CommandConstructor[] {
    return this.builtInCommands.concat(this.addonCommands);
  }

  get addons(): Addon[] {
    let ui = this.ui;
    let addonsPath = this.addonsPath;
    let potentialAddons: string[];

    try {
      potentialAddons = readdirSync(addonsPath);
    } catch (e) {
      if (e.code === "ENOENT") {
        return [];
      }

      throw e;
    }

    // Loop through the directories in /addons, trying to read a package.json
    // file. We filter out any directories that don't have a package.json or
    // don't include "starspot-addon" in their keywords, but emit a warning that
    // they are not being used.
    return potentialAddons
      .map(addonPath => readAddonPkg(addonsPath, addonPath, ui))
      .filter(addon => isAddonPkg(addon, ui))
      .map(addon => loadAddon(addonsPath, addon));
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

  get builtInCommands(): CommandConstructor[] {
    let commandList = readdirSync(__dirname + "/commands");
    return commandList
      .filter(path => isJSOrTS(path))
      .map(path => {
        return require("./commands/" + path).default;
      });
  }

  get addonCommands(): CommandConstructor[] {
    let commands: CommandConstructor[] = [];

    this.addons.forEach(addon => {
      if (!addon.commands) { return; }
      commands = commands.concat(addon.commands);
    });

    return commands;
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

// Try to read an addon's package.json. If the file can't be found or
// read, emit a warning but don't crash the boot.
function readAddonPkg(addonsPath: string, addonPath: string, ui: UI): AddonPkg {
  let pkgPath = `${addonsPath}/${addonPath}/package.json`;

  try {
    let file = readFileSync(pkgPath, "utf8");
    return [addonPath, JSON.parse(file)];
  } catch (e) {
    if (e.code === "ENOENT") {
      ui.warn({
        name: "addon-no-package-json",
        addon: addonPath
      });

      return [addonPath, null];
    } else if (e instanceof SyntaxError) {
      ui.warn({
        name: "addon-malformed-package-json",
        addon: addonPath
      });

      return [addonPath, null];
    }

    // If this isn't an error we can handle, rethrow it.
    throw e;
  }
}

function isAddonPkg([addonPath, pkg]: AddonPkg,  ui: UI): boolean {
   if (pkg && pkg.keywords && pkg.keywords.includes("starspot-addon")) {
     return true;
   }

   ui.warn({
     name: "addon-not-really-an-addon",
     addon: addonPath
   });

   return false;
}

function loadAddon(addonsPath: string, [addonPath, pkg]: AddonPkg) {
  let AddonClass = require(`${addonsPath}/${addonPath}`).default;

  if (!AddonClass || !(AddonClass.prototype instanceof Addon)) {
    throw new Error(`In-app addon ${addonPath} did not export a subclass of Addon as its default export.`);
  }

  let addon = new AddonClass();
  addon.name = pkg.name;

  return addon;
}

function defaults(options: any, defaults: any) {
  if (!options) { return defaults; }

  let result: any = {};

  for (let key in defaults) {
    result[key] = defaults[key];
  }

  for (let key in options) {
    result[key] = options[key];
  }

  return result;
}