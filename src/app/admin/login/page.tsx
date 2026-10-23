import { redirect } from "next/navigation";
import Image from "next/image";
import { createSession, isAdmin, safeEq } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function login(fd: FormData) {
  "use server";
  const pw = String(fd.get("password") ?? ""), real = process.env.ADMIN_PASSWORD ?? "";
  if (!real || !process.env.SESSION_SECRET || !safeEq(pw, real)) {
    await new Promise(r => setTimeout(r, 600)); // slow down guessing
    redirect("/admin/login?error=1");
  }
  await createSession();
  redirect("/admin");
}

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdmin()) redirect("/admin");
  const { error } = await searchParams;
  return (
    <main className="wrap">
      <Image className="logo" src="/logo.png" alt="Deena Health Hub" width={520} height={109} />
      <h1>Admin <span>sign in</span></h1>
      <p className="sub">Review and verify doctor applications.</p>
      <form action={login} className="card">
        <div className={error ? "bad" : ""}><label className="l">Password</label><input type="password" name="password" autoFocus required />
          {error && <div className="e">Incorrect password</div>}</div>
        <button className="btn">Sign in</button>
      </form>
    </main>
  );
}
