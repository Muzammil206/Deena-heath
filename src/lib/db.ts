import { neon } from "@neondatabase/serverless";

let client: ReturnType<typeof neon> | null = null;
export function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  return (client ??= neon(process.env.DATABASE_URL));
}

export type Application = {
  id: string; full_name: string; email: string; phone: string; specialty: string;
  years_experience: number; status: "pending" | "approved" | "rejected";
  reviewed_at: string | null; created_at: string;
};
