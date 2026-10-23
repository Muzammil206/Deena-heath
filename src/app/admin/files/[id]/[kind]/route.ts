import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_: Request, { params }: { params: Promise<{ id: string; kind: string }> }) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const { id, kind } = await params;
  if (!UUID.test(id) || !["license", "photo"].includes(kind)) return new Response("Not found", { status: 404 });
  const [f] = (await db()`select mime, encode(data, 'base64') as b64 from application_files where application_id = ${id} and kind = ${kind}`) as unknown as { mime: string; b64: string }[];
  if (!f) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(f.b64, "base64"), {
    headers: { "Content-Type": f.mime, "Content-Disposition": "inline", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}
