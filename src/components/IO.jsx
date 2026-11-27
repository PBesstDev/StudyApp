import { useState, useEffect } from 'react'
import { loadSubjects, getSubjectCards, saveSubjectCards, exportJSONL, importJSONL } from '../utils/storage'
import { isLoggedIn, getSubjects, downloadCards, uploadCards, login, register, logout, getUsername } from '../utils/api'

export default function IO() {
  // Create scoped constants for subjects, selections, status, preview data, and authentication
  const [subjects, setSubjects] = useState({})
  const [selectedSubject, setSelectedSubject] = useState('')
  const [uploadSubject, setUploadSubject] = useState('')
  const [status, setStatus] = useState('')
  const [preview, setPreview] = useState([])
  const [username, setUsernameInput] = useState('')
  const [password, setPassword] = useState('')
  const [loggedIn, setLoggedIn] = useState(isLoggedIn())
  const [currentUser, setCurrentUser] = useState(getUsername())

  // Load subjects from local storage and the server when the component mounts
  // or when the logged-in state changes
  useEffect(() => {
    // Create a scoped constant, load subjects from local storage into it, and set the subjects state
    const local = loadSubjects()
    setSubjects(local)
    // If logged in, also load subjects from the server
    if (loggedIn) {
      loadFromServer()
    }
  }, [loggedIn])

  // Load subjects from the server and merge them with local subjects
  const loadFromServer = async () => {
    try {
      // Create scoped constants for the server subjects, local subjects, and merged subject list
      const serverSubs = await getSubjects()
      const local = loadSubjects()
      const merged = { ...local }
      for (const s of serverSubs) {
        if (!merged[s]) merged[s] = []
      }
      setSubjects(merged)
      setStatus('Loaded subjects from server')
    } catch (err) {
      // Report any server subject loading error
      setStatus('Could not load subjects from server: ' + err.message)
    }
  }

  // Set the selected subject and show a preview of its locally stored cards
  const showPreview = (subject) => {
    // Store the selected subject and load its cards into the preview
    setSelectedSubject(subject)
    setPreview(getSubjectCards(subject))
  }

  // Download cards for the selected subject in JSON or JSONL format
  const downloadLocal = (format) => {
    // Return early if no subject is selected
    if (!selectedSubject) return setStatus('Select a subject')
    try {
      // Create scoped constants for the selected subject's cards and download properties
      const cards = getSubjectCards(selectedSubject)
      let content, filename
      if (format === 'jsonl') {
        content = exportJSONL(selectedSubject)
        filename = `${selectedSubject}.jsonl`
      } else {
        content = JSON.stringify({ subject: selectedSubject, cards }, null, 2)
        filename = `${selectedSubject}.json`
      }
      // Create and activate a temporary download link
      const blob = new Blob([content], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      // Release the temporary object URL after the download starts
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setStatus(`Downloaded local ${filename}`)
    } catch (err) {
      // Report any export error
      setStatus(`Export failed: ${err.message}`)
    }
  }

  // Pull cards from the server for the selected subject and save them locally
  const pullFromServer = async () => {
    // Return early if no subject is selected or the user is not logged in
    if (!selectedSubject) return setStatus('Select a subject')
    if (!loggedIn) return setStatus('Please log in first')
    try {
      // Download the cards and update local storage, the preview, and the subject list
      const cards = await downloadCards(selectedSubject)
      saveSubjectCards(selectedSubject, cards)
      setPreview(cards)
      setSubjects(loadSubjects())
      setStatus(`Pulled ${cards.length} cards from server into "${selectedSubject}"`)
    } catch (err) {
      // Report any server pull error
      setStatus('Pull from server failed: ' + err.message)
    }
  }

  // Push locally stored cards to the server for the selected subject
  const pushToServer = async () => {
    // Return early if no subject is selected or the user is not logged in
    if (!selectedSubject) return setStatus('Select a subject')
    if (!loggedIn) return setStatus('Please log in first')
    try {
      // Create a scoped constant for the selected subject's cards and upload them
      const cards = getSubjectCards(selectedSubject)
      await uploadCards(selectedSubject, cards)
      setStatus(`Pushed ${cards.length} cards to server for "${selectedSubject}"`)
    } catch (err) {
      // Report any server push error
      setStatus('Push to server failed: ' + err.message)
    }
  }

  // Handle file selection and import cards into the selected upload subject
  const handleFileUpload = (e) => {
    // Create a scoped constant for the selected file and validate the upload fields
    const file = e.target.files[0]
    if (!file || !uploadSubject) return setStatus('Select file and enter subject')
    if (!loggedIn) return setStatus('Please log in to upload to server')

    // Read the selected file and process it after loading completes
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        // Create a scoped constant and parse cards from JSONL or JSON content
        let cards = []
        if (file.name.endsWith('.jsonl')) {
          cards = importJSONL(ev.target.result)
        } else {
          const data = JSON.parse(ev.target.result)
          cards = data.cards || []
        }
        if (!cards.length) throw new Error('No valid cards in file')

        // Upload the cards to the server
        await uploadCards(uploadSubject, cards)
        // Also save the cards locally
        saveSubjectCards(uploadSubject, cards)
        setSubjects(loadSubjects())
        setStatus(`Uploaded ${cards.length} cards from file to server for "${uploadSubject}"`)
      } catch (err) {
        // Report any file parsing or upload error
        setStatus(`Upload error: ${err.message}`)
      }
    }
    // Start reading the selected file as text
    reader.readAsText(file)
  }

  // Submit the login form and update the current user state
  const handleLogin = async () => {
    try {
      // Log in and refresh the authentication state
      await login(username, password)
      setLoggedIn(true)
      setCurrentUser(username)
      setStatus('Logged in successfully')
      setUsernameInput('')
      setPassword('')
    } catch (err) {
      // Report any login error
      setStatus('Login failed: ' + err.message)
    }
  }

  // Submit the registration form and update the current user state
  const handleRegister = async () => {
    try {
      // Register and log in the new user
      await register(username, password)
      setLoggedIn(true)
      setCurrentUser(username)
      setStatus('Registered and logged in')
      setUsernameInput('')
      setPassword('')
    } catch (err) {
      // Report any registration error
      setStatus('Register failed: ' + err.message)
    }
  }

  // Log out the current user and reset the authentication state
  const handleLogout = () => {
    logout()
    setLoggedIn(false)
    setCurrentUser(null)
    setStatus('Logged out')
  }

  // Return the actual JSX component for local and server note import and export
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
