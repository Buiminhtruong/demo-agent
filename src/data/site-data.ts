// DỮ LIỆU MẪU — giá, số Zalo/Telegram/điện thoại là giả, thay trước khi chạy thật
export type Plan = {
  code: string
  name: string
  duration: string
  price: number
  features: string[]
  popular?: boolean
}

export type ProxyType = {
  id: string
  name: string
  description: string
  useCases: string
  plans: Plan[]
}

export type Faq = { question: string; answer: string }

export type Contact = { zalo: string; telegram: string; phone: string }

export type Shop = {
  name: string
  tagline: string
  description: string
  supportHours: string
  highlights: string[]
}

export const shop: Shop = {
  name: 'ProxyViet',
  tagline: 'Proxy & IP riêng tốc độ cao, giá rẻ',
  description:
    'IPv4 riêng, IPv6 và proxy dân cư cho nuôi tài khoản, chạy quảng cáo, thu thập dữ liệu. Nhắn là có proxy trong vài phút.',
  supportHours: '8h–22h mỗi ngày',
  highlights: ['IP riêng, không dùng chung', 'Hỗ trợ 8h–22h mỗi ngày', 'Đổi IP nếu lỗi trong 24h'],
}

// DỮ LIỆU MẪU: số liên hệ giả, thay bằng thông tin thật
export const contact: Contact = {
  zalo: '0900 000 000',
  telegram: '@proxyviet_demo',
  phone: '0900 000 000',
}

const base = ['HTTP & SOCKS5', 'Băng thông không giới hạn']

export const proxyTypes: ProxyType[] = [
  {
    id: 'ipv4',
    name: 'IPv4 riêng',
    description: 'IP tĩnh dành riêng cho bạn, ổn định lâu dài.',
    useCases: 'nuôi tài khoản, quảng cáo',
    plans: [
      { code: 'V4-1D', name: 'Gói 1 ngày', duration: '1 ngày', price: 15000, features: [...base, 'Đổi IP nếu lỗi'] },
      { code: 'V4-7D', name: 'Gói 7 ngày', duration: '7 ngày', price: 50000, features: [...base, 'Đổi IP nếu lỗi'] },
      { code: 'V4-30D', name: 'Gói 30 ngày', duration: '30 ngày', price: 120000, features: [...base, 'Đổi IP miễn phí 1 lần'], popular: true },
    ],
  },
  {
    id: 'ipv6',
    name: 'IPv6',
    description: 'Số lượng lớn, giá rẻ, hợp với trang hỗ trợ IPv6.',
    useCases: 'chạy số lượng nhiều',
    plans: [
      { code: 'V6-1D', name: 'Gói 1 ngày', duration: '1 ngày', price: 3000, features: [...base, 'Đổi IP nếu lỗi'] },
      { code: 'V6-7D', name: 'Gói 7 ngày', duration: '7 ngày', price: 15000, features: [...base, 'Đổi IP nếu lỗi'] },
      { code: 'V6-30D', name: 'Gói 30 ngày', duration: '30 ngày', price: 40000, features: [...base, 'Đổi IP miễn phí 1 lần'], popular: true },
    ],
  },
  {
    id: 'residential',
    name: 'Proxy dân cư xoay',
    description: 'IP nhà mạng thật, tự đổi IP theo thời gian.',
    useCases: 'thu thập dữ liệu',
    plans: [
      { code: 'RES-1D', name: 'Gói 1 ngày', duration: '1 ngày', price: 50000, features: ['HTTP & SOCKS5', 'Tự xoay IP theo thời gian', 'Đổi IP nếu lỗi'] },
      { code: 'RES-7D', name: 'Gói 7 ngày', duration: '7 ngày', price: 250000, features: ['HTTP & SOCKS5', 'Tự xoay IP theo thời gian', 'Đổi IP nếu lỗi'] },
      { code: 'RES-30D', name: 'Gói 30 ngày', duration: '30 ngày', price: 800000, features: ['HTTP & SOCKS5', 'Tự xoay IP theo thời gian', 'Hỗ trợ ưu tiên'], popular: true },
    ],
  },
]

export const faqs: Faq[] = [
  { question: 'Proxy có dùng chung với người khác không?', answer: 'IPv4 riêng chỉ cấp cho một khách trong suốt thời hạn gói.' },
  { question: 'Bao lâu thì nhận được proxy?', answer: 'Thường trong 5–15 phút sau khi chuyển khoản, trong giờ hỗ trợ.' },
  { question: 'Proxy lỗi thì sao?', answer: 'Nhắn shop, được đổi IP mới miễn phí trong 24h đầu.' },
  { question: 'Thanh toán bằng cách nào?', answer: 'Chuyển khoản ngân hàng hoặc ví điện tử, shop gửi thông tin khi bạn nhắn.' },
]