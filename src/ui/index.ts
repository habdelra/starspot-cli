import { inspect } from "util";
import * as chalk from "chalk";
import * as inquirer from "inquirer";
import * as wrap from "wordwrap";

import getWindowSize from "../utils/window-size";
import formatters from "./formatters";

let Confirm = (inquirer as any)["prompt"]["prompts"]["confirm"];
Confirm.prototype.getQuestion = function () {
  let message = " " + chalk.cyan(this.opt.message) + " ";

  // Append the default if available, and if question isn't answered
  if (this.opt.default != null && this.status !== "answered") {
    message += chalk.dim("(" + this.opt.default + ") ");
  }

  return message;
};

export type Category = "info" | "warn" | "error" | "prompt";

const COLORS: { [index: string]: [Function, Function]} = {
  info: [chalk.bgCyan.white, chalk.cyan],
  prompt: [chalk.bgCyan.white, chalk.cyan],
  error: [chalk.bgRed.white, chalk.red]
};

export interface ConstructorOptions {
  inputStream?: NodeJS.ReadableStream;
  outputStream?: NodeJS.WritableStream;
  errorStream?: NodeJS.WritableStream;
}

export default class UI {
  private logLevel = LogLevel.Info;
  private lastCategory: Category = null;

  private inputStream: NodeJS.ReadableStream;
  private outputStream: NodeJS.WritableStream;
  private errorStream: NodeJS.WritableStream;

  constructor(options: ConstructorOptions = {}) {
    this.inputStream = options.inputStream || process.stdin;
    this.outputStream = options.outputStream || process.stdout;
    this.errorStream = options.errorStream || process.stderr;
  }

  askOne(event: Event) {
    event.category = event.category || "prompt";

    let prelude: any;

    if (prelude = formatters["prompt"][`${event.name}-prelude`]) {
      let name = event.name;
      event.name = `${name}-prelude`;
      this._log(event);
      event.name = name;
    }

    let questions: inquirer.Question[] = [{
      type: "confirm",
      message: formatters["prompt"][event.name](event),
      name: "askOne"
    }];

    return inquirer.prompt(questions)
      .then((answers: inquirer.Answers) => {
        return answers["askOne"];
      });
  }

  info(event: Event) {
    if (this.logLevel > LogLevel.Info) { return; }

    event.category = "info";
    this._log(event);
  }

  warn(event: Event) {
    if (this.logLevel > LogLevel.Warn) { return; }

    event.category = "warn";
    this._log(event);
  }

  error(event: Event) {
    if (this.logLevel > LogLevel.Error) { return; }

    event.category = "error";
    this._log(event);
  }

  _log(event: Event) {
    let { category } = event;
    let [categoryColor, color] = COLORS[category];
    let formatter = formatters[category] && formatters[category][event.name];
    let message: string;

    let printCategory = false;

    if (category !== this.lastCategory) {
      console.log();
      printCategory = true;
    }

    this.lastCategory = category;

    if (formatter) {
      message = formatter(event);
    } else {
      message = inspect(event);
    }

    if (!message) { return; }

    let formattedCategory = printCategory ? categoryColor(` ${category.toUpperCase()} `) : "";
    message = pad(message, category.length + 3, printCategory);

    console.log(formattedCategory + color(message));
  }
}

function pad(str: string, categoryLength: number, printCategory: boolean): string {
  let { width } = getWindowSize();
  width -= categoryLength;

  let center = wrap(Math.max(width || 100));
  let centered = center(str);

  centered = centered.split("\n")
    .map(c => " ".repeat(categoryLength) + c)
    .join("\n");

  return printCategory ? " " + trimLeft(centered) : centered;
}

function trimLeft(message: string): string {
  return message.replace(/^\s+/, "");
}

export enum LogLevel {
  VeryVerbose,
  Verbose,
  Info,
  Warn,
  Error
}

export interface Event {
  name: string;
  category?: Category;
  logLevel?: LogLevel;
  [key: string]: any;
};