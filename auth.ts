import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3001";

async function refreshGoogleAccessToken(token: any) {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.AUTH_GOOGLE_ID!,
        client_secret: process.env.AUTH_GOOGLE_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.googleRefreshToken,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return {
      ...token,
      googleAccessToken: data.access_token,
      googleAccessTokenExpires: Date.now() + data.expires_in * 1000,
      googleRefreshToken: data.refresh_token ?? token.googleRefreshToken,
    };
  } catch {
    return { ...token, googleError: "RefreshAccessTokenError" };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
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

      if (account?.access_token) {
        token.googleAccessToken = account.access_token;
        token.googleRefreshToken = account.refresh_token;
        token.googleAccessTokenExpires = account.expires_at ? account.expires_at * 1000 : undefined;
      }

      if (
        token.googleAccessTokenExpires &&
        Date.now() > token.googleAccessTokenExpires &&
        token.googleRefreshToken
      ) {
        return await refreshGoogleAccessToken(token);
      }

      return token;
    },
    async session({ session, token }) {
      session.backendToken = token.backendToken;
      session.googleAccessToken = token.googleAccessToken;
      return session;
    },
  },
});
