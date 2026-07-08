import type { User } from '@supabase/supabase-js'
import './ReunionBannerBar.css'

type ReunionBannerBarProps = {
  user: User
  onSignOut: () => void
}

export function ReunionBannerBar({ user, onSignOut }: ReunionBannerBarProps) {
  return (
    <section className="reunion-banner-bar">
      <span className="reunions-brand">Arlene</span>

      <div className="reunions-user-menu">
        <span className="reunions-user-email">Hi, {user.user_metadata.name}</span>
        <button type="button" className="reunions-signout" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </section>
  )
}
