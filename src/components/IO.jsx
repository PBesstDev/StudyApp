import { useState, useEffect } from 'react'
import { loadSubjects, getSubjectCards, saveSubjectCards, exportJSONL, importJSONL } from '../utils/storage'

export default function IO() {
  const [subjects, setSubjects] = useState({})
  const [selectedSubject, setSelectedSubject] = useState('')
  const [uploadSubject, setUploadSubject] = useState('')
  const [status, setStatus] = useState('')
  const [preview, setPreview] = useState([])

  useEffect(() => {
    setSubjects(loadSubjects())
  }, [])

  const showPreview = (sub) => {
    setSelectedSubject(sub)
    setPreview(getSubjectCards(sub))
  }

  const download = (format) => {
    if (!selectedSubject) return setStatus('Select a subject')
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
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename
    a.click()
  }

  const handleUpload = (e) => {
    const file = e.target.files[0]
    if (!file || !uploadSubject) return setStatus('Select file and enter subject')
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        let cards = []
        if (file.name.endsWith('.jsonl')) {
          cards = importJSONL(ev.target.result)
        } else {
          const data = JSON.parse(ev.target.result)
          cards = data.cards || []
        }
        if (!cards.length) throw new Error('No valid cards')
        const existing = getSubjectCards(uploadSubject)
        if (existing.length > 0) {
          if (window.confirm(`Subject "${uploadSubject}" exists. Merge?`)) {
            cards = [...existing, ...cards]
          }
        }
        saveSubjectCards(uploadSubject, cards)
        setStatus(`Uploaded ${cards.length} cards`)
        setSubjects(loadSubjects())
      } catch (err) {
        setStatus(`Error: ${err.message}`)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div>
      <h2>Download / Upload Notes</h2>
      <div>
        <h3>Download</h3>
        <select onChange={e => showPreview(e.target.value)} value={selectedSubject}>
          <option value="">-- Select subject --</option>
          {Object.keys(subjects).map(s => <option key={s} value={s}>{s}</option>)}
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
    </div>
  )
}
