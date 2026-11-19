import { describe, it, expect } from 'vitest'
import { initials } from './initials'

describe('initials', () => {
  it('lấy chữ cái đầu của 2 từ đầu, viết hoa', () => {
    expect(initials('Minh T.')).toBe('MT')
    expect(initials('ngọc anh')).toBe('NA')
  })

  it('tên 1 từ thì lấy 1 chữ', () => {
    expect(initials('Hùng')).toBe('H')
  })

  it('bỏ khoảng trắng thừa, tên rỗng trả chuỗi rỗng', () => {
    expect(initials('  Lan   P.  ')).toBe('LP')
    expect(initials('   ')).toBe('')
  })

  it('tên nhiều từ chỉ lấy 2 chữ', () => {
    expect(initials('Nguyễn Văn An')).toBe('NV')
  })
})
