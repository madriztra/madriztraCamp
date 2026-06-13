"use client";

import { useActionState } from "react";

import { prepareScheduledPost, type SchedulerActionState } from "@/actions/scheduler";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const initialState: SchedulerActionState = { ok: false, message: "" };

export function PreparePostForm({
  postId,
  accounts
}: {
  postId: string;
  accounts: Array<{ id: string; label: string }>;
}) {
  const [state, formAction] = useActionState(prepareScheduledPost, initialState);

  return (
    <form action={formAction} className="mt-3 space-y-2">
      <input type="hidden" name="postId" value={postId} />
      <Input name="mediaUrl" type="url" placeholder="https://cdn.example.com/approved-video.mp4" required />
      <Select name="connectedAccountId" defaultValue="">
        <option value="">Use first healthy matching account</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.label}
          </option>
        ))}
      </Select>
      <SubmitButton size="sm" variant="outline">
        Attach and queue
      </SubmitButton>
      <FormMessage ok={state.ok} message={state.message} />
    </form>
  );
}
