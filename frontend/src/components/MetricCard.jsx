export function MetricCard({ label, value, helper, badge, badgeVariant }) {
  return (
    <div className={`metric-card ${badge ? 'has-badge' : ''} ${badgeVariant ? `badge-${badgeVariant}` : ''}`}>
      {badge && <div className="metric-badge">{badge}</div>}
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </div>
  )
}

