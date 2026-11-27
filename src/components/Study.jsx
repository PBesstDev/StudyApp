import { useState, useEffect, useRef } from 'react'
import { loadSubjects, getSubjectCards, saveSubjectCards } from '../utils/storage'
import { buildBST } from '../utils/search'
import { search as serverSearch, isLoggedIn, downloadCards } from '../utils/api'

export default function Study() {
  // Create scoped constants for subjects, study mode, card pile, search state, and UI state
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

  // Load subjects from local storage when the component mounts
  useEffect(() => {
    setSubjects(loadSubjects())
  }, [])

  // Load cards for the selected subject into the study pile and begin study
  const startStudy = () => {
    // Return early if no subject or cards are available
    if (!selectedSubject) return alert('Select subject')
    const cards = getSubjectCards(selectedSubject)
    if (!cards.length) return alert('No cards')
    setPile([...cards])
    showNext([...cards])
  }

  // Show a random next card from the pile, or clear the current card if the pile is empty
  const showNext = (currentPile = pile) => {
    if (!currentPile.length) {
      setCurrentCard(null)
      return
    }
    // Create a scoped constant for a random card index and display that card
    const idx = Math.floor(Math.random() * currentPile.length)
    setCurrentCard(currentPile[idx])
    setIsFlipped(false)
  }

  // Toggle whether the current flashcard is flipped
  const flip = () => setIsFlipped(!isFlipped)

  // Discard the current card from the pile and show the next card
  const discard = () => {
    // Create a scoped constant containing the remaining cards
    const newPile = pile.filter(c => c !== currentCard)
    setPile(newPile)
    showNext(newPile)
  }

  // Keep the current card and show the next card
  const keep = () => showNext()

  // Search the server when logged in, or search the current pile locally
  const performSearch = async () => {
    // Return early if the search query is empty
    if (!searchQuery.trim()) return
    const start = performance.now()
    try {
      let results = []
      if (isLoggedIn()) {
        results = await serverSearch(searchQuery)
      } else {
        // Filter the current pile as a local fallback
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
      // Report any search error
      setSearchResults([])
      setSearchTime('Search error: ' + err.message)
    }
  }

  // Select a search result and load its card into the study view
  const selectResult = async (result) => {
    try {
      // Create a scoped constant for locally stored cards and load server cards when needed
      let cards = getSubjectCards(result.subject)
      if (isLoggedIn() && cards.length === 0) {
        cards = await downloadCards(result.subject)
        if (cards.length) saveSubjectCards(result.subject, cards)
      }
      // Update the selected subject and selected study card
      setSelectedSubject(result.subject)
      setPile(cards)
      const match = cards.find(c => c.keyword === result.keyword && c.notes === result.notes) || cards[0]
      setCurrentCard(match || null)
      setIsFlipped(false)
      setShowSearch(false)
      setSearchResults([])
    } catch (err) {
      // Report any card loading error
      alert('Could not load card: ' + err.message)
    }
  }

  // Make the magnifier icon draggable while the component is mounted
  useEffect(() => {
    // Create scoped constants for the magnifier element and dragging state
    const el = magRef.current
    if (!el) return
    let isDragging = false, offsetX, offsetY
    // Track the mouse position and calculate the drag offset
    const onMouseDown = (e) => {
      isDragging = true
      offsetX = e.clientX - el.getBoundingClientRect().left
      offsetY = e.clientY - el.getBoundingClientRect().top
    }
    // Move the magnifier while dragging
    const onMouseMove = (e) => {
      if (isDragging) {
        el.style.left = (e.clientX - offsetX) + 'px'
        el.style.top = (e.clientY - offsetY) + 'px'
      }
    }
    // Stop dragging when the mouse is released
    const onMouseUp = () => { isDragging = false }
    // Attach the drag event listeners and remove them on unmount
    el.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      el.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  // Return the actual JSX component for study mode, search, and flashcards
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
