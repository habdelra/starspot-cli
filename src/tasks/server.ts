import { Application } from "starspot";
import * as http2 from "http2";
import { readFile } from "mz/fs";
import Task from "../task";
import SSLNotFoundError from "../errors/ssl-not-found-error";
import { SSL_KEY_PATH, SSL_CERT_PATH, DNS_TLD } from "../config";

export interface ServerAddressInfo {
  address: string;
  port: number;
  family: string;
  url?: string;
}

export default class ServerTask extends Task<ServerAddressInfo> {
  async run(): Promise<ServerAddressInfo> {
    let app = await this.bootApp();

    let [key, cert] = await readSSLCerts();

    return new Promise<ServerAddressInfo>((resolve, reject) => {
      let server = http2.createServer({ key, cert }, (request, response) => {
        app.dispatch(request, response);
      });

      server.on("error", reject);

      server.on("listening", () => {
        let  info = server.address();

        resolve({
          address: info.address,
          port: info.port,
          family: info.family,
          url: urlForAddressInfo(info)
        });
      });

      server.listen(8000);
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
    if (e.code === "ENOENT") {
      throw new SSLNotFoundError({
        missingFile: e.path
      });
    }
  }
}

function urlForAddressInfo({ address, family, port }: ServerAddressInfo): string {
  if (family === "IPv6") {
    address = `[${address}]`;
  }

  return `https://${process.env.USER}.${DNS_TLD}:${port}`;
}