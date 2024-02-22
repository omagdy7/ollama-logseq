import React, { KeyboardEventHandler, useEffect, useState } from 'react'
import { askAI, askWithContext, defineWord } from '../ollama';
import { Input } from '@/components/ui/input';

export const PromptAI = ({ type, theme }: { type: string, theme: string }) => {

  const placeholder = type.startsWith('ask') ? "Prompt..." : "Define..."
  const [inputValue, setInputValue] = useState('');
  const [hitEnter, setHitEnter] = useState(false)

  useEffect(() => {
    if (hitEnter) {
      logseq.hideMainUI()
      if (type === 'ask ai') {
        askAI(inputValue, "")
      } else if (type === 'define') {
        defineWord(inputValue)
      } else if (type === 'ask with page context') {
        askWithContext(inputValue, 'page')
      } else if (type === 'ask with block context') {
        askWithContext(inputValue, 'block')
      }
    }
  }, [hitEnter])

  const handleInputChange = (e: any) => {
    const query = e.target.value;
    setInputValue(query);
  };

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Enter') {
      setHitEnter(true)
    }
  }
  return (
    !hitEnter ? (
      <div className='w-screen text-center'>
        <Input
          autoFocus
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className={(theme === 'dark' ? "dark text-white dark:bg-gray-800" : "text-black bg-gray-200") + "px-2 py-1 rounded-md inline-block w-3/4"}
        />
      </div>
    ) : null
  )
}
