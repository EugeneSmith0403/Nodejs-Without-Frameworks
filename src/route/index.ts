import { MethodsEnum } from "../enums";

export class Route {
  private stack = new Map();
  private _req: any;
  private res: any;

  public get(...args: (string | Function)[]): void {
    const obj = this.prepareArgs(args);
    this.addToStack(MethodsEnum.get, obj.path, obj.arCb);
  }

  public post(...args: (string | Function)[]): void {
    const obj = this.prepareArgs(args);
    this.addToStack(MethodsEnum.post, obj.path, obj.arCb);
  }

  public put(...args: (string | Function)[]): void {
    const obj = this.prepareArgs(args);
    this.addToStack(MethodsEnum.put, obj.path, obj.arCb);
  }

  public delete(...args: (string | Function)[]): void {
    const obj = this.prepareArgs(args);
    this.addToStack(MethodsEnum.delete, obj.path, obj.arCb);
  }

  public init(): void {
    try {
      this.executeFunctionsFromStack();
    } catch (e) {
      throw Error(`Route.init: ${e.message}`);
    }
  }

  public executeFunctionsFromStack(): void {
    let result = true;
    // @ts-ignore
    this.stack.forEach((cb, index) => {
      const ix = this.parseIndex(index);
      if (
        this._req.url === ix.path &&
        this._req.method === ix.method &&
        result !== false
      ) {
        result = cb(result);
      }
    });
  }

  private parseIndex(index: string): any {
    const splitted = index.split(" ");
    return {
      method: splitted[0],
      path: splitted[1],
      mapIndex: splitted[2],
    };
  }

  private prepareArgs(args: (string | Function)[]): {
    path: string;
    arCb: Function[];
  } {
    const obj: any = {
      path: "",
      arCb: [],
    };
    args.forEach((el: string | Function) => {
      typeof el === "string" ? (obj["path"] = el) : obj.arCb.push(el);
    });
    return obj;
  }

  private addToStack(
    method: string,
    path: string,
    arCb: Function[]
  ): undefined {
    if (!path) {
      console.error(`Route.addToStack for ${method} incorrect path!`);
      return;
    }
    const mapIndex = `${method} ${path}`;
    arCb.forEach((cb, index) => {
      this.stack.set(`${mapIndex} ${index}`, cb);
    });
  }

  public setRequestAndResponse(req: any, res: any): void {
    this._req = req;
    this.res = res;
  }

  public getResponse() {
    return this.res;
  }

  public getRequest() {
    return this._req;
  }
}
