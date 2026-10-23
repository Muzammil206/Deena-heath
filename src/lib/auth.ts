import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const NAME = "deena_admin", TTL = 7 * 86400;
const sign = (v: string) => createHmac("sha256", process.env.SESSION_SECRET ?? "").update(v).digest("hex");
export function safeEq(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export async function createSession() {
  const exp = String(Date.now() + TTL * 1000);
  (await cookies()).set(NAME, `${exp}.${sign(exp)}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: TTL });
}
export async function destroySession() { (await cookies()).delete(NAME); }
export async function isAdmin() {
  if (!process.env.SESSION_SECRET) return false;
  const [exp, sig] = ((await cookies()).get(NAME)?.value ?? "").split(".");
  return !!exp && !!sig && safeEq(sig, sign(exp)) && Number(exp) > Date.now();
}
export async function requireAdmin() { if (!(await isAdmin())) redirect("/admin/login"); }
