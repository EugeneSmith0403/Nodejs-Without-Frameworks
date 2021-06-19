import { DiManager } from "./diManager";
import { App } from "./app";

export class Core {
  private diManager: DiManager = new DiManager().getInstance();
  constructor(...args: any[]) {
    this.init(args);
  }

  private init(dep: any[]) {
    this.diManager.set(dep);
    new App().createServer();
  }
}
