import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { ReunionBannerBar } from '../components/ReunionBannerBar'
import type { ReunionNomination } from '../types/ReunionNomination'
import './ReunionDetailPage.css'
import './NominationDetailPage.css'

type Tab = 'details' | 'comments'

type NominationDetailPageProps = {
  user: User
  onSignOut: () => void
  nomination: ReunionNomination
  onBack: () => void
}

function formatPrice(price: number): string {
  return price.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

export function NominationDetailPage({ user, onSignOut, nomination, onBack }: NominationDetailPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('details')

  const stats: { label: string; value: string }[] = []
  if (nomination.bedrooms != null) stats.push({ label: 'Bedrooms', value: String(nomination.bedrooms) })
  if (nomination.bathrooms != null) stats.push({ label: 'Bathrooms', value: String(nomination.bathrooms) })
  if (nomination.capacity != null) stats.push({ label: 'Capacity', value: String(nomination.capacity) })
  if (nomination.units != null) stats.push({ label: 'Units', value: String(nomination.units) })
  if (nomination.price != null) stats.push({ label: 'Price', value: formatPrice(nomination.price) })

  return (
    <main className="reunion-detail">
      <ReunionBannerBar user={user} onSignOut={onSignOut} />

      <section className="reunions-card">
        <div className="reunion-detail-header">
          <button type="button" className="back-button" onClick={onBack} aria-label="Back to nominations">
            ← Back
          </button>
          <h1>{nomination.name}</h1>
        </div>

        <div className="reunion-tabs">
          <button
            type="button"
            className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Nomination Details
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            Nomination Comments
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'details' && (
            <div className="tab-panel">
              <div className="nomination-detail">
                <p className="nomination-detail-location">
                  {nomination.city}, {nomination.state}
                </p>
                {nomination.description && (
                  <p className="nomination-detail-description">{nomination.description}</p>
                )}
                {stats.length > 0 && (
                  <dl className="nomination-detail-stats">
                    {stats.map((stat) => (
                      <div key={stat.label} className="nomination-detail-stat">
                        <dt>{stat.label}</dt>
                        <dd>{stat.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {nomination.url && (
                  <a
                    className="nomination-detail-link"
                    href={nomination.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View listing ↗
                  </a>
                )}
              </div>
            </div>
          )}
          {activeTab === 'comments' && (
            <div className="tab-panel">
              <h2>Comments</h2>
              <p>Comments will go here</p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
