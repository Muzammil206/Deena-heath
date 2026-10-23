import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { requireAdmin, destroySession } from "@/lib/auth";
import { db, type Application } from "@/lib/db";

export const dynamic = "force-dynamic";
const TABS = ["pending", "approved", "rejected", "all"] as const;

async function logout() { "use server"; await destroySession(); redirect("/admin/login"); }

export default async function Admin({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status = "pending" } = await searchParams;
  const tab = (TABS as readonly string[]).includes(status) ? status : "pending";
  const sql = db();
  const cols = "id, full_name, email, phone, specialty, years_experience, status, created_at";
  const rows = (tab === "all"
    ? await sql.query(`select ${cols} from doctor_applications order by created_at desc limit 200`)
    : await sql.query(`select ${cols} from doctor_applications where status = $1 order by created_at desc limit 200`, [tab])) as unknown as Application[];

  return (
    <main className="wrap wide">
      <div className="top">
        <Image className="logo" style={{ margin: 0 }} src="/logo.png" alt="Deena Health Hub" width={260} height={55} />
        <form action={logout}><button className="btn ghost">Sign out</button></form>
      </div>
      <h1>Doctor <span>applications</span></h1>
      <div className="tabs" style={{ marginTop: 16 }}>
        {TABS.map(t => <Link key={t} href={`/admin?status=${t}`} className={`tab${t === tab ? " on" : ""}`}>{t[0].toUpperCase() + t.slice(1)}</Link>)}
      </div>
      <div className="scroll"><table className="tbl">
        <thead><tr><th>Name</th><th>Specialty</th><th>Exp.</th><th>Applied</th><th>Status</th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td><Link href={`/admin/${r.id}`}><b>{r.full_name}</b></Link><br /><small style={{ color: "var(--mut)" }}>{r.email}</small></td>
              <td>{r.specialty}</td><td>{r.years_experience} yrs</td>
              <td>{new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
              <td><span className={`badge ${r.status}`}>{r.status}</span></td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--mut)", padding: 40 }}>No applications here yet.</td></tr>}
        </tbody>
      </table></div>
    </main>
  );
}
