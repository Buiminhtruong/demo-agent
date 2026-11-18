import { useState } from 'react'
import type { Faq as FaqItem } from '../data/site-data'

export default function Faq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<Set<number>>(() => new Set())

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  return (
    <section id="hoi-dap" className="alt-bg">
      <div className="wrap">
        <h2>Hỏi đáp</h2>
        <p className="sub">Những câu khách hay hỏi</p>
        <div className="faq">
          {items.map((f, i) => {
            const isOpen = open.has(i)
            return (
              <div key={f.question} className="faq-item">
                <button
                  type="button"
                  className="faq-q"
                  id={`faq-q-${i}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-a-${i}`}
                  onClick={() => toggle(i)}
                >
                  {f.question}
                </button>
                {isOpen && (
                  <p className="faq-a" id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`}>
                    {f.answer}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
