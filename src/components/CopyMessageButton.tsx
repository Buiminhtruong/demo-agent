import { useEffect, useRef, useState } from 'react'
import { copyText } from '../lib/copy-text'

type Props = { message: string; code: string; label?: string; disabled?: boolean }

export default function CopyMessageButton({ message, code, label: idleLabel = '📋 Copy tin nhắn mẫu', disabled }: Props) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function handleClick() {
    const ok = await copyText(message)
    setState(ok ? 'copied' : 'failed')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), ok ? 3000 : 6000)
  }

  const label =
    state === 'copied'
      ? '✅ Đã chép — dán vào Zalo/Telegram'
      : state === 'failed'
        ? `⚠️ Không chép được — hãy nhắn mã ${code}`
        : idleLabel

  return (
    <button type="button" className={`copy-msg ${state}`} onClick={handleClick} aria-live="polite" disabled={disabled}>
      {label}
    </button>
  )
}
