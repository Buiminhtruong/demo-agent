export default function FloatingContact({ zaloUrl }: { zaloUrl: string }) {
  return (
    <a className="float" href={zaloUrl} target="_blank" rel="noopener noreferrer" aria-label="Nhắn Zalo">
      Zalo
    </a>
  )
}
