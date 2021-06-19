export interface IDiEntity {
  dependencies?: any;
  get: Function;
  post: Function;
  put: Function;
  delete: Function;
}
