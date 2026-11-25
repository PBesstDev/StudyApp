import { useState, useEffect, useRef } from 'react'
import { loadSubjects, getSubjectCards } from '../utils/storage'
import { buildBST } from '../utils/search'
import { isLoggedIn, searchNotes } from '../utils/api'

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
  const [searchMode, setSearchMode] = useState('local') // 'local' or 'server'
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
    if (!searchQuery) return
    const start = performance.now()
    let results = []
    if (searchMode === 'server' && isLoggedIn()) {
      try {
        const data = await searchNotes(searchQuery)
        results = Array.isArray(data) ? data : (data.results || data.cards || [])
      } catch (err) {
        setSearchResults([{ keyword: 'Error', notes: err.message }])
        setSearchTime('')
        return
      }
    } else {
      const bst = buildBST(pile)
      results = bst.searchAll(searchQuery)
    }
    const time = (performance.now() - start).toFixed(2)
    setSearchResults(results)
    setSearchTime(`Found ${results.length} result(s) in ${time} ms`)
  }

  // Simple drag for magnifier
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
          <div ref={magRef} className="magnifier" style={{ position: 'absolute', top: 10, right: 10 }} onClick={() => setShowSearch(!showSearch)}>🔍</div>
          {showSearch && (
            <div className="popup" style={{ position: 'absolute' }}>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search keyword or phrase" />
              <label>
                <input type="radio" checked={searchMode === 'local'} onChange={() => setSearchMode('local')} /> Local pile
              </label>
              <label>
                <input type="radio" checked={searchMode === 'server'} onChange={() => setSearchMode('server')} disabled={!isLoggedIn()} /> Server (all subjects)
              </label>
              <button onClick={performSearch}>Search</button>
              <div>{searchTime}</div>
              <div style={{ maxHeight: 200, overflowY: 'auto', marginTop: 6 }}>
                {searchResults.map((r, i) => (
                  <div key={i} style={{ padding: 4, borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => alert(`${r.keyword || r.subject || ''}: ${r.notes || ''}`)}>
                    <strong>{r.keyword || '(no keyword)'}</strong>
                    {r.subject && <em> ({r.subject})</em>}
                    <div style={{ fontSize: '0.85em', color: '#555' }}>{(r.notes || '').slice(0, 120)}{(r.notes || '').length > 120 ? '…' : ''}</div>
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
