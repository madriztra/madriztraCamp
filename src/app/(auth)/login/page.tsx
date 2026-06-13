import type { Metadata } from "next";

import { LoginForm } from "@/components/forms/auth-forms";

export const metadata: Metadata = {
  title: "Login"
};

export default function LoginPage() {
  return <LoginForm googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)} />;
}
