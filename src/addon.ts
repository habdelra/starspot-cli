import Command from "./command";

export default class Addon {
  public name: string;
  public commands: typeof Command[];
}