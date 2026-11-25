import { useState, useEffect, useRef } from 'react'
import { loadSubjects, getSubjectCards, saveSubjectCards } from '../utils/storage'
import { buildBST } from '../utils/search'
import { search as serverSearch, isLoggedIn, downloadCards } from '../utils/api'

export default function Study() {
  const [subjects, setSubjects] = useState({})
  const [selectedSubject, setSelectedSubject] = useState('')
  const [mode, setMode] = useState('keywords')
  const [pile, setPile] = useState([])
  const [currentCard, setCurrentCard] = useState(null)
  const [isFlipped, setIsFlipped] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchTime, setSearchTime] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const magRef = useRef(null)

  useEffect(() => {
    setSubjects(loadSubjects())
  }, [])

  const startStudy = () => {
    if (!selectedSubject) return alert('Select subject')
    const cards = getSubjectCards(selectedSubject)
    if (!cards.length) return alert('No cards')
    setPile([...cards])
    showNext([...cards])
  }

  const showNext = (currentPile = pile) => {
    if (!currentPile.length) {
      setCurrentCard(null)
      return
    }
    const idx = Math.floor(Math.random() * currentPile.length)
    setCurrentCard(currentPile[idx])
    setIsFlipped(false)
  }

  const flip = () => setIsFlipped(!isFlipped)

  const discard = () => {
    const newPile = pile.filter(c => c !== currentCard)
    setPile(newPile)
    showNext(newPile)
  }

  const keep = () => showNext()

  const performSearch = async () => {
    if (!searchQuery.trim()) return
    const start = performance.now()
    try {
      let results = []
      if (isLoggedIn()) {
        results = await serverSearch(searchQuery)
      } else {
        // Local fallback: filter current pile
        const lower = searchQuery.toLowerCase()
        results = pile.filter(c =>
          (c.keyword && c.keyword.toLowerCase().includes(lower)) ||
          (c.notes && c.notes.toLowerCase().includes(lower))
        ).map(c => ({ subject: selectedSubject, keyword: c.keyword, notes: c.notes }))
      }
      const time = (performance.now() - start).toFixed(2)
      setSearchResults(results)
      setSearchTime(`Search took ${time} ms (${results.length} matches)`)
    } catch (err) {
      setSearchResults([])
      setSearchTime('Search error: ' + err.message)
    }
  }

  const selectResult = async (result) => {
    try {
      let cards = getSubjectCards(result.subject)
      if (isLoggedIn() && cards.length === 0) {
        cards = await downloadCards(result.subject)
        if (cards.length) saveSubjectCards(result.subject, cards)
      }
      setSelectedSubject(result.subject)
      setPile(cards)
      const match = cards.find(c => c.keyword === result.keyword && c.notes === result.notes) || cards[0]
      setCurrentCard(match || null)
      setIsFlipped(false)
      setShowSearch(false)
      setSearchResults([])
    } catch (err) {
      alert('Could not load card: ' + err.message)
    }
  }

  useEffect(() => {
    const el = magRef.current
    if (!el) return
    let isDragging = false, offsetX, offsetY
    const onMouseDown = (e) => {
      isDragging = true
      offsetX = e.clientX - el.getBoundingClientRect().left
      offsetY = e.clientY - el.getBoundingClientRect().top
    }
    const onMouseMove = (e) => {
      if (isDragging) {
        el.style.left = (e.clientX - offsetX) + 'px'
        el.style.top = (e.clientY - offsetY) + 'px'
      }
    }
    const onMouseUp = () => { isDragging = false }
    el.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      el.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return (
    <div>
      <h2>Study</h2>
      <div>
        <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
          <option value="">-- Select subject --</option>
          {Object.keys(subjects).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <label><input type="radio" name="mode" value="keywords" checked={mode === 'keywords'} onChange={() => setMode('keywords')} /> Test Keywords</label>
        <label><input type="radio" name="mode" value="definitions" checked={mode === 'definitions'} onChange={() => setMode('definitions')} /> Test Definitions</label>
        <button onClick={startStudy}>Start Study</button>
      </div>
      {currentCard && (
        <div style={{ position: 'relative', minHeight: 300 }}>
          <div className="flashcard" onClick={flip}>
            {mode === 'keywords'
              ? (isFlipped ? currentCard.keyword : currentCard.notes)
              : (isFlipped ? currentCard.notes : currentCard.keyword)}
          </div>
          <div style={{ marginTop: 10 }}>
            <button onClick={discard}>Swipe Left (Discard)</button>
            <button onClick={keep}>Swipe Right (Keep)</button>
          </div>
          <div ref={magRef} className="magnifier" style={{ position: 'absolute', top: 10, right: 10, cursor: 'pointer' }} onClick={() => setShowSearch(!showSearch)}>Search</div>
          {showSearch && (
            <div className="popup" style={{ position: 'absolute', background: '#fff', border: '1px solid #ccc', padding: 10, zIndex: 10, maxWidth: 400 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>Search</strong>
                <button onClick={() => { setShowSearch(false); setSearchResults([]) }}>Close</button>
              </div>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Keyword or phrase" style={{ width: '100%', margin: '8px 0' }} />
              <button onClick={performSearch}>Search</button>
              <div>{searchTime}</div>
              <div style={{ maxHeight: 200, overflowY: 'auto', marginTop: 8 }}>
                {searchResults.length === 0 && searchTime && <div>No matches</div>}
                {searchResults.map((r, i) => (
                  <div key={i} style={{ padding: 4, cursor: 'pointer', borderBottom: '1px solid #eee' }} onClick={() => selectResult(r)}>
                    <strong>{r.subject}</strong>: {r.keyword}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
