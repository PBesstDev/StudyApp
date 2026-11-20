import { useState, useEffect } from 'react'
import { getSubjects, getCards } from '../utils/storage.js'

export default function Study() {
  const [subject, setSubject] = useState('')
  const [mode, setMode] = useState('keyword')
  const [pile, setPile] = useState([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState(null)

  const start = () => {
    if (!subject) return alert('Select subject')
    const cards = getCards(subject)
    if (!cards.length) return alert('No cards')
    setPile([...cards].sort(() => Math.random() - 0.5))
    setIndex(0)
    setFlipped(false)
  }

  const current = pile[index] || {}

  const swipe = (dir) => {
    if (dir < 0) {
      // discard
      setPile(p => p.filter((_, i) => i !== index))
    } else {
      // keep - move to end
      setPile(p => {
        const copy = [...p]
        const [card] = copy.splice(index, 1)
        copy.push(card)
        return copy
      })
    }
    setIndex(0)
    setFlipped(false)
  }

  const doSearch = () => {
    if (!searchQuery || !pile.length) return
    const startTime = performance.now()
    // simple linear for demo; BST can be integrated
    const found = pile.find(c => 
      (c.keyword || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.notes || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
    const time = (performance.now() - startTime).toFixed(2)
    setSearchResult(found ? { card: found, time } : { none: true, time })
  }

  return (
    <div className="module">
      <h2>Study</h2>
      <select value={subject} onChange={e => setSubject(e.target.value)}>
        <option value="">Select subject</option>
        {getSubjects().map(s => <option key={s}>{s}</option>)}
      </select>
      <label><input type="radio" checked={mode === 'keyword'} onChange={() => setMode('keyword')} /> Test Keywords</label>
      <label><input type="radio" checked={mode === 'definition'} onChange={() => setMode('definition')} /> Test Definitions</label>
      <button onClick={start}>Start</button>
      {pile.length > 0 && (
        <div>
          <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
            <div className="front">{mode === 'keyword' ? (current.notes || 'No notes') : (current.keyword || 'No keyword')}</div>
            <div className="back">{mode === 'keyword' ? (current.keyword || 'No keyword') : (current.notes || 'No notes')}</div>
          </div>
          <p>Remaining: {pile.length}</p>
          <button onClick={() => swipe(-1)}>Swipe Left (Discard)</button>
          <button onClick={() => swipe(1)}>Swipe Right (Keep)</button>
          <div className="magnifier" title="Search">🔍</div>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." />
          <button onClick={doSearch}>Search</button>
          {searchResult && (
            <p>{searchResult.none ? `Nothing found (${searchResult.time}ms)` : `Found: ${searchResult.card.keyword} (${searchResult.time}ms)`}</p>
          )}
        </div>
      )}
    </div>
  )
}
