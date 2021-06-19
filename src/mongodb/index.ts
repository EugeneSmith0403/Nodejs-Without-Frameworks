import { Observable } from "rxjs";
const mongo = require("mongodb");
const MongoClient = mongo.MongoClient;
const assert = require("assert");
const config = require("dotenv").config();

export class DbConnection {
  private dbName = process.env.mongo_db_name;
  private static url = process.env.mongo_db_url;
  private static client: DbConnection;
  private db: any = null;
  constructor() {
    DbConnection.createClient();
  }
  public static createClient(): any {
    if (!DbConnection.client) {
      DbConnection.client = new MongoClient(this.url);
    }
    return DbConnection.client;
  }
  public connect(cb: Function): void {
    DbConnection.createClient().connect((err: Error) => {
      assert.equal(null, err);
      console.log("Connected successfully to server");
      cb();
    });
  }

  public getConnectionObservable() {
    return new Observable((subscriber) => {
      DbConnection.createClient().connect((err: Error) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const result = {
          db: DbConnection.client.db(this.dbName),
          close: () => DbConnection.client.close(),
        };
        subscriber.next(result);
      });
    });
  }

  public getDbInstance(): any {
    return this.db;
  }

  public close(): void {
    DbConnection.client.close();
  }

  public static prepareId(id: string) {
    if (mongo.ObjectID.isValid(id)) {
      return mongo.ObjectID(id);
    }
    return id;
  }
}
