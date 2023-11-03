import React, { useEffect, useRef, useState } from 'react'
import { askAI, defineWord, DivideTaskIntoSubTasks } from '../ollama';

export const PromptAI = ({ type }) => {

  const placeholder = type === 'prompt' ? "Prompt..." : "Define..."
  const [inputValue, setInputValue] = useState('');
  const [hitEnter, setHitEnter] = useState(false)

  useEffect(() => {
    if (hitEnter) {
      if (type === 'prompt') {
        askAI(inputValue)
      } else {
        defineWord(inputValue)
      }
    }
  }, [hitEnter])

  const handleInputChange = (e) => {
    const query = e.target.value;
    setInputValue(query);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setHitEnter(true)
    }
  }
  return (
    !hitEnter ? (
      <div className='w-screen text-center'>
        <input
          autoFocus
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="bg-gray-700 text-white px-2 py-1 rounded-md dark:bg-gray-800 inline-block w-3/4"
        />
      </div>
    ) : null
  )
}
