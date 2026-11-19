// DỮ LIỆU MẪU — giá, số Zalo/Telegram/điện thoại là giả, thay trước khi chạy thật
export type Plan = {
  code: string
  name: string
  duration: string
  price: number
  features: string[]
  popular?: boolean
}

// Một ô trong bảng so sánh; good = true hiện màu xanh, false hiện màu cam
export type CompareValue = { text: string; good: boolean }

export type ProxyCompare = {
  ip: string
  stability: CompareValue
  support: CompareValue
}

export type ProxyType = {
  id: string
  name: string
  description: string
  useCases: string
  compare: ProxyCompare
  plans: Plan[]
}

export type Review = {
  name: string
  rating: number // số sao 1–5
  text: string
  proxyTypeId: string // id trong proxyTypes
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

// Câu khách chép khi bấm "Copy tin nhắn mẫu" ở mỗi gói.
// {code} = mã gói, {type} = loại proxy, {plan} = tên gói, {price} = giá
export const orderMessageTemplate = 'Chào shop, mình muốn mua gói {code} ({type} – {plan}, {price}/IP). Số lượng: ... IP'

// Câu khách chép ở ô "Tính tiền nhanh". Ngoài các chỗ trên: {qty} = số lượng IP, {total} = tổng tiền
export const calcMessageTemplate = 'Chào shop, mình muốn mua gói {code} ({type} – {plan}), số lượng: {qty} IP, tổng {total}.'

const base = ['HTTP & SOCKS5', 'Băng thông không giới hạn']

export const proxyTypes: ProxyType[] = [
  {
    id: 'ipv4',
    name: 'IPv4 riêng',
    description: 'IP tĩnh dành riêng cho bạn, ổn định lâu dài.',
    useCases: 'nuôi tài khoản, quảng cáo',
    compare: {
      ip: 'Tĩnh, riêng một mình bạn',
      stability: { text: 'Rất cao', good: true },
      support: { text: 'Hầu hết mọi trang', good: true },
    },
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
    compare: {
      ip: 'Tĩnh, riêng một mình bạn',
      stability: { text: 'Cao', good: true },
      support: { text: 'Chỉ trang hỗ trợ IPv6', good: false },
    },
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
    compare: {
      ip: 'Tự đổi theo thời gian',
      stability: { text: 'Trung bình (IP thay đổi)', good: false },
      support: { text: 'Hầu hết mọi trang', good: true },
    },
    plans: [
      { code: 'RES-1D', name: 'Gói 1 ngày', duration: '1 ngày', price: 50000, features: ['HTTP & SOCKS5', 'Tự xoay IP theo thời gian', 'Đổi IP nếu lỗi'] },
      { code: 'RES-7D', name: 'Gói 7 ngày', duration: '7 ngày', price: 250000, features: ['HTTP & SOCKS5', 'Tự xoay IP theo thời gian', 'Đổi IP nếu lỗi'] },
      { code: 'RES-30D', name: 'Gói 30 ngày', duration: '30 ngày', price: 800000, features: ['HTTP & SOCKS5', 'Tự xoay IP theo thời gian', 'Hỗ trợ ưu tiên'], popular: true },
    ],
  },
]

// DỮ LIỆU MẪU: đánh giá bịa để dựng giao diện — thay bằng đánh giá thật của khách.
// Khi đã thay hết bằng đánh giá thật, đổi reviewsAreSample thành false để ẩn dòng "dữ liệu mẫu".
export const reviewsAreSample = true

export const reviews: Review[] = [
  {
    name: 'Minh T.',
    rating: 5,
    text: 'Mua IPv4 30 ngày để nuôi tài khoản quảng cáo, chạy ổn định cả tháng không rớt. Nhắn Zalo là có proxy trong 10 phút.',
    proxyTypeId: 'ipv4',
  },
  {
    name: 'Hoàng L.',
    rating: 5,
    text: 'Cần vài trăm IP chạy tool, IPv6 giá rẻ hơn hẳn. Có lần lỗi vài IP, shop đổi ngay trong buổi tối.',
    proxyTypeId: 'ipv6',
  },
  {
    name: 'Ngọc A.',
    rating: 4,
    text: 'Proxy dân cư xoay dùng thu thập dữ liệu khá ổn, ít bị chặn. Mong shop có thêm gói theo tuần dài hơn.',
    proxyTypeId: 'residential',
  },
]

export const faqs: Faq[] = [
  { question: 'Proxy có dùng chung với người khác không?', answer: 'IPv4 riêng chỉ cấp cho một khách trong suốt thời hạn gói.' },
  { question: 'Bao lâu thì nhận được proxy?', answer: 'Thường trong 5–15 phút sau khi chuyển khoản, trong giờ hỗ trợ.' },
  { question: 'Proxy lỗi thì sao?', answer: 'Nhắn shop, được đổi IP mới miễn phí trong 24h đầu.' },
  { question: 'Thanh toán bằng cách nào?', answer: 'Chuyển khoản ngân hàng hoặc ví điện tử, shop gửi thông tin khi bạn nhắn.' },
]