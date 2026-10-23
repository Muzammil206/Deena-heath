"use client";
import { useRef, useState } from "react";

const SPECIALTIES = ["General Practice","Paediatrics","Obstetrics & Gynaecology","Internal Medicine","Dermatology","Psychiatry","Cardiology","ENT","Ophthalmology","Orthopaedics","Surgery","Other"];
const MAX = { license: 3, photo: 1.5 };
type Errs = Record<string, string>;

async function shrink(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, 900 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>(r => c.toBlob(r, "image/jpeg", 0.86));
    return blob ? new File([blob], "photo.jpg", { type: "image/jpeg" }) : file;
  } catch { return file; }
}

function Drop({ name, title, note, accept, file, onFile, preview }: { name: string; title: string; note: string; accept: string; file: File | null; onFile: (f: File) => void; preview?: string }) {
  const [on, setOn] = useState(false);
  return (
    <label className={`drop${on ? " on" : ""}`}
      onDragOver={e => { e.preventDefault(); setOn(true); }} onDragLeave={() => setOn(false)}
      onDrop={e => { e.preventDefault(); setOn(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}>
      <input type="file" name={name} accept={accept} onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
      <span className="ic">{preview ? <img src={preview} alt="" /> : name === "license" ? "↑" : "+"}</span>
      <span><b>{title}</b><small>{file ? file.name : note}</small></span>
    </label>
  );
}

export default function ApplicationForm() {
  const form = useRef<HTMLFormElement>(null);
  const [errs, setErrs] = useState<Errs>({});
  const [spec, setSpec] = useState("");
  const [license, setLicense] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [top, setTop] = useState("");
  const [done, setDone] = useState<string | null>(null);

  const E = (k: string) => errs[k] ? <div className="e">{errs[k]}</div> : null;
  const cls = (k: string) => (errs[k] ? "bad" : "");

  async function pickPhoto(f: File) {
    if (!/^image\//.test(f.type)) return setErrs(e => ({ ...e, photo: "Unsupported file type" }));
    const s = await shrink(f);
    setPhoto(s); setPreview(URL.createObjectURL(s)); setErrs(e => ({ ...e, photo: "" }));
  }
  function pickLicense(f: File) {
    setLicense(f);
    setErrs(e => ({ ...e, license: !/^(application\/pdf|image\/(jpeg|png))$/.test(f.type) ? "Use a PDF, JPG or PNG" : f.size > MAX.license * 1048576 ? `File must be under ${MAX.license} MB` : "" }));
  }

  async function submit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault(); setTop("");
    const f = new FormData(ev.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    const e: Errs = {};
    if (v("name").length < 3) e.name = "Enter your full name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("email"))) e.email = "Enter a valid email";
    if (v("phone").replace(/\D/g, "").length < 10) e.phone = "Enter a valid phone number";
    if (!spec) e.specialty = "Select a specialty";
    if (spec === "Other" && !v("other")) e.other = "Enter your specialty";
    const y = v("years"); if (y === "" || +y < 0 || +y > 60) e.years = "Enter 0–60";
    if (!license) e.license = "This file is required"; else if (errs.license) e.license = errs.license;
    if (!photo) e.photo = "This file is required"; else if (photo.size > MAX.photo * 1048576) e.photo = "Photo is too large, try another";
    setErrs(e);
    if (Object.values(e).some(Boolean)) return;

    f.set("specialty", spec === "Other" ? v("other") : spec);
    f.set("license", license!); f.set("photo", photo!);
    setBusy(true);
    try {
      const r = await fetch("/api/applications", { method: "POST", body: f });
      const j = await r.json().catch(() => ({}));
      if (r.ok) setDone(v("email"));
      else { setErrs(j.fields ?? {}); setTop(j.message ?? "Something went wrong."); }
    } catch { setTop("Network error. Check your connection and try again."); }
    setBusy(false);
  }

  if (done) return (
    <div className="card"><div className="done"><div className="tick">✓</div>
      <h1 style={{ fontSize: 24 }}>Application received</h1>
      <p className="sub" style={{ margin: 0 }}>We’ll verify your licence and email you at {done}.</p></div></div>
  );

  return (
    <form ref={form} className="card" onSubmit={submit} noValidate>
      <div className="hp" aria-hidden><input type="text" name="website" tabIndex={-1} autoComplete="off" /></div>
      <div className={cls("name")}><label className="l">Full name <i>*</i></label><input type="text" name="name" placeholder="Dr. Amina Bello" autoComplete="name" />{E("name")}</div>
      <div className="row">
        <div className={cls("email")}><label className="l">Email <i>*</i></label><input type="email" name="email" placeholder="you@example.com" autoComplete="email" />{E("email")}</div>
        <div className={cls("phone")}><label className="l">Phone <i>*</i></label><input type="tel" name="phone" placeholder="+234 801 234 5678" autoComplete="tel" />{E("phone")}</div>
      </div>
      <div className="row">
        <div className={cls("specialty")}><label className="l">Specialty <i>*</i></label>
          <select value={spec} onChange={e => setSpec(e.target.value)}><option value="">Select specialty</option>{SPECIALTIES.map(s => <option key={s}>{s}</option>)}</select>{E("specialty")}</div>
        {spec === "Other" && <div className={cls("other")}><label className="l">Your specialty <i>*</i></label><input type="text" name="other" placeholder="e.g. Endocrinology" />{E("other")}</div>}
        <div className={cls("years")}><label className="l">Years of experience <i>*</i></label><input type="number" name="years" min={0} max={60} inputMode="numeric" placeholder="e.g. 8" />{E("years")}</div>
      </div>
      <div className={cls("license")}><label className="l">Evidence of licence <i>*</i></label>
        <Drop name="license" title="Upload your practising licence" note="PDF, JPG or PNG · max 3 MB" accept=".pdf,image/jpeg,image/png" file={license} onFile={pickLicense} />
        <div className="hint">e.g. MDCN practising licence or equivalent regulatory certificate.</div>{E("license")}</div>
      <div className={cls("photo")}><label className="l">Professional photo <i>*</i></label>
        <Drop name="photo" title="Upload a photo of you in professional attire" note="JPG, PNG or WebP · auto-optimised" accept="image/jpeg,image/png,image/webp" file={photo} onFile={pickPhoto} preview={preview} />
        <div className="hint">Clear, front-facing, plain background. Scrubs or a white coat.</div>{E("photo")}</div>
      <button className="btn" disabled={busy}>{busy ? "Submitting…" : "Submit application"}</button>
      {top && <div className="e" style={{ textAlign: "center" }}>{top}</div>}
    </form>
  );
}
