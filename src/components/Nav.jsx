// Return the navigation bar and switch between the Notes, Download/Upload, and Study modules
export default function Nav({ currentModule, setCurrentModule }) {
  // Create a scoped constant containing the available navigation modules
  const modules = [
    { id: 'notes', label: 'Take Notes' },
    { id: 'io', label: 'Download/Upload Notes' },
    { id: 'study', label: 'Study' }
  ]

  // Return the actual JSX component for the navigation bar
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
