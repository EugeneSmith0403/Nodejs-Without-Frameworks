import { DiEntity } from "../classes";
import { IDiEntity } from "../interfaces";
import { Route } from "../route";
import { DbConnection } from "../mongodb";
import { catchError, mergeMap } from "rxjs/operators";
import { from } from "rxjs";
import { RabbitMq } from "../rabbitMQ";
import { UserService } from "./user.service";

export class MetaDataService extends DiEntity implements IDiEntity {
  public collectionName = "metaData";
  public queueName = "metaData";
  protected entityName = MetaDataService.name;
  constructor() {
    super();
  }

  public postLinkToUser(): any[] {
    const url = this.createPath("/linkToUser", this.entityName);
    return [url, this.postingLinkToUserHandler()];
  }

  public postingLinkToUserHandler() {
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
            ).pipe(
              mergeMap(({ ops: [item] }: any) => {
                return from(
                  connection.db
                    .collection(
                      (this.dependencies.get("UserService") as UserService)
                        .collectionName
                    )

                    .findOneAndUpdate(
                      { _id: DbConnection.prepareId(body.userId) },
                      { $set: { metaData: [item._id] } },
                      { returnOriginal: false }
                    )
                );
              }),
              catchError((e) => {
                throw new Error(
                  `MetaDataService.postingLinkToUserHandler: ${e.message}`
                );
              })
            );
          })
        )
        .subscribe((result: any) => {
          res.end(JSON.stringify(result));
          this.sendMessageToRabbitMq("create", result);
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
