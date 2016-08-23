import Project from "./project";

abstract class Command {
  public name: string;
  public aliases: string[];
  protected project: Project;
  abstract async run(): Promise<any>;
}

export default Command;