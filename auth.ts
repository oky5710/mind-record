import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3001";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.id_token) {
        const res = await fetch(`${BACKEND_URL}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: account.id_token }),
        });
        if (res.ok) {
          const data = await res.json();
          token.backendToken = data.accessToken;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.backendToken = token.backendToken;
      return session;
    },
  },
});
