"use client";

import { useActionState } from "react";
import { RotateCcw } from "lucide-react";

import { retryScheduledPost, type SchedulerActionState } from "@/actions/scheduler";
import { SubmitButton } from "@/components/forms/submit-button";

const initialState: SchedulerActionState = { ok: false, message: "" };

export function RetryPostButton({ postId }: { postId: string }) {
  const [, formAction] = useActionState(retryScheduledPost, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="postId" value={postId} />
      <SubmitButton variant="outline" size="sm">
        <RotateCcw className="h-3.5 w-3.5" />
        Retry
      </SubmitButton>
    </form>
  );
}
