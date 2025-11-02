import { auth } from "../../auth";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | null)?.role;
  if (!session?.user || role !== "ADMIN") {
    redirect("/");
  }
  return children as any;
}
