import { proxyRequest } from "@/lib/proxy";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyRequest(request, `/api/messages/conversations/${encodeURIComponent(id)}/read`);
}
