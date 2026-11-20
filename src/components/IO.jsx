import { useState } from 'react'
import { getSubjects, getCards, setCards, exportSubjectJSONL, exportSubjectJSON, parseJSONL } from '../utils/storage.js'

export default function IO() {
  const [selected, setSelected] = useState('')
  const [uploadSubject, setUploadSubject] = useState('')
  const [status, setStatus] = useState('')

  const download = (asJSONL) => {
    if (!selected) return alert('Select subject')
    const content = asJSONL ? exportSubjectJSONL(selected) : exportSubjectJSON(selected)
    const blob = new Blob([content], { type: asJSONL ? 'application/jsonl' : 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${selected}.${asJSONL ? 'jsonl' : 'json'}`
    a.click()
  }

  const handleUpload = (e) => {
    const file = e.target.files[0]
    if (!file || !uploadSubject.trim()) return alert('File and subject required')
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        let cards = []
        if (file.name.endsWith('.jsonl')) {
          cards = parseJSONL(ev.target.result)
        } else {
          const parsed = JSON.parse(ev.target.result)
          cards = parsed.cards || (Array.isArray(parsed) ? parsed : [])
        }
        if (!cards.length) return setStatus('No valid cards')
        const existing = getSubjects().includes(uploadSubject)
        if (existing && !confirm(`Merge with existing "${uploadSubject}"?`)) return
        const current = existing ? getCards(uploadSubject) : []
        setCards(uploadSubject, [...current, ...cards])
        setStatus(`Uploaded ${cards.length} cards to ${uploadSubject}`)
      } catch (err) {
        setStatus('Invalid file: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  const cards = selected ? getCards(selected) : []

  return (
    <div className="module">
      <h2>Download / Upload Notes</h2>
      <select value={selected} onChange={e => setSelected(e.target.value)}>
        <option value="">Select subject</option>
        {getSubjects().map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <button onClick={() => download(false)}>Download .json</button>
      <button onClick={() => download(true)}>Download .jsonl</button>
      <div style={{maxHeight: 200, overflow: 'auto', border: '1px solid #ccc', margin: '10px 0'}}>
        {cards.map((c, i) => <div key={i} className="keyword-item">{c.keyword || '(empty)'}</div>)}
      </div>
      <hr />
      <input type="file" accept=".json,.jsonl" onChange={handleUpload} />
      <input value={uploadSubject} onChange={e => setUploadSubject(e.target.value)} placeholder="Subject for upload" />
      <div>{status}</div>
    </div>
  )
}
