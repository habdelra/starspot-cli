#!/usr/bin/env node

import "ts-node/register";

import { red } from "chalk";
import { fork } from "mz/child_process";
import Project from "../project";
import SetupTask from "../tasks/setup";
import StartServerTask from "../tasks/server";
import HandledError from "../errors/handled-error";

let project = new Project();
let setup = project.getTask(SetupTask);
let startServer = project.getTask(StartServerTask);

setup.invoke()
  .then(() => startServer.invoke())
  .then((address) => {
    project.ui.info({ name: "server-started", address });
  })
  .then(() => {
    fork(__dirname + "/../dns");
    project.ui.info({ name: "dns-started" });
  })
  .catch(e => {
    if (!(e instanceof HandledError)) {
      console.log(red(e.stack));
    }
  });