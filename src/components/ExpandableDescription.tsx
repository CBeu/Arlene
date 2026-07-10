import { useEffect, useRef, useState } from 'react'
import './ExpandableDescription.css'

// Long text clamped to a few lines with a Show more / Show less toggle.
// The toggle only appears when the clamped text actually overflows.
export function ExpandableDescription({ text, className }: { text: string; className?: string }) {
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = textRef.current
    if (!el) return
    const check = () => setOverflows(el.scrollHeight > el.clientHeight + 1)
    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [text])

  return (
    <div>
      <p
        ref={textRef}
        className={`${className ?? ''} ${expanded ? '' : 'description-clamped'}`}
      >
        {text}
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          className="description-toggle"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}
