import React, { useState, useEffect, useRef } from 'react';
import { DivideTaskIntoSubTasks, summarize } from '../ollama';
import { PromptAI } from './PromptAI';


function CommandPalette({ options }) {
  console.log("rendered commana pallate")
  const [inputValue, setInputValue] = useState('');
  const [selectedOption, setSelectedOption] = useState<{ label: string }>({ label: "Ask Ai" });
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [isExecute, setIsExecute] = useState(false)
  const inputRef = useRef(null);

  useEffect(() => {
    // Initially, select the first option.
    if (filteredOptions.length > 0) {
      setSelectedOption(filteredOptions[0]);
    }
  }, [filteredOptions]);


  const handleInputChange = (e) => {
    const query = e.target.value;
    setInputValue(query);

    // Filter options based on the input.
    const results = options.filter((option: { label: string }) =>
      option.label.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredOptions(results);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Tab') {
      e.preventDefault();

      const currentIndex = filteredOptions.indexOf(selectedOption);
      let newIndex = currentIndex;

      if (e.key === 'ArrowUp' || (e.shiftKey && e.key == 'Tab')) {
        newIndex = (currentIndex - 1 + filteredOptions.length) % filteredOptions.length;
      } else if (e.key === 'ArrowDown' || e.key === 'Tab') {
        newIndex = (currentIndex + 1) % filteredOptions.length;
      }

      setSelectedOption(filteredOptions[newIndex]);
    } else if (e.key === 'Enter') {
      if (selectedOption) {
        setIsExecute(true)
        setInputValue(selectedOption.label);
        if (selectedOption.label === "Divide into subtasks") {
          DivideTaskIntoSubTasks()
        } else if (selectedOption.label === "Summarize") {
          summarize()
        }
      }
    }
  };

  return (
    isExecute && inputValue == "Ask Ai" ? (
      <PromptAI type="prompt" />
    ) : isExecute && inputValue === "Define" ? (
      <PromptAI type="define" />
    ) : !isExecute ? (
      <div className='w-screen flex items-center justify-center'>
        <div className="rounded-2xl bg-gray-800 text-white p-4 dark:bg-slate-900 dark:text-gray-100 w-3/4">
          <input
            ref={inputRef}
            type="text"
            placeholder="AI action..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            id="ai-input"
            className="bg-gray-700 text-white px-2 py-1 rounded-md dark:bg-gray-800 w-full"
          />
          <ul className="mt-2 max-h-90 overflow-y-auto">
            {filteredOptions.map((option: { label: string }, index: number) => (
              <li
                key={index}
                onClick={() => setSelectedOption(option)}
                className={`p-2 cursor-pointer ${selectedOption === option ? 'bg-blue-600 text-white border-2 border-blue-500' : ''
                  } hover:bg-gray-600`}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    ) : null
  );
}

export default CommandPalette;
