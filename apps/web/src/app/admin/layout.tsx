import { auth } from "../../auth";
import { redirect } from "next/navigation";
import { getDictionary, negotiateLocale } from "@/lib/i18n/i18n";
import { AdminAppChrome } from "@/components/admin/AdminAppChrome";

export const runtime = "nodejs";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const role = (session?.user as { role?: string } | null)?.role;

  if (session?.user && role !== "ADMIN") {
    redirect("/");
  }

  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);

  return (
    <AdminAppChrome
      lang={lang}
      dict={dict}
      user={{
        name: session?.user?.name ?? null,
        email: session?.user?.email ?? null,
      }}
    >
      {children}
    </AdminAppChrome>
  );
}
