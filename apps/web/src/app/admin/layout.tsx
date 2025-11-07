import { auth } from "../../auth";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function AdminLayout({ 
  children 
}: { 
  children: React.ReactNode;
}) {
  // Note: We can't easily detect the current pathname in a layout,
  // but auth pages handle their own access control.
  // The auth pages check if user is already admin and redirect.
  // For non-auth admin pages, we enforce admin role here.
  
  // Check if this is an auth route by trying to access it
  // Since layouts apply to all child routes, we need a different approach.
  // The auth pages themselves handle redirects for already-authenticated admins.
  
  // For now, we'll allow the layout to pass through and let individual pages handle auth.
  // But we still want to protect non-auth admin routes.
  
  // Actually, the cleanest solution: check session, but allow through if no session
  // (auth pages will handle their own logic)
  const session = await auth();
  const role = (session?.user as { role?: string } | null)?.role;
  
  // If user is authenticated but not admin, redirect (except auth pages handle this themselves)
  // If user is not authenticated, let them through (they might be going to auth pages)
  // Individual admin pages will check for admin role
  if (session?.user && role !== "ADMIN") {
    redirect("/");
  }
  
  return children as any;
}
