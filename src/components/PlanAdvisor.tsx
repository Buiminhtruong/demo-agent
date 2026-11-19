import { useRef, useState } from 'react'
import type { PlanAdvisorConfig, ProxyType } from '../data/site-data'
import { formatPrice } from '../lib/format-price'
import { recommendPlan } from '../lib/plan-advisor'

type Props = {
  types: ProxyType[]
  config: PlanAdvisorConfig
  onApply: (typeId: string, duration: string) => void
}

export default function PlanAdvisor({ types, config, onApply }: Props) {
  const [purposeId, setPurposeId] = useState<string | null>(null)
  const [durationId, setDurationId] = useState<string | null>(null)
  // "Chọn lại" làm ô gợi ý (và chính nút đó) biến mất → đưa focus về lựa chọn đầu của câu 1
  const firstOptionRef = useRef<HTMLButtonElement>(null)

  const purpose = config.purposes.find((p) => p.id === purposeId)
  const duration = config.durations.find((d) => d.id === durationId)
  const rec = purpose && duration ? recommendPlan(types, purpose.typeId, duration.duration) : null

  return (
    <section id="chon-goi">
      <div className="wrap">
        <h2>🧭 Chưa biết chọn gói nào?</h2>
        <p className="sub">Trả lời 2 câu, mình gợi ý gói hợp nhất cho bạn.</p>
        <div className="card wizard">
          <div className="q" role="group" aria-labelledby="advisor-q1">
            <p className="q-title" id="advisor-q1"><span className="num" aria-hidden="true">1</span>{config.purposeQuestion}</p>
            <div className="opts">
              {config.purposes.map((o, i) => (
                <button
                  key={o.id}
                  ref={i === 0 ? firstOptionRef : undefined}
                  type="button"
                  className={`opt${o.id === purposeId ? ' on' : ''}`}
                  aria-pressed={o.id === purposeId}
                  onClick={() => setPurposeId(o.id)}
                >
                  {o.title}
                  <small>{o.hint}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="q" role="group" aria-labelledby="advisor-q2">
            <p className="q-title" id="advisor-q2"><span className="num" aria-hidden="true">2</span>{config.durationQuestion}</p>
            <div className="opts three">
              {config.durations.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className={`opt${o.id === durationId ? ' on' : ''}`}
                  aria-pressed={o.id === durationId}
                  onClick={() => setDurationId(o.id)}
                >
                  {o.title}
                </button>
              ))}
            </div>
          </div>
          <div aria-live="polite">
            {rec && purpose && (
              <div className="result">
                <p className="label">Gợi ý cho bạn</p>
                <h3>
                  {rec.type.name} – {rec.plan.name} <span className="code">{rec.plan.code}</span>
                </h3>
                <div className="advisor-price">
                  {formatPrice(rec.plan.price)} <small>/ 1 IP</small>
                </div>
                <p className="why">{purpose.reason}</p>
                <div className="advisor-actions">
                  <button type="button" className="btn btn-primary" onClick={() => onApply(rec.type.id, rec.plan.duration)}>
                    Tính tiền với gói này →
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      setPurposeId(null)
                      setDurationId(null)
                      firstOptionRef.current?.focus()
                    }}
                  >
                    ↺ Chọn lại
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
