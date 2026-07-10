import { useEffect, useRef, useState } from 'react'

// Tab bar that swaps to a dropdown when the tabs don't fit on one line
// (horizontal scrolling tabs are easy to miss on mobile). A hidden copy of
// the tab row is always rendered to measure whether the tabs would fit,
// so the layout can switch back when the screen widens again.

type TabDef = { id: string; label: string }

export function ResponsiveTabs({
  tabs,
  activeTab,
  onSelect,
}: {
  tabs: TabDef[]
  activeTab: string
  onSelect: (id: string) => void
}) {
  const measureRef = useRef<HTMLDivElement>(null)
  const [useDropdown, setUseDropdown] = useState(false)

  useEffect(() => {
    const el = measureRef.current
    if (!el) return
    const check = () => setUseDropdown(el.scrollWidth > el.clientWidth + 1)
    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [tabs])

  return (
    <div className="responsive-tabs">
      <div ref={measureRef} className="reunion-tabs reunion-tabs-measure" aria-hidden="true">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" className="tab-button" tabIndex={-1}>
            {tab.label}
          </button>
        ))}
      </div>

      {useDropdown ? (
        <select
          className="tab-select"
          value={activeTab}
          onChange={(e) => onSelect(e.target.value)}
          aria-label="Section"
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="reunion-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onSelect(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
