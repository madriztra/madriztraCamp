import { withAuth } from "next-auth/middleware";

import { authSecret } from "@/lib/auth-secret";

export default withAuth({
  secret: authSecret,
  pages: {
    signIn: "/login"
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/songs/:path*",
    "/campaigns/:path*",
    "/analytics/:path*",
    "/scheduler/:path*",
    "/smart-links/:path*",
    "/accounts/:path*",
    "/settings/:path*",
    "/admin/:path*"
  ]
};
