# nodejs-api-without-frameworks

## Rest api with nodejs and some libraries without popular frameworks.

This project consists route, di, mongodb, rabbitMq modules.
The main file is index.ts in the root of repository.
The base class is Core, which provides different services in constructor.

```
  const core = new Core(
    UserService,
    MetaDataService,
    Route,
    DbConnection
  );

```

## Route module consists based HTTP methods, and property with list of callback for appropriate method like a stack.

``` 
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
  ...
  
 public init(): void {
    try {
      this.executeFunctionsFromStack();
    } catch (e) {
      throw Error(`Route.init: ${e.message}`);
    }
  }
  
  }

```

## Dependenies

This directiry contains entities' classes for business logiс. Instance of this class impliments from base class **DiEntity**.

###### Example: 
```
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

```

###### DiEntity: 
Consists base logic for Http methods

```
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

  ...
  protected sendMessageToRabbitMq(action: string, data: any): void {}
}

```

## Getting Starting

```
npm i
npm run build
npm run start:dev or npm run start

```

## Before Starting

- You must install mongodb: https://docs.mongodb.com/guides/server/install
- Create database: https://docs.mongodb.com/manual/mongo/





