import { MessagingApp } from "@/app/messaging-app";
import { getSuiteUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getSuiteUser();
  return <MessagingApp user={user} />;
}
