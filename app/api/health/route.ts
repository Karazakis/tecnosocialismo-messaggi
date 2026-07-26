import { proxyRequest } from "@/lib/proxy";

export async function GET(request: Request) {
  return proxyRequest(request, "/api/messages/health");
}
