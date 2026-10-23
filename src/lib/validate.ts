import { z } from "zod";

export const SPECIALTIES = ["General Practice","Paediatrics","Obstetrics & Gynaecology","Internal Medicine","Dermatology","Psychiatry","Cardiology","ENT","Ophthalmology","Orthopaedics","Surgery"];

// Vercel caps request bodies at 4.5 MB, so keep the total under that.
export const LIMITS = { license: 3 * 1024 * 1024, photo: 1.5 * 1024 * 1024 } as const;

export const schema = z.object({
  name: z.string().trim().min(3, "Enter your full name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
  phone: z.string().trim().refine(v => { const n = v.replace(/\D/g, "").length; return n >= 10 && n <= 15; }, "Enter a valid phone number"),
  specialty: z.string().trim().min(2, "Select a specialty").max(80),
  years: z.coerce.number({ invalid_type_error: "Enter 0–60" }).int("Enter 0–60").min(0, "Enter 0–60").max(60, "Enter 0–60"),
});

export type Kind = "license" | "photo";
export const ALLOWED: Record<Kind, string[]> = { license: ["application/pdf", "image/jpeg", "image/png"], photo: ["image/jpeg", "image/png", "image/webp"] };

// Trust the bytes, not the client-declared MIME type.
export function sniff(b: Buffer): string | null {
  if (b.subarray(0, 4).toString("latin1") === "%PDF") return "application/pdf";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.subarray(1, 4).toString("latin1") === "PNG") return "image/png";
  if (b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP") return "image/webp";
  return null;
}
