export default function Nav({ currentModule, setCurrentModule }) {
  const modules = [
    { id: 'notes', label: 'Take Notes' },
    { id: 'io', label: 'Download/Upload Notes' },
    { id: 'study', label: 'Study' }
  ]

  return (
    <nav className="nav">
      {modules.map(mod => (
        <button
          key={mod.id}
          className={currentModule === mod.id ? 'active' : ''}
          onClick={() => setCurrentModule(mod.id)}
        >
          {mod.label}
        </button>
      ))}
    </nav>
  )
}
