import { useEffect, useRef, useState } from 'react'
import './ScrollHint.css'

// A fade + chevron pinned to the bottom of a scrollable container,
// shown only while more content exists below the fold. Place it as the
// last child of the scroll container.
export function ScrollHint() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    const container = el?.parentElement
    if (!el || !container) return

    const update = () => {
      setVisible(container.scrollHeight - container.scrollTop - container.clientHeight > 24)
    }
    update()

    container.addEventListener('scroll', update, { passive: true })
    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(container)
    // Content changes (tab switches, lists loading) also change scrollability
    const mutationObserver = new MutationObserver(update)
    mutationObserver.observe(container, { childList: true, subtree: true })

    return () => {
      container.removeEventListener('scroll', update)
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [])

  return (
    <div ref={ref} className={`scroll-hint ${visible ? 'visible' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M4 9l8 7 8-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
