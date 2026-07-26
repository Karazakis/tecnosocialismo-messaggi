const AUTH_ORIGIN = process.env.AUTH_ORIGIN ?? "https://login.tecnosocialismo.com";

export async function proxyRequest(request: Request, path: string) {
  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  const contentType = request.headers.get("content-type");
  if (cookie) headers.set("cookie", cookie);
  if (contentType) headers.set("content-type", contentType);
  const method = request.method;
  const body = method === "GET" || method === "HEAD" ? undefined : await request.text();
  try {
    const upstream = await fetch(`${AUTH_ORIGIN}${path}`, { method, headers, body, cache: "no-store" });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json; charset=utf-8" },
    });
  } catch {
    return Response.json({ error: "Il servizio messaggi non è raggiungibile." }, { status: 503 });
  }
}
