import { expect } from "chai";
import Project from "../src/project";
import Task from "../src/task";
import Command from "../src/command";
import UI from "../src/ui";

describe("Project", function() {
  let basicProjectFixture = __dirname + "/fixtures/basic-project/foo/bar";

  it("can be instantiated", function() {
    let project = new Project();
    expect(project).to.exist;
  });

  it("finds project if cwd is deeply nested", function() {
    let project = new Project({
      cwd: basicProjectFixture
    });

    expect(project.rootPath).to.equal(__dirname + "/fixtures/basic-project");
    expect(project.appPath).to.equal(__dirname + "/fixtures/basic-project/app");
  });

  it("uses the precompiled dist directory in production", function() {
    let oldEnv = process.env.NODE_ENV;

    try {
      process.env.NODE_ENV = "production";

      let project = new Project({
        cwd: basicProjectFixture
      });

      expect(project.rootPath).to.equal(__dirname + "/fixtures/basic-project");
      expect(project.appPath).to.equal(__dirname + "/fixtures/basic-project/dist/app");
    } finally {
      process.env.NODE_ENV = oldEnv;
    }
  });

  it("reads the project's package.json and exposes it as pkg", function() {
    let project = new Project({
      cwd: basicProjectFixture
    });

    expect(project.pkg).to.deep.equal({
      name: "basic-project",
      version: "1.0.0"
    });
  });

  it("reads the project's name from package.json", function() {
    let project = new Project({
      cwd: basicProjectFixture
    });

    expect(project.name).to.equal("basic-project");
  });

  it("instantiates named tasks", function() {
    let project = new Project({
      cwd: basicProjectFixture
    });

    let task = project.getTask("server");

    expect(task).to.be.an.instanceof(Task);
    expect(task.constructor.name).to.equal("ServerTask");
  });

  it("instantiates the application with UI and rootPath", function() {
    let project = new Project({
      ui: new UI(),
      cwd: basicProjectFixture
    });

    // Fixtures contain a stub application that is just a constructor function
    // that assigns passed options as properties.
    let app: any = project.application;
    expect(app.ui).to.be.an.instanceof(UI);
    expect(app.rootPath).to.be.equal(__dirname + "/fixtures/basic-project/app");
  });

  it("returns a list of available Command classes", function() {
    let project = new Project({
      cwd: basicProjectFixture
    });

    let commands = project.commands;

    commands.forEach(command => {
      expect(command.prototype).to.be.an.instanceof(Command);
    });

    expect(commands.length).to.equal(1);
  });
});