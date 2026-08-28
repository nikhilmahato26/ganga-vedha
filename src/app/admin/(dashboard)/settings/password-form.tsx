"use client";

import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { changePasswordAction } from "@/app/actions/auth";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, undefined);

  return (
    <form action={formAction} className="mt-5 flex flex-col gap-4" noValidate>
      <Field label="Current password" required>
        <Input name="currentPassword" type="password" autoComplete="current-password" required />
      </Field>
      <Field label="New password" required hint="At least 12 characters.">
        <Input name="newPassword" type="password" autoComplete="new-password" required minLength={12} />
      </Field>
      <Field label="Confirm new password" required>
        <Input name="confirmPassword" type="password" autoComplete="new-password" required />
      </Field>

      {state?.error && (
        <p role="alert" className="rounded-md bg-danger-soft p-3 text-small text-danger">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="rounded-md bg-open-soft p-3 text-small text-jade-800">
          Password updated.
        </p>
      )}

      <div>
        <Button type="submit" loading={pending} loadingLabel="Saving">
          Update password
        </Button>
      </div>
    </form>
  );
}
