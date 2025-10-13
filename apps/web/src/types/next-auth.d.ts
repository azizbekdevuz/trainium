// apps/web/src/types/next-auth.d.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    // Keep optional to avoid churn in places using `session.user?`
    user?: DefaultSession["user"] & {
      id: string;
      role?: "ADMIN" | "STAFF" | "CUSTOMER";
    };
  }

  interface User {
    role?: "ADMIN" | "STAFF" | "CUSTOMER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "ADMIN" | "STAFF" | "CUSTOMER";
  }
}