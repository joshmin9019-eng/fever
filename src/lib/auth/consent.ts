type ConsentVersions = { termsVersion: string; privacyVersion: string };
// Self-declared consent is separate from roles and membership approval.
// Callers must obtain metadata through authenticated getUser(), never from a form.
export function hasCurrentConsent(metadata: Record<string, unknown> | undefined, versions: ConsentVersions) {
 const consent = metadata?.signup_consent;
 if (!consent || typeof consent !== "object") return false;
 const record = consent as Record<string, unknown>;
 return record.terms_accepted === true && record.privacy_accepted === true
  && record.terms_version === versions.termsVersion
  && record.privacy_version === versions.privacyVersion
  && typeof record.accepted_at === "string" && Number.isFinite(Date.parse(record.accepted_at));
}
