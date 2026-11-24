import { useState, useEffect } from 'react'
import { loadSubjects, getSubjectCards, saveSubjectCards, exportJSONL, importJSONL } from '../utils/storage'

// In/Out component for downloading and uploading notes/ "Download/Upload Notes" section of the app
export default function IO() {
  const [subjects, setSubjects] = useState({})
  const [selectedSubject, setSelectedSubject] = useState('')
  const [uploadSubject, setUploadSubject] = useState('')
  const [status, setStatus] = useState('')
  const [preview, setPreview] = useState([])

  useEffect(() => {
    setSubjects(loadSubjects())
  }, [])

  // Show a preview of the selected subject's cards
  const showPreview = (subject) => {
    setSelectedSubject(subject)
    setPreview(getSubjectCards(subject))
  }

  // Download the selected subject's cards in the specified format (JSON or JSONL)
  const download = (format) => {
    if (!selectedSubject) return setStatus('Select a subject')

    // Try-catchh block to handle any errors during the download process
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

      // Create a blob and trigger the download
      const blob = new Blob([content], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()

      // Free memory after the download starts
      setTimeout(() => URL.revokeObjectURL(url), 1000)

      setStatus(`Downloaded ${filename}`)
    } catch (err) {
      console.error('Export failed', err)
      setStatus(`Export failed: ${err.message || 'unknown error'}`)
    }
  }

  // Upload file and merge with existing cards if necessary
  const handleUpload = (e) => {
    const file = e.target.files[0]
    if (!file || !uploadSubject) return setStatus('Select file and enter subject')

    const reader = new FileReader()

    reader.onload = (ev) => {
      try {
        // Determine the file type and parse accordingly
        let cards = []
        if (file.name.endsWith('.jsonl')) {
          cards = importJSONL(ev.target.result)
        } else {
          const data = JSON.parse(ev.target.result)
          cards = data.cards || []
        }
        if (!cards.length) throw new Error('No valid cards')

        // If the subject already exists, ask the user if they want to merge the new cards with the existing ones
        const existing = getSubjectCards(uploadSubject)
        if (existing.length > 0) {
          if (window.confirm(`Subject "${uploadSubject}" exists. Merge?`)) {
            cards = [...existing, ...cards]
          }
        }

        // Save the uploaded cards and update the state
        saveSubjectCards(uploadSubject, cards)
        setStatus(`Uploaded ${cards.length} cards`)
        setSubjects(loadSubjects())
      } catch (err) {
        setStatus(`Error: ${err.message}`)
      }
    }

    reader.readAsText(file)

  }

  // Actual In/Out component rendering
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
