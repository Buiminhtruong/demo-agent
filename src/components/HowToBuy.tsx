const steps = [
  { title: 'Chọn gói', text: 'Xem bảng giá, ghi lại mã gói.' },
  { title: 'Nhắn Zalo/Telegram kèm mã gói', text: 'Gửi mã gói và số lượng cần mua.' },
  { title: 'Chuyển khoản, nhận proxy', text: 'Shop gửi IP, cổng, tài khoản ngay sau khi nhận tiền.' },
]

export default function HowToBuy() {
  return (
    <section id="cach-mua">
      <div className="wrap">
        <h2>Cách mua</h2>
        <p className="sub">3 bước, nhận proxy trong vài phút</p>
        <div className="steps">
          {steps.map((s, i) => (
            <div key={s.title} className="card">
              <div className="step-n" aria-hidden="true">{i + 1}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
