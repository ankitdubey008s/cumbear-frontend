interface Props {
  width?: number
  height?: number
  label?: string
  className?: string
}

export default function AdBanner({ width = 720, height = 140, label = 'Advertisement', className = '' }: Props) {
  return (
    <div className={`ad-banner ${className}`} style={{ maxWidth: width, minHeight: height }}>
      <span className="ad-label">{label}</span>
      <div className="ad-placeholder">
        <span>📢 {width}x{height} Ad Space</span>
      </div>
    </div>
  )
}

