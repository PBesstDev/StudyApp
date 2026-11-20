import { useState } from 'react'
import Nav from './components/Nav'
import Notes from './components/Notes'
import IO from './components/IO'
import Study from './components/Study'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('notes')

  return (
    <div className="App">
      <Nav currentView={currentView} setCurrentView={setCurrentView} />
      <main>
        {currentView === 'notes' && <Notes />}
        {currentView === 'transfer' && <IO />}
        {currentView === 'study' && <Study />}
      </main>
    </div>
  )
}

export default App
