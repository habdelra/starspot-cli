import { CommandConstructor } from "./command";

export default class Addon {
  public name: string;
  public commands: CommandConstructor[];
}