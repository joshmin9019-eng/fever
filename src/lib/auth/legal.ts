import "server-only";
import { LEGAL_VERSION } from "@/lib/legal-content";
export function legalConfig() {
 const publicUrl = (value: string | undefined, fallback: string) => {
  if (!value) return fallback;
  try { return new URL(value).protocol === "https:" ? value : fallback; } catch { return fallback; }
 };
 return {
  termsUrl: publicUrl(process.env.FEVER_TERMS_URL, "/terms"),
  privacyUrl: publicUrl(process.env.FEVER_PRIVACY_URL, "/privacy"),
  termsVersion: process.env.FEVER_TERMS_VERSION || LEGAL_VERSION,
  privacyVersion: process.env.FEVER_PRIVACY_VERSION || LEGAL_VERSION,
  ready: true,
 };
}
