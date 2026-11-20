export default function Nav({ current, onChange }) {
  return (
    <nav id="top-nav">
      <button className={current === 'notes' ? 'active' : ''} onClick={() => onChange('notes')}>Take Notes</button>
      <button className={current === 'io' ? 'active' : ''} onClick={() => onChange('io')}>Download/Upload Notes</button>
      <button className={current === 'study' ? 'active' : ''} onClick={() => onChange('study')}>Study</button>
    </nav>
  )
}
