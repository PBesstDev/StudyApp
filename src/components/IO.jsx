import { useState, useEffect } from 'react'
import { loadSubjects, getSubjectCards, saveSubjectCards, exportJSONL, importJSONL } from '../utils/storage'
import { isLoggedIn, getSubjects, downloadCards, uploadCards, login, register, logout, getUsername } from '../utils/api'

export default function IO() {
  const [subjects, setSubjects] = useState({})
  const [selectedSubject, setSelectedSubject] = useState('')
  const [uploadSubject, setUploadSubject] = useState('')
  const [status, setStatus] = useState('')
  const [preview, setPreview] = useState([])
  const [username, setUsernameInput] = useState('')
  const [password, setPassword] = useState('')
  const [loggedIn, setLoggedIn] = useState(isLoggedIn())
  const [currentUser, setCurrentUser] = useState(getUsername())

  // Load subjects from local storage and server on component mount
  // or when loggedIn changes
  useEffect(() => {
    const local = loadSubjects()
    setSubjects(local)
    if (loggedIn) {
      loadFromServer()
    }
  }, [loggedIn])

  // Load subjects from the server and merge with local subjects
  const loadFromServer = async () => {
    try {
      const serverSubs = await getSubjects()
      const local = loadSubjects()
      const merged = { ...local }
      for (const s of serverSubs) {
        if (!merged[s]) merged[s] = []
      }
      setSubjects(merged)
      setStatus('Loaded subjects from server')
    } catch (err) {
      setStatus('Could not load subjects from server: ' + err.message)
    }
  }

  // Show a preview of cards for the selected subject
  const showPreview = (subject) => {
    setSelectedSubject(subject)
    setPreview(getSubjectCards(subject))
  }

  // Download cards for the selected subject in the specified format (JSON or JSONL)
  const downloadLocal = (format) => {
    if (!selectedSubject) return setStatus('Select a subject')
    try {
      const cards = getSubjectCards(selectedSubject)
      let content, filename
      if (format === 'jsonl') {
        content = exportJSONL(selectedSubject)
        filename = `${selectedSubject}.jsonl`
      } else {
        content = JSON.stringify({ subject: selectedSubject, cards }, null, 2)
        filename = `${selectedSubject}.json`
      }
      const blob = new Blob([content], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setStatus(`Downloaded local ${filename}`)
    } catch (err) {
      setStatus(`Export failed: ${err.message}`)
    }
  }

  // Pull cards from the server for the selected subject
  const pullFromServer = async () => {
    if (!selectedSubject) return setStatus('Select a subject')
    if (!loggedIn) return setStatus('Please log in first')
    try {
      const cards = await downloadCards(selectedSubject)
      saveSubjectCards(selectedSubject, cards)
      setPreview(cards)
      setSubjects(loadSubjects())
      setStatus(`Pulled ${cards.length} cards from server into "${selectedSubject}"`)
    } catch (err) {
      setStatus('Pull from server failed: ' + err.message)
    }
  }

  // Push cards to the server for the selected subject
  const pushToServer = async () => {
    if (!selectedSubject) return setStatus('Select a subject')
    if (!loggedIn) return setStatus('Please log in first')
    try {
      const cards = getSubjectCards(selectedSubject)
      await uploadCards(selectedSubject, cards)
      setStatus(`Pushed ${cards.length} cards to server for "${selectedSubject}"`)
    } catch (err) {
      setStatus('Push to server failed: ' + err.message)
    }
  }

  // Handle file upload for importing cards to a subject
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file || !uploadSubject) return setStatus('Select file and enter subject')
    if (!loggedIn) return setStatus('Please log in to upload to server')

    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        let cards = []
        if (file.name.endsWith('.jsonl')) {
          cards = importJSONL(ev.target.result)
        } else {
          const data = JSON.parse(ev.target.result)
          cards = data.cards || []
        }
        if (!cards.length) throw new Error('No valid cards in file')

        // Upload to server
        await uploadCards(uploadSubject, cards)
        // Also save locally
        saveSubjectCards(uploadSubject, cards)
        setSubjects(loadSubjects())
        setStatus(`Uploaded ${cards.length} cards from file to server for "${uploadSubject}"`)
      } catch (err) {
        setStatus(`Upload error: ${err.message}`)
      }
    }
    reader.readAsText(file)
  }

  // Login form submission
  const handleLogin = async () => {
    try {
      await login(username, password)
      setLoggedIn(true)
      setCurrentUser(username)
      setStatus('Logged in successfully')
      setUsernameInput('')
      setPassword('')
    } catch (err) {
      setStatus('Login failed: ' + err.message)
    }
  }

  // Registration form submission
  const handleRegister = async () => {
    try {
      await register(username, password)
      setLoggedIn(true)
      setCurrentUser(username)
      setStatus('Registered and logged in')
      setUsernameInput('')
      setPassword('')
    } catch (err) {
      setStatus('Register failed: ' + err.message)
    }
  }

  // Logout logic
  const handleLogout = () => {
    logout()
    setLoggedIn(false)
    setCurrentUser(null)
    setStatus('Logged out')
  }

  return (
    <div>
      <h2>Download / Upload Notes</h2>
      {!loggedIn ? (
        <div>
          <h3>Login or Register to use server</h3>
          <input value={username} onChange={e => setUsernameInput(e.target.value)} placeholder="Username" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
          <button onClick={handleLogin}>Login</button>
          <button onClick={handleRegister}>Register</button>
          <div>{status}</div>
        </div>
      ) : (
        <div>
          <p>Logged in as <strong>{currentUser}</strong> <button onClick={handleLogout}>Logout</button></p>
          <div>
            <h3>Subject Actions</h3>
            <select onChange={e => showPreview(e.target.value)} value={selectedSubject}>
              <option value="">-- Select subject --</option>
              {Object.keys(subjects).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={pullFromServer}>Pull from Server</button>
            <button onClick={pushToServer}>Push to Server</button>
            <button onClick={() => downloadLocal('json')}>Download local as JSON</button>
            <button onClick={() => downloadLocal('jsonl')}>Download local as JSONL</button>
            <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #ccc', marginTop: 10 }}>
              {preview.map((c, i) => (
                <div key={i} style={{ padding: 5, cursor: 'pointer' }} onClick={() => alert(`${c.keyword}: ${c.notes}`)}>
                  {c.keyword || '(empty)'}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3>Upload file to Server</h3>
            <input type="file" accept=".json,.jsonl" onChange={handleFileUpload} />
            <input value={uploadSubject} onChange={e => setUploadSubject(e.target.value)} placeholder="Subject for upload" />
            <div>{status}</div>
          </div>
        </div>
      )}
    </div>
  )
}
