import { useState } from 'react'
import Nav from './components/Nav'
import Notes from './components/Notes'
import IO from './components/IO'
import Study from './components/Study'

function App() {
  const [currentModule, setCurrentModule] = useState('notes')

  return (
    <div className="app">
      <Nav currentModule={currentModule} setCurrentModule={setCurrentModule} />
      <main className="main">
        {currentModule === 'notes' && <Notes />}
        {currentModule === 'io' && <IO />}
        {currentModule === 'study' && <Study />}
      </main>
    </div>
  )
}

export default App
