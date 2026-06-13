import nodemailer from "nodemailer";

import { absoluteUrl, getEnv, getOptionalEnv } from "@/lib/env";

export async function sendPasswordResetEmail(email: string, token: string) {
  const host = getOptionalEnv("SMTP_HOST");
  const user = getOptionalEnv("SMTP_USER");
  const pass = getOptionalEnv("SMTP_PASS");

  if (!host || !user || !pass) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP is not configured");
    }

    console.info(`Password reset link for ${email}: ${absoluteUrl(`/reset-password?token=${token}`)}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: { user, pass }
  });

  const resetUrl = absoluteUrl(`/reset-password?token=${encodeURIComponent(token)}`);

  await transporter.sendMail({
    from: getEnv("SMTP_FROM", "Music Growth OS <no-reply@example.com>"),
    to: email,
    subject: "Reset your Music Growth OS password",
    text: `Reset your password: ${resetUrl}`,
    html: `<p>Reset your Music Growth OS password using this secure link:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in one hour.</p>`
  });
}
