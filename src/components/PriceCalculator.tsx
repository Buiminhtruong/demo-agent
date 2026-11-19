import { useState } from 'react'
import { calcMessageTemplate, type Plan, type ProxyType } from '../data/site-data'
import type { contactLinks } from '../lib/contact-links'
import { formatPrice } from '../lib/format-price'
import { MAX_QUANTITY, parseQuantity, quoteMessage } from '../lib/price-calc'
import CopyMessageButton from './CopyMessageButton'

type Props = {
  types: ProxyType[]
  selectedId: string
  onSelect: (id: string) => void
  links: ReturnType<typeof contactLinks>
}

function popularPlan(type: ProxyType | undefined): Plan | undefined {
  return type?.plans.find((p) => p.popular) ?? type?.plans[0]
}

export default function PriceCalculator({ types, selectedId, onSelect, links }: Props) {
  const type = types.find((t) => t.id === selectedId) ?? types[0]
  // Nhớ thời hạn theo tên (vd "7 ngày") để đổi loại proxy vẫn giữ cùng thời hạn;
  // loại mới không có thời hạn đó thì dùng gói phổ biến của loại đó
  const [duration, setDuration] = useState(() => popularPlan(type)?.duration ?? '')
  const [qtyText, setQtyText] = useState('1')

  const plan = type?.plans.find((p) => p.duration === duration) ?? popularPlan(type)
  if (!type || !plan) return null
  const qty = parseQuantity(qtyText)

  return (
    <div className="card calc" id="tinh-gia">
      <h3>🧮 Tính tiền nhanh</h3>
      <p className="hint">Chọn gói và số lượng IP, tổng tiền hiện ngay.</p>
      <div className="calc-row">
        <div>
          <label htmlFor="calc-type">Loại proxy</label>
          <select id="calc-type" value={type.id} onChange={(e) => onSelect(e.target.value)}>
            {types.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="calc-plan">Thời hạn</label>
          <select
            id="calc-plan"
            value={plan.code}
            onChange={(e) => setDuration(type.plans.find((p) => p.code === e.target.value)?.duration ?? duration)}
          >
            {type.plans.map((p) => (
              <option key={p.code} value={p.code}>{p.duration}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="calc-qty">Số lượng IP (1–{MAX_QUANTITY})</label>
          <input
            id="calc-qty"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_QUANTITY}
            step={1}
            value={qtyText}
            aria-invalid={qty === null}
            onChange={(e) => setQtyText(e.target.value)}
          />
        </div>
      </div>
      {qty === null && (
        <p className="calc-error" role="alert">Nhập số lượng từ 1 đến {MAX_QUANTITY}</p>
      )}
      <div className="calc-total">
        <span className="formula">
          {qty === null ? `Gói ${plan.code} · ${formatPrice(plan.price)} / 1 IP` : `Gói ${plan.code} · ${formatPrice(plan.price)} × ${qty} IP`}
        </span>
        <span className="sum" data-testid="calc-total" aria-live="polite">
          {qty === null ? '—' : formatPrice(plan.price * qty)}
        </span>
      </div>
      <div className="calc-actions">
        <a className="btn btn-zalo" href={links.zalo} target="_blank" rel="noopener noreferrer">Mua qua Zalo</a>
        <CopyMessageButton
          key={`${plan.code}-${qtyText}`} // gói/số lượng đổi thì nút về trạng thái ban đầu, không báo "Đã chép" câu cũ
          message={qty === null ? '' : quoteMessage(calcMessageTemplate, type, plan, qty)}
          code={plan.code}
          label="📋 Copy tin nhắn"
          disabled={qty === null}
        />
      </div>
    </div>
  )
}
