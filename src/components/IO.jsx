import { useState, useEffect } from 'react'
import { loadSubjects, getSubjectCards, saveSubjectCards, exportJSONL, importJSONL } from '../utils/storage'
import { isLoggedIn, listSubjects, downloadSubject, uploadCards } from '../utils/api'

export default function IO() {
  const [subjects, setSubjects] = useState({})
  const [selectedSubject, setSelectedSubject] = useState('')
  const [uploadSubject, setUploadSubject] = useState('')
  const [status, setStatus] = useState('')
  const [preview, setPreview] = useState([])
  const [serverSubjects, setServerSubjects] = useState([])
  const [pullStatus, setPullStatus] = useState('')

  useEffect(() => {
    setSubjects(loadSubjects())
    if (isLoggedIn()) {
      listSubjects()
        .then(subs => setServerSubjects(Array.isArray(subs) ? subs : subs.subjects || []))
        .catch(() => setServerSubjects([]))
    }
  }, [])

  const showPreview = (sub) => {
    setSelectedSubject(sub)
    setPreview(getSubjectCards(sub))
  }

  const download = async (format) => {
    if (!selectedSubject) return setStatus('Select a subject')
    if (!isLoggedIn()) return setStatus('Please log in to download from server')
    try {
      setStatus('Downloading from server...')
      const cards = await downloadSubject(selectedSubject, format)
      let content, filename
      if (format === 'jsonl') {
        content = cards.map(c => JSON.stringify({ subject: selectedSubject, keyword: c.keyword, notes: c.notes })).join('\n')
        filename = `${selectedSubject}.jsonl`
      } else {
        content = JSON.stringify({ subject: selectedSubject, cards }, null, 2)
        filename = `${selectedSubject}.json`
      }
      const blob = new Blob([content], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      setStatus(`Downloaded ${cards.length} cards from server`)
    } catch (err) {
      setStatus(`Download failed: ${err.message}`)
    }
  }

  const handleUpload = (e) => {
    const file = e.target.files[0]
    if (!file || !uploadSubject) return setStatus('Select file and enter subject')
    if (!isLoggedIn()) return setStatus('Please log in to upload to server')
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
        if (!cards.length) throw new Error('No valid cards')
        setStatus('Uploading to server...')
        await uploadCards(uploadSubject, cards)
        setStatus(`Uploaded ${cards.length} cards to server for "${uploadSubject}"`)
        // also save locally for immediate use
        saveSubjectCards(uploadSubject, cards)
        setSubjects(loadSubjects())
        const subs = await listSubjects()
        setServerSubjects(Array.isArray(subs) ? subs : subs.subjects || [])
      } catch (err) {
        setStatus(`Error: ${err.message}`)
      }
    }
    reader.readAsText(file)
  }

  const pullFromServer = async (subject) => {
    if (!isLoggedIn()) return setPullStatus('Please log in first')
    if (!subject) return setPullStatus('Select a server subject')
    try {
      setPullStatus('Pulling...')
      const cards = await downloadSubject(subject, 'json')
      saveSubjectCards(subject, cards)
      setSubjects(loadSubjects())
      setPullStatus(`Pulled ${cards.length} cards for "${subject}" into local storage`)
    } catch (err) {
      setPullStatus(`Pull failed: ${err.message}`)
    }
  }

  const pushToServer = async () => {
    if (!isLoggedIn()) return setPullStatus('Please log in first')
    if (!selectedSubject) return setPullStatus('Select a local subject to push')
    try {
      const cards = getSubjectCards(selectedSubject)
      if (!cards.length) return setPullStatus('No cards to push')
      setPullStatus('Pushing...')
      await uploadCards(selectedSubject, cards)
      setPullStatus(`Pushed ${cards.length} cards for "${selectedSubject}" to server`)
      // refresh server subjects
      const subs = await listSubjects()
      setServerSubjects(Array.isArray(subs) ? subs : subs.subjects || [])
    } catch (err) {
      setPullStatus(`Push failed: ${err.message}`)
    }
  }

  return (
    <div>
      <h2>Download / Upload Notes</h2>
      <div>
        <h3>Download</h3>
        <select onChange={e => showPreview(e.target.value)} value={selectedSubject}>
          <option value="">-- Select subject --</option>
          {(isLoggedIn() ? serverSubjects : Object.keys(subjects)).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => download('json')}>Download as JSON</button>
        <button onClick={() => download('jsonl')}>Download as JSONL</button>
        <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #ccc', marginTop: 10 }}>
          {preview.map((c, i) => (
            <div key={i} style={{ padding: 5, cursor: 'pointer' }} onClick={() => alert(`${c.keyword}: ${c.notes}`)}>
              {c.keyword || '(empty)'}
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3>Upload</h3>
        <input type="file" accept=".json,.jsonl" onChange={handleUpload} />
        <input value={uploadSubject} onChange={e => setUploadSubject(e.target.value)} placeholder="Study subject for upload" />
        <div>{status}</div>
      </div>

      {isLoggedIn() && (
        <div style={{ marginTop: 20, borderTop: '1px solid #ccc', paddingTop: 10 }}>
          <h3>Server Sync</h3>
          <div>
            <label>Pull from server subject: </label>
            <select onChange={e => pullFromServer(e.target.value)} defaultValue="">
              <option value="">-- Select --</option>
              {serverSubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button onClick={pushToServer} style={{ marginTop: 8 }}>Push current local subject to server</button>
          <div>{pullStatus}</div>
        </div>
      )}
    </div>
  )
}
