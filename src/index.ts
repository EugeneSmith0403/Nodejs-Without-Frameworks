import { from, of } from "rxjs";
import { delay, map, mergeMap, tap } from "rxjs/operators";
import { DbConnection } from "./mongodb";
import { Route } from "./route";
const http = require("http");
const config = require("dotenv").config();
import { Core } from "./core";
import { UserService, MetaDataService } from "./dependencies";

const core = new Core(
  UserService,
  MetaDataService,
  Route,
  DbConnection
);
