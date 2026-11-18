import { describe, it, expect, vi, afterEach } from 'vitest'
import { copyText } from './copy-text'

const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, 'clipboard', { value, configurable: true })
}

afterEach(() => {
  if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard)
  else delete (navigator as { clipboard?: unknown }).clipboard
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('copyText', () => {
  it('dùng Clipboard API khi có, trả true', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard({ writeText })
    await expect(copyText('xin chào')).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith('xin chào')
  })

  it('Clipboard API lỗi thì thử cách cũ (execCommand), thành công trả true và dọn textarea', async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) })
    const exec = vi.fn().mockReturnValue(true)
    document.execCommand = exec
    await expect(copyText('abc')).resolves.toBe(true)
    expect(exec).toHaveBeenCalledWith('copy')
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('không có Clipboard API và execCommand thất bại thì trả false', async () => {
    setClipboard(undefined)
    document.execCommand = vi.fn().mockReturnValue(false)
    await expect(copyText('abc')).resolves.toBe(false)
  })

  it('execCommand ném lỗi thì trả false', async () => {
    setClipboard(undefined)
    document.execCommand = vi.fn(() => {
      throw new Error('no')
    })
    await expect(copyText('abc')).resolves.toBe(false)
    expect(document.querySelector('textarea')).toBeNull()
  })
})
