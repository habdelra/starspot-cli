import UI from "./ui";
import Project from "./project";
import HandledError from "./errors/handled-error";

export interface ConstructorOptions {
  ui: UI;
  project: Project;
}

abstract class Task {
  protected ui: UI;
  protected project: Project;

  constructor({ ui, project }: ConstructorOptions) {
    this.ui = ui;
    this.project = project;
  }

  protected abstract run<U>(): Promise<U>;

  public invoke<U>(): Promise<U> {
    return this.run<U>()
      .catch(e => {
        this.ui.error(e);
        throw new HandledError(e);
      });
  }
}

export default Task;