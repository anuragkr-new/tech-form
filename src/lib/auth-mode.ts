export function getGoogleRedirectUri(): string {
  const baseUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/api/auth/callback/google`;
}

export function getAuthSetupStatus() {
  const googleId = process.env.AUTH_GOOGLE_ID ?? "";
  const googleSecret = process.env.AUTH_GOOGLE_SECRET ?? "";
  const authSecret = process.env.AUTH_SECRET ?? "";

  const issues: string[] = [];

  if (!authSecret || authSecret.includes("replace-with") || authSecret.includes("dev-secret")) {
    issues.push("Set AUTH_SECRET to a random value (run: openssl rand -base64 32)");
  }

  if (!googleId || googleId === "placeholder" || googleId.startsWith("your-")) {
    issues.push("AUTH_GOOGLE_ID is missing or still a placeholder");
  } else if (!googleId.endsWith(".apps.googleusercontent.com")) {
    issues.push("AUTH_GOOGLE_ID should end with .apps.googleusercontent.com");
  }

  if (!googleSecret || googleSecret === "placeholder" || googleSecret.startsWith("your-")) {
    issues.push("AUTH_GOOGLE_SECRET is missing or still a placeholder");
  }

  return {
    googleConfigured: isGoogleConfigured(),
    devLoginEnabled: isDevLoginEnabled(),
    redirectUri: getGoogleRedirectUri(),
    issues,
  };
}

export function isGoogleConfigured(): boolean {
  const id = process.env.AUTH_GOOGLE_ID;
  const secret = process.env.AUTH_GOOGLE_SECRET;

  return (
    !!id &&
    !!secret &&
    id !== "placeholder" &&
    secret !== "placeholder" &&
    !id.startsWith("your-")
  );
}

export function isDevLoginEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.DEV_LOGIN === "true" || !isGoogleConfigured();
}

export function getOAuthErrorMessage(error?: string): string | null {
  if (!error) return null;

  switch (error) {
    case "Configuration":
      return "Google OAuth is misconfigured. Check AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET in .env, then restart the server.";
    case "OAuthSignin":
    case "OAuthCallback":
      return "Google sign-in failed. Confirm the redirect URI in Google Cloud Console matches exactly.";
    case "AccessDenied":
      return "Access denied. If the app is in Testing mode, add your Google email as a test user in Google Cloud Console.";
    case "Callback":
      return "OAuth callback failed. Verify AUTH_SECRET is set and restart npm run dev.";
    default:
      return `Sign-in failed (${error}). Check your Google OAuth setup and .env values.`;
  }
}
