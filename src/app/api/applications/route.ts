import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { ALLOWED, LIMITS, schema, sniff, type Kind } from "@/lib/validate";

export const runtime = "nodejs";
const fail = (status: number, message: string, fields?: Record<string, string>) => NextResponse.json({ ok: false, message, fields }, { status });

export async function POST(req: Request) {
  let fd: FormData;
  try { fd = await req.formData(); } catch { return fail(400, "Invalid submission."); }
  if (fd.get("website")) return NextResponse.json({ ok: true }); // honeypot: pretend success to bots

  const parsed = schema.safeParse({ name: fd.get("name"), email: fd.get("email"), phone: fd.get("phone"), specialty: fd.get("specialty"), years: fd.get("years") });
  const fields: Record<string, string> = {};
  if (!parsed.success) for (const i of parsed.error.issues) fields[String(i.path[0])] ??= i.message;

  const files = {} as Record<Kind, { mime: string; b64: string }>;
  for (const kind of ["license", "photo"] as Kind[]) {
    const f = fd.get(kind);
    if (!(f instanceof File) || f.size === 0) { fields[kind] = "This file is required"; continue; }
    if (f.size > LIMITS[kind]) { fields[kind] = `File must be under ${LIMITS[kind] / 1048576} MB`; continue; }
    const buf = Buffer.from(await f.arrayBuffer());
    const mime = sniff(buf);
    if (!mime || !ALLOWED[kind].includes(mime)) { fields[kind] = "Unsupported file type"; continue; }
    files[kind] = { mime, b64: buf.toString("base64") };
  }
  if (Object.keys(fields).length || !parsed.success) return fail(422, "Please fix the highlighted fields.", fields);

  const d = parsed.data, id = randomUUID(), sql = db();
  try {
    await sql.transaction([
      sql`insert into doctor_applications (id, full_name, email, phone, specialty, years_experience) values (${id}, ${d.name}, ${d.email}, ${d.phone}, ${d.specialty}, ${d.years})`,
      sql`insert into application_files (application_id, kind, mime, data) values (${id}, 'license', ${files.license.mime}, decode(${files.license.b64}, 'base64'))`,
      sql`insert into application_files (application_id, kind, mime, data) values (${id}, 'photo', ${files.photo.mime}, decode(${files.photo.b64}, 'base64'))`,
    ]);
  } catch (e: any) {
    if (e?.code === "23505") return fail(409, "An application with this email already exists.", { email: "Already registered" });
    console.error(e);
    return fail(500, "Something went wrong. Please try again.");
  }
  return NextResponse.json({ ok: true });
}
