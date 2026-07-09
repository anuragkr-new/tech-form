import { auth, signIn } from "@/lib/auth";
import {
  getAuthSetupStatus,
  getOAuthErrorMessage,
  isDevLoginEnabled,
  isGoogleConfigured,
} from "@/lib/auth-mode";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const googleEnabled = isGoogleConfigured();
  const devLoginEnabled = isDevLoginEnabled();
  const setup = getAuthSetupStatus();
  const errorMessage = getOAuthErrorMessage(params.error);
  const showSetupHelp = process.env.NODE_ENV === "development" || !!params.error;

  if (session?.user?.email) {
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-md space-y-4">
        <div className="rounded-[20px] border border-card-border bg-card-bg p-8 shadow-[0_1px_3px_rgba(20,20,30,0.05)]">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">Tech Form</p>
            <h1 className="mt-2 text-2xl font-extrabold text-heading">JAS Targets Intake</h1>
            <p className="mt-3 text-sm text-body">
              Sign in to submit or manage form requests.
            </p>
          </div>

          {errorMessage && (
            <p className="mt-4 rounded-lg border border-error/30 bg-red-50 px-4 py-3 text-sm font-medium text-error">
              {errorMessage}
            </p>
          )}

          {!googleEnabled && !devLoginEnabled && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Auth is not configured. Add Google OAuth credentials to <code>.env</code> or enable{" "}
              <code>DEV_LOGIN=true</code> for local development.
            </p>
          )}

          {googleEnabled && (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: params.callbackUrl ?? "/" });
              }}
              className="mt-6"
            >
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
              >
                <GoogleIcon />
                Continue with Google
              </button>
            </form>
          )}

          {devLoginEnabled && (
            <div className={googleEnabled ? "mt-6 border-t border-field-border pt-6" : "mt-6"}>
              <p className="mb-3 text-center text-xs text-body">
                {googleEnabled
                  ? "Or use local dev login"
                  : "Local dev login (Google OAuth not configured yet)"}
              </p>
              <form
                action={async (formData) => {
                  "use server";
                  const email = formData.get("email");
                  if (typeof email !== "string" || !email.trim()) return;

                  await signIn("dev-login", {
                    email: email.trim(),
                    redirectTo: params.callbackUrl ?? "/",
                  });
                }}
                className="space-y-3"
              >
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="you@company.com"
                  className="w-full rounded-lg border border-field-border bg-card-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover"
                >
                  Continue with email (dev)
                </button>
              </form>
              <p className="mt-3 text-center text-xs text-body">
                Use an email listed in <code>ADMIN_EMAILS</code> to access the admin panel.
              </p>
            </div>
          )}
        </div>

        {showSetupHelp && (
          <div className="rounded-[20px] border border-card-border bg-card-bg p-5 text-sm shadow-[0_1px_3px_rgba(20,20,30,0.05)]">
            <p className="font-semibold text-heading">Google OAuth setup checklist</p>
            <ul className="mt-3 space-y-2 text-xs text-body">
              <li>
                Redirect URI to add in Google Cloud Console:
                <code className="mt-1 block break-all rounded bg-readonly-bg px-2 py-1 text-heading">
                  {setup.redirectUri}
                </code>
              </li>
              <li>Authorized JavaScript origin: <code>http://localhost:3000</code></li>
              <li>Google configured: {setup.googleConfigured ? "Yes" : "No"}</li>
            </ul>
            {setup.issues.length > 0 && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <p className="font-semibold">Fix these in `.env`:</p>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  {setup.issues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-1.6 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.8 3.8 14.6 3 12 3 7 3 3 7 3 12s4 9 9 9c5.2 0 8.6-3.7 8.6-8.9 0-.6-.1-1-.2-1.4H12z"
      />
    </svg>
  );
}
