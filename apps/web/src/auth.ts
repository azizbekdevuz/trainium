import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./lib/database/db";
import { mergeCookieCartIntoUser } from "./lib/cart/cart-merge";
import { verifyPassword } from "./lib/auth/password";
import Kakao from "./auth/providers/kakao";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true, // Allow linking accounts with same email
        }),
        Kakao({
            clientId: process.env.KAKAO_CLIENT_ID!,
            clientSecret: process.env.KAKAO_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true, // Allow linking accounts with same email
        }),
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email as string,
                    },
                }) as { id: string; email: string; name?: string; image?: string; password?: string; role?: string } | null;

                if (!user || !user.password) {
                    return null;
                }

                const isPasswordValid = await verifyPassword(
                    credentials.password as string,
                    user.password
                );

                if (!isPasswordValid) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    role: user.role as "ADMIN" | "STAFF" | "CUSTOMER" | undefined,
                };
            },
        }),
    ],
    pages: {
        signIn: "/auth/signin",
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                // attach user role to JWT
                token.role = user.role ?? "CUSTOMER";
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as { id?: string; role?: string }).id = token.sub;
                (session.user as { id?: string; role?: string }).role = (token as { role?: string }).role ?? "CUSTOMER";
            }
            return session;
        },
    },
    events: {
        async signIn({ user }) {
            if (user?.id) {
                await mergeCookieCartIntoUser(user.id);
            }
        },
    },
    trustHost: true,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
});