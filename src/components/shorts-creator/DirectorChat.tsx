import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '../../stores/useChatStore'

interface DirectorChatProps {
    onSend: (message: string) => void
}

export function DirectorChat({ onSend }: DirectorChatProps) {
    const [input, setInput] = useState('')
    const { messages, isLoading } = useChatStore()
    const chatEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isLoading])

    const handleSend = () => {
        if (!input.trim()) return
        onSend(input)
        setInput('')
    }

    return (
        <div className="director-assistant">
            <div className="director-header">
                <div className="director-status-dot" />
                <span className="director-title">Creative Director</span>
            </div>

            <div className="chat-messages">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`chat-bubble ${msg.role}`}>
                        {msg.content}
                    </div>
                ))}
                {isLoading && <div className="chat-bubble assistant typing">กำลังคิด...</div>}
                <div ref={chatEndRef} />
            </div>

            <div className="chat-input-area">
                <div className="chat-input-wrapper">
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="สั่งงาน Director เช่น 'ขอแนวตลกๆ'..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button className="chat-send-btn" onClick={handleSend}>🚀</button>
                </div>
            </div>
        </div>
    )
}
