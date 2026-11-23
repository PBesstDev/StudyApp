// Basic Navigation Bar component; will possibly flesh it out later with more features
// For now it just switches between the three main modules of the app: Notes, Download/Upload, and Study.
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
