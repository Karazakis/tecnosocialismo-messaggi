import { proxyRequest } from "@/lib/proxy";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return proxyRequest(request, "/api/messages/conversations");
}

export async function POST(request: Request) {
  return proxyRequest(request, "/api/messages/conversations");
}
