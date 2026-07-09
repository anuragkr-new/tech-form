import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { isDevLoginEnabled, isGoogleConfigured } from "@/lib/auth-mode";

const providers: NextAuthConfig["providers"] = [];

if (isGoogleConfigured()) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  );
}

if (isDevLoginEnabled()) {
  providers.push(
    Credentials({
      id: "dev-login",
      name: "Dev Login",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        if (!email || !email.includes("@")) return null;

        return {
          id: email,
          email,
          name: email.split("@")[0],
        };
      },
    }),
  );
}

export default {
  providers,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
