import { DiManager } from "./diManager";
import { delay } from "rxjs/operators";
import { of } from "rxjs";
import { Route } from "../route";
import { DiEntity } from "../classes";
import { MethodsEnum } from "../enums";

const http = require("http");
const hostname = process.env.hostname;
const port = process.env.port;

const DELAY = 3000;
const STATUS_CODE_500 = 500;

export class App {
  private dependencies = new DiManager().getInstance().get();
  private methodList: string[] = [
    MethodsEnum.get,
    MethodsEnum.post,
    MethodsEnum.put,
    MethodsEnum.delete,
  ];

  public createServer() {
    http
      .createServer(
        (
          req: any,
          res: {
            statusCode: number;
            setHeader: (arg0: string, arg1: string) => void;
            end: (arg0: string) => void;
          }
        ) => {
          (this.dependencies.get("Route") as Route).setRequestAndResponse(
            req,
            res
          );

          let body: any[] = [];
          req
            .on("error", (err: any) => {
              console.error(err);
            })
            .on("data", (chunk: any) => {
              body.push(chunk);
            })
            .on("end", () => {
              req.body = Buffer.concat(body).toString();
              this.bindEntityToRoute();
              (this.dependencies.get("Route") as Route).init();

              of(true)
                .pipe(delay(DELAY))
                .subscribe(() => {
                  res.statusCode = STATUS_CODE_500;
                  res.end("Somethings went wrong!");
                });
            });
        }
      )
      .listen(port, hostname, () => {
        console.log(`Server running at http://${hostname}:${port}/`);
      })
  }

  private bindEntity() {
    this.dependencies.forEach((depClass, key) => {
      if (depClass instanceof DiEntity) {
        this.searchMethodName(depClass);
      }
    });
  }

  private bindEntityToRoute() {
    try {
      this.bindEntity();
    } catch (e) {
      throw new Error(`App.bindEntityToRoute: ${e.message}`);
    }
  }

  private searchMethodName(depClass: any) {
    const route = this.dependencies.get("Route") as Route;
    this.mapMethods(depClass).forEach((item) => {
      const methodName = this.getMethodName(item);
      if (methodName) {
        //@ts-ignore
        route[methodName](...depClass[item]());
      }
    });
  }

  private getMethodName(item: any): string {
    const methodName = (item || "").split(/(?=[A-Z])/)[0].toUpperCase();
    if (~this.methodList.indexOf(methodName)) {
      return methodName.toLowerCase();
    }
    return "";
  }

  private mapMethods(depClass: any): string[] {
    const methodsChildClass = Object.getOwnPropertyNames(
      Object.getPrototypeOf(depClass)
    );
    // @ts-ignore
    return Array.from(
      new Set<string>([
        ...this.methodList.map((method: string) => method.toLowerCase()),
        ...methodsChildClass,
      ])
    );
  }
}
