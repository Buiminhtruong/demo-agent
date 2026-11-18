import { describe, expect, it } from 'vitest'
import { contactLinks } from './contact-links'

describe('contactLinks', () => {
  it('tạo link Zalo, Telegram, gọi điện từ thông tin liên hệ', () => {
    expect(
      contactLinks({ zalo: '0901 234.567', telegram: '@proxyviet', phone: '0901 234 567' }),
    ).toEqual({
      zalo: 'https://zalo.me/0901234567',
      telegram: 'https://t.me/proxyviet',
      phone: 'tel:0901234567',
    })
  })
})