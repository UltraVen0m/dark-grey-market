import http from "node:http";
const messages = new Map();
let fail = false;
http.createServer(async (request, response) => {
  if (request.method === "GET") {
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify([...messages.values()]));
    return;
  }
  if (request.url === "/fail") { fail = true; response.end(); return; }
  if (request.url === "/recover") { fail = false; response.end(); return; }
  if (fail) { response.writeHead(503); response.end(); return; }
  let body = "";
  for await (const chunk of request) body += chunk;
  messages.set(request.headers["idempotency-key"], JSON.parse(body));
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify({ id: request.headers["idempotency-key"] }));
}).listen(3101, "127.0.0.1");
