import * as dotenv from "dotenv";
import { Application } from "starspot";
import * as http from "http";
import * as http2 from "http2";
import { readFile } from "mz/fs";
import Task from ".";
// import SSLNotFoundError from "../errors/ssl-not-found-error";
import { SSL_KEY_PATH, SSL_CERT_PATH, DNS_TLD } from "../config";

export interface ServerAddressInfo {
  address: string;
  port: number;
  family: string;
  url?: string;
}

export default class ServerTask extends Task<ServerAddressInfo> {
  async run(): Promise<ServerAddressInfo> {
    dotenv.config({
      path: this.project.rootPath + "/.env",
      silent: true
    });

    let app = await this.bootApp();

    let [key, cert] = await readSSLCerts();

    return new Promise<ServerAddressInfo>((resolve, reject) => {
      interface Server {
        on(eventName: string, callback: any): void;
        address(): ServerAddressInfo;
        listen(port: number): void;
      };

      let server: Server;
      let protocol: string;

      if (key && cert) {
        server = http2.createServer({ key, cert }, (request, response) => {
          app.dispatch(request, response) as any as Server;
        });
        protocol = "https";
      } else {
        server = http.createServer((request, response) => {
          app.dispatch(request as any as Application.Request, response);
        }) as any as Server;
        protocol = "http";
      }

      server.on("error", reject);

      server.on("listening", () => {
        let  info = server.address();

        resolve({
          address: info.address,
          port: info.port,
          family: info.family,
          url: urlForAddressInfo(info, protocol)
        });
      });

      server.listen(process.env.PORT || 8000);
    });
  }

  async bootApp(): Promise<Application> {
    let app = this.project.getApplication();
    await app.boot();

    return app;
  }
}

async function readSSLCerts(): Promise<[Buffer, Buffer]> {
  try {
    return await Promise.all<Buffer, Buffer>([
      readFile(SSL_KEY_PATH),
      readFile(SSL_CERT_PATH)
    ]);
  } catch (e) {
    return [null, null];
    // if (e.code === "ENOENT") {
    //   throw new SSLNotFoundError({
    //     missingFile: e.path
    //   });
    // }
  }
}

function urlForAddressInfo({ address, family, port }: ServerAddressInfo, protocol: string): string {
  if (family === "IPv6") {
    address = `[${address}]`;
  }

  return `${protocol}://${process.env.USER}.${DNS_TLD}:${port}`;
}