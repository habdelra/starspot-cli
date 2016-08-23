import Command from "../command";

const defaultPort = process.env.PORT || 8000;

export default class ServerCommand extends Command {
  name = "serve";
  description = "Starts a development HTTPS server.";

  aliases = ["server", "s"];

  availableOptions = [
    { name: "port",                 type: Number,  default: defaultPort,   aliases: ["p"] },
    { name: "host",                 type: String,                          aliases: ["H"],     description: "Listens on all interfaces by default" },
    { name: "proxy",                type: String,                          aliases: ["pr", "pxy"] },
    { name: "secure-proxy",         type: Boolean, default: true,          aliases: ["spr"],   description: "Set to false to proxy self-signed SSL certificates" },
    { name: "transparent-proxy",    type: Boolean, default: true,          aliases: ["transp"], description: "Set to false to omit x-forwarded-* headers when proxying" },
    { name: "watcher",              type: String,  default: "events",      aliases: ["w"] },
    { name: "live-reload",          type: Boolean, default: true,          aliases: ["lr"] },
    { name: "live-reload-host",     type: String,                          aliases: ["lrh"],   description: "Defaults to host" },
    { name: "live-reload-base-url", type: String,                          aliases: ["lrbu"],  description: "Defaults to baseURL" },
    { name: "live-reload-port",     type: Number,                          aliases: ["lrp"],   description: "(Defaults to port number within [49152...65535])" },
    { name: "environment",          type: String,  default: "development", aliases: ["e", { "dev": "development" }, { "prod": "production" }] },
    { name: "output-path",          type: "Path",  default: "dist/",       aliases: ["op", "out"] },
    { name: "ssl",                  type: Boolean, default: false },
    { name: "ssl-key",              type: String,  default: "ssl/server.key" },
    { name: "ssl-cert",             type: String,  default: "ssl/server.crt" }
  ];

  async run() {
    let task = this.project.getTask("server");

    await task.invoke();
  }
}

// import "ts-node/register";
// import { red } from "chalk";

// let version = Number(process.version.match(/^v(\d+\.\d+)/)[1]);
// if (version < 6) {
//   console.log(red(`Starspot requires Node 6 or later. You are currently using Node ${process.version}`));
//   process.exit(1);
// }

// import { fork } from "mz/child_process";
// import Project from "../project";
// import HandledError from "../errors/handled-error";

// let project = new Project();
// let setup = project.getTask("setup");
// let startServer = project.getTask("server");

// setup.invoke()
//   .then(() => startServer.invoke())
//   .then((address) => {
//     project.ui.info({ name: "server-started", address });
//   })
//   .then(() => {
//     fork(__dirname + "/../dns");
//     project.ui.info({ name: "dns-started" });
//   })
//   .catch(e => {
//     if (!(e instanceof HandledError)) {
//       console.log(red(e.stack));
//     }
//   })