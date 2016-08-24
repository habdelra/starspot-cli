import Project from "./project";
import Environment from "./environment";
import UI from "./ui";

export interface Alias {
  [key: string]: string;
}

export interface CommandOptions {
  name: string;
  type: any;
  aliases?: (string | Alias)[];
  description?: string;
}

export interface ConstructorOptions {
  ui: UI;
  project?: Project;
  env?: Environment;
}

abstract class Command {
  public static command: string;
  public static aliases: string[];
  public static availableOptions: CommandOptions[];
  protected project: Project;
  protected ui: UI;
  protected env: Environment;

  constructor(options: ConstructorOptions) {
    this.ui = options.ui;
    this.project = options.project;
    this.env = options.env;
  }

  abstract async run(): Promise<any>;
}

export default Command;