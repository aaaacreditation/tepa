"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../auth-actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, null);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="dash-label" htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
          className="dash-field"
        />
      </div>

      <div>
        <label className="dash-label" htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Your password"
          className="dash-field"
        />
      </div>

      {state?.error && (
        <p role="alert" className="rounded-xl bg-[#fdf1f0] px-4 py-3 text-sm text-[#a03a30]">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="dash-btn dash-btn-navy w-full disabled:opacity-70">
        {pending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Signing in
          </>
        ) : (
          "Sign in"
        )}
      </button>
    </form>
  );
}
