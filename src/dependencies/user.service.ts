import { DiEntity } from "../classes";
import { Route } from "../route";
import { DbConnection } from "../mongodb";
import { catchError, mergeMap } from "rxjs/operators";
import { from } from "rxjs";
import { IDiEntity } from "../interfaces";
import { RabbitMq } from "../rabbitMQ";

export class UserService extends DiEntity implements IDiEntity {
  public collectionName = 'users';
  public queueName = "users";
  protected entityName = UserService.name;
  constructor() {
    super();
  }

  public middlewareForGetAction() {
    return [this.middleware.bind(this), this.middleware2.bind(this)];
  }

  private middleware() {
    console.log("middleware1");
  }

  private middleware2(res: any) {
    console.log("middleware2");
  }

  public getOne() {
    const url = this.createPath("/:id", this.entityName);
    return [url, this.receiveOneHandler()];
  }

  public receiveOneHandler() {
    return (args?: any) => {
      const res = (this.dependencies.get("Route") as Route).getResponse();
      const req = (this.dependencies.get("Route") as Route).getRequest();
      const client = this.dependencies.get("DbConnection") as DbConnection;
      const id = req.url.replace("/user/", "");
      const sub = client
        .getConnectionObservable()
        .pipe(
          mergeMap((obj: any) => {
            return from(obj.db.collection("users")
              .findOne({ _id: DbConnection.prepareId(id) }));
          }),
          catchError((e) => {
            throw new Error(`UserService.receiveOneHandler: ${e.message}`)
          })
        )
        .subscribe((obj: any) => {
          res.end(JSON.stringify(obj));
          sub.unsubscribe();
        });
    };
  }

  protected sendMessageToRabbitMq(action: string, data: any): void {
    if (this.queueName) {
      const msg = JSON.stringify({
        action,
        data,
      });
      RabbitMq.sendMessageToQueue(this.queueName, msg);
    }
  }
}
