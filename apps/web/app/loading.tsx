export default function Loading() {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--obsidian)',
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: '3px solid rgba(201, 169, 97, 0.2)',
        borderTopColor: 'var(--gold)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
