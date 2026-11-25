import { useState, useEffect, useRef } from 'react'
import { loadSubjects, getSubjectCards } from '../utils/storage'
import { buildBST } from '../utils/search'
import { search as serverSearch, isLoggedIn } from '../utils/api'

export default function Study() {
  const [subjects, setSubjects] = useState({})
  const [selectedSubject, setSelectedSubject] = useState('')
  const [mode, setMode] = useState('keywords')
  const [pile, setPile] = useState([])
  const [currentCard, setCurrentCard] = useState(null)
  const [isFlipped, setIsFlipped] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState('')
  const [searchTime, setSearchTime] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const magRef = useRef(null)

  useEffect(() => {
    setSubjects(loadSubjects())
  }, [])

  // Start study session
  const startStudy = () => {
    if (!selectedSubject) return alert('Select subject')
    const cards = getSubjectCards(selectedSubject)
    if (!cards.length) return alert('No cards')
    setPile([...cards])
    showNext([...cards])
  }

  // Show the next card from the pile, randomly selecting one
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

  // Discard the current card, removing it from the pile of potential cards, 
  // then show the next card in pile
  const discard = () => {
    const newPile = pile.filter(c => c !== currentCard)
    setPile(newPile)
    showNext(newPile)
  }

  const keep = () => showNext()

  // Perform a search on the current pile of cards using a binary search tree.
  // Keeping a timer on the search tree since we will eventually move to a vector search tree.
  const performSearch = async () => {
    if (!searchQuery) return
    const start = performance.now()
    try {
      if (isLoggedIn()) {
        // Database search - returns all matches
        const results = await serverSearch(searchQuery)
        const time = (performance.now() - start).toFixed(2)
        if (results.length === 0) {
          setSearchResult('Nothing found in database')
        } else {
          const list = results.map(r => `${r.subject}: ${r.keyword}`).join('\n')
          setSearchResult(`Found ${results.length} match(es):\n${list}`)
        }
        setSearchTime(`Server search took ${time} ms`)
      } else {
        // Fallback to local BST on current pile
        const bst = buildBST(pile)
        const found = bst.search(searchQuery)
        const time = (performance.now() - start).toFixed(2)
        setSearchResult(found ? `Found (local): ${found.keyword}` : 'Nothing found')
        setSearchTime(`Local search took ${time} ms`)
      }
    } catch (err) {
      setSearchResult('Search error: ' + err.message)
    }
  }

  // Simple drag for "Search" magnifier icon, allowing user to move it around the screen. 
  // Ideally, I'd want for the entire UI to be customizable to fit the end user's needs
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

  // Actual component rendering
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
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search" />
              <button onClick={performSearch}>Search</button>
              <div style={{ whiteSpace: "pre-wrap" }}>{searchResult}</div>
              <div>{searchTime}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
