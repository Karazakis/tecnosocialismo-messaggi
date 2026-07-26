import { NextResponse } from "next/server";
import { getSuiteUser } from "@/lib/auth";
import { createConversation, listConversations, MessageError } from "@/lib/messages";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getSuiteUser(request.headers);
  if (!user) return NextResponse.json({ error: "Accesso richiesto." }, { status: 401 });
  try {
    return NextResponse.json({ conversations: await listConversations(user) });
  } catch (error) {
    console.error("Conversation list failed", error);
    return NextResponse.json({ error: "Il servizio messaggi non è ancora collegato allo spazio dati." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await getSuiteUser(request.headers);
  if (!user) return NextResponse.json({ error: "Accesso richiesto." }, { status: 401 });
  const payload = await request.json().catch(() => ({})) as { emails?: unknown; title?: unknown };
  const emails = Array.isArray(payload.emails) ? payload.emails.filter((item): item is string => typeof item === "string") : [];
  try {
    const conversationId = await createConversation(user, {
      emails,
      title: typeof payload.title === "string" ? payload.title : undefined,
    });
    return NextResponse.json({ conversationId }, { status: 201 });
  } catch (error) {
    if (error instanceof MessageError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Conversation create failed", error);
    return NextResponse.json({ error: "Non è stato possibile creare la conversazione." }, { status: 500 });
  }
}
