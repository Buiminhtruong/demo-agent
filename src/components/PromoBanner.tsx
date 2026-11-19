import { useEffect, useRef, useState } from 'react'
import type { Promo } from '../data/site-data'
import { copyText } from '../lib/copy-text'
import { isPromoActive, timeLeft } from '../lib/promo'

const STORAGE_KEY = 'promo-dismissed'

function readDismissed(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

export default function PromoBanner({ promo }: { promo: Promo | null }) {
  const [dismissed, setDismissed] = useState<string | null>(readDismissed)
  const [, setTick] = useState(0)
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])

  const now = new Date()
  if (!isPromoActive(promo, now) || dismissed === promo.code) return null
  const left = timeLeft(promo.endsAt, now)
  if (!left) return null

  async function handleCopy() {
    const ok = await copyText(promo!.code)
    setState(ok ? 'copied' : 'failed')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), ok ? 3000 : 6000)
  }

  function handleClose() {
    setDismissed(promo!.code)
    try {
      localStorage.setItem(STORAGE_KEY, promo!.code)
    } catch {
      // không lưu được thì chỉ ẩn trong lần xem này
    }
  }

  const hint = state === 'copied' ? '✅ Đã chép' : state === 'failed' ? '⚠️ Không chép được' : '📋 Chép'

  return (
    <div className="promo" role="region" aria-label="Khuyến mãi">
      <div className="wrap promo-bar">
        <span className="promo-msg">{promo.message}</span>
        <button type="button" className={`promo-coupon ${state}`} onClick={handleCopy} title="Bấm để chép mã" aria-live="polite">
          {promo.code}
          <small>{hint}</small>
        </button>
        <span className="promo-timer">
          Còn <b>{pad(left.days)}</b> ngày <b>{pad(left.hours)}</b>:<b>{pad(left.minutes)}</b>:<b>{pad(left.seconds)}</b>
        </span>
        <button type="button" className="promo-close" aria-label="Đóng khuyến mãi" onClick={handleClose}>×</button>
      </div>
    </div>
  )
}
