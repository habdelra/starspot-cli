import Project from "./project";
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
  project?: Project;
  ui?: UI;
}

abstract class Command {
  public static command: string;
  public static aliases: string[];
  public static availableOptions: CommandOptions[];
  protected project: Project;
  protected ui: UI;

  constructor(options: ConstructorOptions = {}) {
    this.project = options.project;
    this.ui = options.ui;
  }

  abstract async run(): Promise<any>;
}

export default Command;