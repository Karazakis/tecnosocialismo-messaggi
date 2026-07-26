import { proxyRequest } from "@/lib/proxy";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyRequest(request, `/api/messages/conversations/${encodeURIComponent(id)}/messages`);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyRequest(request, `/api/messages/conversations/${encodeURIComponent(id)}/messages`);
}
