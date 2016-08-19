import * as dns from "native-dns";

let server = dns.createServer();

server.on("request", function(req: any, res: any) {
  res.answer.push(dns.A({
    name: req.question[0].name,
    address: "127.0.0.1",
    ttl: 1
  }));

  res.send();
});

server.serve(8538);