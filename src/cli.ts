import UI from "./ui";
import Project from "./project";
import Environment from "./environment";
import Command from "./command";
import HandledError from "./errors/handled-error";

export interface CLIOptions {
  /** Stream to read input from. Defaults to stdin. */
  inputStream?: NodeJS.ReadableStream;
  /** Stream to write output to. Defaults to stdout. */
  outputStream?: NodeJS.WritableStream;
  /** Stream to write error output to. Defaults to stderr. */
  errorStream?: NodeJS.WritableStream;
  /** Command line arguments. */
  argv?: string[];
  project?: Project;
  env?: Environment;
}

export default class CLI {
  private argv: string[];
  private ui: UI;
  private project: Project;
  private env: Environment;

  constructor(options: CLIOptions = {}) {
    this.ui = new UI({
      inputStream: options.inputStream,
      outputStream: options.outputStream,
      errorStream: options.errorStream
    });

    this.argv = options.argv || process.argv.slice(2);
    this.project = options.project || new Project();
    this.env = options.env || new Environment();

    if (this.project.isTypeScript) {
      require("ts-node/register");
    }
  }

  async run(): Promise<any> {
    let commandName = this.argv.shift() || "server";
    // let commandArgs = this.argv;

    let command = this.findCommand(commandName);

    if (command) {
      try {
        return command.run();
      } catch (e) {
        if (!(e instanceof HandledError)) {
          this.ui.error(e);
        }
      }
    } else {
      this.ui.error({
        name: "no-such-command",
        command: commandName
      });
    }
  }

  private findCommand(commandName: string): Command {
    let CurrentCommand = this.project.commands.find(candidate => {
      return candidate.command === commandName ||
        (candidate.aliases && candidate.aliases.indexOf(commandName) > -1);
    });

    if (!CurrentCommand) { return null; }

    return new CurrentCommand({
      ui: this.ui,
      project: this.project,
      env: this.env
    });
  }
}