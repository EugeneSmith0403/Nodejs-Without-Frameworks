export class DiManager {
  private dependencies: Map<string, any>;
  private static diInstance: DiManager;

  constructor() {
    this.dependencies = new Map();
  }

  public getInstance() {
    if (!DiManager.diInstance) {
      DiManager.diInstance = new DiManager();
    }
    return DiManager.diInstance;
  }

  public set(dependency: any | any[]) {
    if (typeof dependency === "object") {
      if (Array.isArray(dependency)) {
        dependency.forEach((depClass) => {
          this.dependencies.set(depClass.name, new depClass());
        });
      } else {
        const name = dependency.name;
        this.dependencies.set(name, dependency);
      }
    }
  }

  public get() {
    return this.dependencies;
  }
}
