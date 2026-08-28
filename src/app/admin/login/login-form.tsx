"use client";

import { useActionState } from "react";
import { Button, Card, CardBody, Field, Input } from "@/components/ui";
import { loginAction } from "@/app/actions/auth";

export function LoginForm({ from }: { from?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <Card>
      <CardBody className="p-7">
        <form action={formAction} className="flex flex-col gap-5" noValidate>
          <input type="hidden" name="from" value={from ?? ""} />
          <Field label="Email" required>
            <Input
              name="email"
              type="email"
              placeholder="owner@gangavedha.com"
              autoComplete="email"
              autoFocus
              required
            />
          </Field>
          <Field label="Password" required>
            <Input
              name="password"
              type="password"
              placeholder="••••••••••••"
              autoComplete="current-password"
              required
            />
          </Field>
          {state?.error && (
            <p role="alert" className="rounded-md bg-danger-soft p-3 text-small text-danger">
              {state.error}
            </p>
          )}
          <Button type="submit" block size="lg" loading={pending} loadingLabel="Signing in">
            Sign in
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
