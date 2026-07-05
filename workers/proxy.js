addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const url = new URL(request.url);
  url.hostname = "api.luno.com";

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("origin");
  headers.delete("referer");

  const body =
    request.method !== "GET" && request.method !== "HEAD"
      ? await request.arrayBuffer()
      : null;

  const resp = await fetch(url, {
    method: request.method,
    headers,
    body,
  });

  const out = new Response(resp.body, resp);
  out.headers.set("Access-Control-Allow-Origin", "*");
  out.headers.set("Access-Control-Expose-Headers", "*");

  return out;
}
