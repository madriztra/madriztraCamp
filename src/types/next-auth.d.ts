import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "artist" | "label" | "admin";
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role?: "artist" | "label" | "admin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "artist" | "label" | "admin";
  }
}
