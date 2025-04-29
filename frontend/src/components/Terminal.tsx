import {ReactNode, useRef, useState} from 'react'

// Handle key press is sent here
interface TerminalProps {
    children?: ReactNode
    onEnter?: (input: string) => void
    height?: string
}

const Terminal: React.FC<TerminalProps> = ({children, onEnter, height = 'h-64'}) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    const [currentInput, setCurrentInput] = useState<string>('')

    const focusInput = () => {
        if (inputRef.current) {
            inputRef.current.focus()
        }
        scrollToBottom()
    }
    const scrollToBottom = () => {
        if (contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight
        }
    }

  return (
    <div className= {`p-5 w-full border overflow-y-auto font-mono text-green-500 bg-black ${height} flex flex-col `}
        onClick={focusInput}>
        

        {/* Displays the input with the blinking animation */}
        <div 
                ref={contentRef}
                className="flex-1 overflow-y-auto leading-tight whitespace-pre mb-2"
            >
                {children}
                
                {/* Input area positioned at the end of content */}
                <div className="flex mt-1">
                    <span>$ </span>
                    <span>{currentInput}</span>
                    <span className="animate-pulse">█</span>
                </div>
            </div>

        {/* Hidden input field to capture key presses */}
        <input
            className='opacity-0 absolute -z-10 h-1'
            ref={inputRef}
            type='text'
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter'){
                    e.preventDefault()
                    if (currentInput.trim() !== '') {
                        setCurrentInput('')
                        if (onEnter) {
                            onEnter(currentInput)
                        }else{
                            console.log('No onEnter function provided.')
                        }
                    }
                }
            }}
            autoFocus
        />
    </div>
  )
}

export default Terminal