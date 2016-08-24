import { expect } from "chai";
import Project from "../src/project";
import { ServerAddressInfo } from "../src/tasks/server";
import * as rp from "request-promise";

describe("ServerTask", function() {

  ["http", "https"].forEach(protocol => {

    describe(`over ${protocol.toUpperCase()}`, function() {
      let project = new Project({
        cwd: __dirname + `/fixtures/${protocol}-server-project`
      });

      it("starts a server on port 8000 by default", async function() {
        let task = project.getTask("server");
        let info = await task.invoke<ServerAddressInfo>();

        try {
          let body = await rp(`${protocol}://localhost:8000`, {
            agentOptions: {
              rejectUnauthorized: false
            }
          });
          expect(body).to.equal("Hello world");
        } finally {
          await cleanup(info);
        }

      });

      it("starts a server on port specified by PORT environment variable", async function() {
        let oldPort = process.env.PORT;

        try {
          process.env.PORT = 43294;
          let task = project.getTask("server");
          let info = await task.invoke<ServerAddressInfo>();

          try {
            let body = await rp(`${protocol}://localhost:43294`, {
              agentOptions: {
                rejectUnauthorized: false
              }
            });
            expect(body).to.equal("Hello world");
          } finally {
            await cleanup(info);
          }
        } finally {
          if (oldPort) {
            process.env.PORT = oldPort;
          } else {
            delete process.env.PORT;
          }
        }
      });
    });

  });

});

function cleanup(info: ServerAddressInfo): Promise<any> {
  return new Promise((resolve, reject) => {
    info.server.close();
    info.server.on("close", resolve);
    info.server.on("error", reject);
  });
}