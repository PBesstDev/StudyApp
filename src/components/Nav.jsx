function Nav({ currentView, setCurrentView }) {
  return (
    <nav id="top-nav">
      <button className={currentView === 'notes' ? 'active' : ''} onClick={() => setCurrentView('notes')}>
        Take Notes
      </button>
      <button className={currentView === 'transfer' ? 'active' : ''} onClick={() => setCurrentView('transfer')}>
        Download/Upload Notes
      </button>
      <button className={currentView === 'study' ? 'active' : ''} onClick={() => setCurrentView('study')}>
        Study
      </button>
    </nav>
  )
}

export default Nav
