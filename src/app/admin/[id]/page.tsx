import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin, isAdmin } from "@/lib/auth";
import { db, type Application } from "@/lib/db";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function setStatus(fd: FormData) {
  "use server";
  if (!(await isAdmin())) redirect("/admin/login");
  const id = String(fd.get("id")), status = String(fd.get("status"));
  if (!UUID.test(id) || !["pending", "approved", "rejected"].includes(status)) return;
  await db()`update doctor_applications set status = ${status}, reviewed_at = now() where id = ${id}`;
  revalidatePath("/admin");
  redirect("/admin");
}

export default async function Detail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const [a] = (await db()`select * from doctor_applications where id = ${id}`) as unknown as Application[];
  if (!a) notFound();
  const [lic] = (await db()`select mime from application_files where application_id = ${id} and kind = 'license'`) as unknown as { mime: string }[];

  return (
    <main className="wrap wide">
      <p><Link href="/admin">← All applications</Link></p>
      <div className="top"><h1>{a.full_name}</h1><span className={`badge ${a.status}`}>{a.status}</span></div>
      <div className="card">
        <div className="det">
          <img className="photo" src={`/admin/files/${id}/photo`} alt={a.full_name} />
          <dl>
            <dt>Specialty</dt><dd>{a.specialty}</dd>
            <dt>Experience</dt><dd>{a.years_experience} years</dd>
            <dt>Email</dt><dd><a href={`mailto:${a.email}`}>{a.email}</a></dd>
            <dt>Phone</dt><dd><a href={`tel:${a.phone}`}>{a.phone}</a></dd>
            <dt>Applied</dt><dd>{new Date(a.created_at).toLocaleString("en-GB")}</dd>
            {a.reviewed_at && <><dt>Reviewed</dt><dd>{new Date(a.reviewed_at).toLocaleString("en-GB")}</dd></>}
          </dl>
        </div>
        <div>
          <div className="l">Licence document · <a href={`/admin/files/${id}/license`} target="_blank">open in new tab</a></div>
          {lic?.mime === "application/pdf"
            ? <iframe className="doc" src={`/admin/files/${id}/license`} title="Licence" />
            : <img className="doc" style={{ objectFit: "contain", height: "auto", maxHeight: 620 }} src={`/admin/files/${id}/license`} alt="Licence" />}
        </div>
        <form action={setStatus} className="actions">
          <input type="hidden" name="id" value={id} />
          <button className="btn ok" name="status" value="approved">Approve</button>
          <button className="btn no" name="status" value="rejected">Reject</button>
          {a.status !== "pending" && <button className="btn ghost" name="status" value="pending">Reset to pending</button>}
        </form>
      </div>
    </main>
  );
}
