import { IDiEntity } from "../interfaces";
import { DiManager } from "../core";
import { Route } from "../route";
import { DbConnection } from "../mongodb";
import { catchError, mergeMap } from "rxjs/operators";
import { from } from "rxjs";
import { capitalize } from "../helpers";

export abstract class DiEntity implements IDiEntity {
  public dependencies = new DiManager().getInstance().get();
  public collectionName = "";
  public queueName = "";
  protected entityName = "";

  public get(): any[] {
    const url = this.createPath("/", this.entityName);
    const middlewares = this.middlewareForGetAction() || [];
    return [...middlewares, url, this.receiveAllBaseHandlerForGetAction()];
  }
  protected middlewareForGetAction(): Function[] {
    return [];
  }
  public receiveAllBaseHandlerForGetAction() {
    return (args?: any) => {
      const res = (this.dependencies.get("Route") as Route).getResponse();
      const client = this.dependencies.get("DbConnection") as DbConnection;
      const sub = client
        .getConnectionObservable()
        .pipe(
          mergeMap((obj: any) => {
            return from(
              obj.db.collection(this.collectionName).find().toArray()
            );
          }),
          catchError((e) => {
            throw Error(
              `DiEntity.receiveAllBaseHandlerForGetAction ${e.message}`
            );
          })
        )
        .subscribe((obj: any) => {
          const result = obj.map((i: any) => {
            const { metaData, ...mappedRes } = i;
            return mappedRes;
          });
          res.end(JSON.stringify(obj));
          sub.unsubscribe();
        });
    };
  }

  public post() {
    const url = this.createPath("/", this.entityName);
    const middlewares = this.middlewareForPostAction() || [];
    return [...middlewares, url, this.postingBaseHandler()];
  }
  protected postingBaseHandler() {
    return (args?: any) => {
      const res = (this.dependencies.get("Route") as Route).getResponse();
      const req = (this.dependencies.get("Route") as Route).getRequest();
      const body = JSON.parse(req.body);
      const client = this.dependencies.get("DbConnection") as DbConnection;
      const sub = client
        .getConnectionObservable()
        .pipe(
          mergeMap((connection: any) => {
            return from(
              connection.db.collection(this.collectionName).insertOne(body)
            );
          }),
          catchError((e) => {
            throw Error(`DiEntity.postingBaseHandler ${e.message}`);
          })
        )
        .subscribe((result: any) => {
          res.end(JSON.stringify(result));
          this.sendMessageToRabbitMq("create", result.ops);
          sub.unsubscribe();
        });
    };
  }
  protected middlewareForPostAction(): Function[] {
    return [];
  }

  public delete() {
    const url = this.createPath("/:id", this.entityName);
    const middlewares = this.middlewareForDeleteAction() || [];
    return [...middlewares, url, this.removeBaseHandler()];
  }
  protected removeBaseHandler() {
    return (args?: any) => {
      const res = (this.dependencies.get("Route") as Route).getResponse();
      const req = (this.dependencies.get("Route") as Route).getRequest();
      const id = req.url.replace("/user/", "");
      const client = this.dependencies.get("DbConnection") as DbConnection;
      const sub = client
        .getConnectionObservable()
        .pipe(
          mergeMap((connection: any) => {
            return from(
              connection.db
                .collection(this.collectionName)
                .remove({ _id: DbConnection.prepareId(id) })
            );
          }),
          catchError((e) => {
            throw Error(`DiEntity.removeBaseHandler ${e.message}`);
          })
        )
        .subscribe(({ result }: any) => {
          res.end(JSON.stringify(result.ops));
          this.sendMessageToRabbitMq("remove", { id: result.ops._id });
          sub.unsubscribe();
        });
    };
  }
  protected middlewareForDeleteAction(): Function[] {
    return [];
  }

  public put() {
    const url = this.createPath("/", this.entityName);
    const middlewares = this.middlewareForPutAction() || [];
    return [...middlewares, url, this.updateBaseHandler()];
  }
  protected updateBaseHandler() {
    return (args?: any) => {
      const res = (this.dependencies.get("Route") as Route).getResponse();
      const req = (this.dependencies.get("Route") as Route).getRequest();
      const body = JSON.parse(req.body);
      const { id, ...updated } = body;
      const client = this.dependencies.get("DbConnection") as DbConnection;
      const sub = client
        .getConnectionObservable()
        .pipe(
          mergeMap((connection: any) => {
            return from(
              connection.db
                .collection(this.collectionName)
                .findOneAndUpdate(
                  { _id: DbConnection.prepareId(body.id) },
                  { $set: updated },
                  { returnOriginal: false }
                )
            ).pipe(
              catchError((e) => {
                throw Error(`DiEntity.updateBaseHandler ${e.message}`);
              })
            );
          })
        )
        .subscribe((result: any) => {
          res.end(JSON.stringify(result));
          this.sendMessageToRabbitMq("update", result);
          sub.unsubscribe();
        });
    };
  }
  protected middlewareForPutAction(): Function[] {
    return [];
  }

  public createPath(path: string, name: string) {
    const action = capitalize(name.split("Service")[0] || "");
    if (path === "/") {
      return `/${action}`;
    }

    if (~path.indexOf(":")) {
      const url = (this.dependencies.get("Route") as Route).getRequest().url;
      const number = url.split("/")[2];
      if (number) {
        return `/${action}/${number}`;
      }
    }
    return `/${action}${path}`;
  }

  protected sendMessageToRabbitMq(action: string, data: any): void {}
}
