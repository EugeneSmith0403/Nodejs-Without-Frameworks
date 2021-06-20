import { DbConnection } from "./mongodb";
import { Route } from "./route";
import { Core } from "./core";
import { UserService, MetaDataService } from "./dependencies";

const core = new Core(
  UserService,
  MetaDataService,
  Route,
  DbConnection
);
