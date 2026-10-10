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
export const LEGAL_UPDATED = 'October 9, 2026'
export const COPYRIGHT = '© 2026 Plexus. All rights reserved.'

export const DISCLAIMER_TEXT =
  'Plexus is an educational game and is not a substitute for professional medical advice, diagnosis, treatment, or clinical judgment. Do not use Plexus to make patient-care decisions.'
export const ACCURACY_TEXT =
  'Medical information in Plexus may contain errors or become outdated. Users should verify information with authoritative clinical and educational sources.'
export const AGE_TEXT = 'Plexus is not intended for children under 13.'
