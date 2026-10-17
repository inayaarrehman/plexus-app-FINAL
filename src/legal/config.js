// ---------------------------------------------------------------------
// Legal pages: the few values they depend on.
// ---------------------------------------------------------------------
// CONTACT_EMAIL is shown on the Privacy and Terms pages and offered as a way
// to request deletion. Leave it empty until a contact address is chosen; the
// pages then point to the in-app options only.

export const CONTACT_EMAIL = 'contact@playplexus.com'

// Support email shown on Help & Support. Set it here, or as the Vercel
// environment variable VITE_SUPPORT_EMAIL (then redeploy). When neither is set,
// Help & Support offers only the in-app form, which saves to Supabase.
const envSupport = (() => {
  try {
    return import.meta.env?.VITE_SUPPORT_EMAIL || ''
  } catch {
    return ''
  }
})()
export const SUPPORT_EMAIL = (envSupport || CONTACT_EMAIL || '').trim()
export const LEGAL_UPDATED = 'October 14, 2026'
// The Privacy Policy changed on its own on October 17 2026 (Cloudflare Web
// Analytics); the Terms and Disclaimer keep LEGAL_UPDATED.
export const PRIVACY_UPDATED = 'October 17, 2026'
// Policy versions. Change the matching one whenever a page changes in a way
// people should know about; the app then shows a short update notice, and a
// signed-in account records that it accepted the new version
// (terms_acceptances, migration 0012). Sign-up records them too.
export const TERMS_VERSION = '2026-10-14'
export const PRIVACY_VERSION = '2026-10-17'
// The submission terms confirmed at Submit a Connection (Terms, Submissions).
export const SUBMISSION_TERMS_VERSION = '2026-10-14'
export const COPYRIGHT = '© 2026 Plexus. All rights reserved.'

export const DISCLAIMER_TEXT =
  'Plexus is an educational game and is not a substitute for professional medical advice, diagnosis, treatment, or clinical judgment. Do not use Plexus to make patient-care decisions.'
export const ACCURACY_TEXT =
  'Medical information in Plexus may contain errors or become outdated. Users should verify information with authoritative clinical and educational sources.'
export const AGE_TEXT = 'Plexus is for people 13 and older.'
// Who runs Plexus, as stated on the Terms and Privacy pages. When the owner
// adds a legal name (a person or a company) and a postal address, put them
// here and bump TERMS_VERSION and PRIVACY_VERSION.
export const OPERATOR_TEXT = 'Plexus is an educational game at playplexus.com. In these documents, "Plexus," "we" and "us" mean the people who run it.'
