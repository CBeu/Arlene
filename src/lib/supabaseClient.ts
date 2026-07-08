import { createClient } from '@supabase/supabase-js'

// Values come from .env.local (see SETUP.md).
// The publishable key is safe to expose in the browser — row level
// security on the database is what protects your data.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    // Parses the session out of the URL after an OAuth or
    // magic-link redirect, then stores it in localStorage.
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
})
