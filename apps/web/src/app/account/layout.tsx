import { auth } from "../../auth";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  return children as any;
}
