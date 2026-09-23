import { betterAuth } from "better-auth";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set to use authentication.");
}

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  advanced: { database: { generateId: () => crypto.randomUUID() } },
  user: {
    modelName: "users",
    fields: {
      name: "username",
      image: "profile_image_url",
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({ data: { ...user, image: user.image || "/avatars/default.svg" } })
      }
    }
  },
  emailAndPassword: { enabled: true }
});
