import { useState } from 'react'
import Nav from './components/Nav.jsx'
import Notes from './components/Notes.jsx'
import IO from './components/IO.jsx'
import Study from './components/Study.jsx'

function App() {
  const [currentModule, setCurrentModule] = useState('notes')

  return (
    <div>
      <Nav current={currentModule} onChange={setCurrentModule} />
      <main>
        {currentModule === 'notes' && <Notes />}
        {currentModule === 'io' && <IO />}
        {currentModule === 'study' && <Study />}
      </main>
    </div>
  )
}

export default App
