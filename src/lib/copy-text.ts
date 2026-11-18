// Chép chữ vào bộ nhớ tạm. Trả false nếu trình duyệt không cho chép.
export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // trang chạy http hoặc bị chặn quyền → thử cách cũ bên dưới
    }
  }
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  try {
    area.select()
    return document.execCommand('copy') === true
  } catch {
    return false
  } finally {
    area.remove()
  }
}
