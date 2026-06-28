import { useEffect, useRef, useState, useCallback } from 'react'
import { FiMessageCircle, FiX, FiSend, FiMic, FiVolume2, FiVolumeX } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { format } from 'date-fns'

// Browser Speech Recognition (free, built into Chrome/Edge)
const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null

export default function KnowledgeBotWidget() {
  const { isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const scrollRef = useRef(null)
  const recognitionRef = useRef(null)

  // Set up speech recognition once
  useEffect(() => {
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      setListening(false)
      // Auto-send the voice input
      setTimeout(() => sendMessage(transcript), 300)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (open && messages === null) {
      api
        .get('/chatbot/history')
        .then(({ data }) => setMessages(data.messages))
        .catch(() => setMessages([]))
    }
  }, [open, messages])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Speak text aloud using browser SpeechSynthesis (free, built-in)
  const speak = useCallback(
    (text) => {
      if (!voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return
      window.speechSynthesis.cancel()
      // Strip markdown for cleaner speech
      const clean = text.replace(/[*#`_>•\-]/g, '').replace(/\n+/g, '. ')
      const utterance = new SpeechSynthesisUtterance(clean)
      utterance.rate = 1.05
      utterance.pitch = 1
      utterance.lang = 'en-US'
      window.speechSynthesis.speak(utterance)
    },
    [voiceEnabled]
  )

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text.trim()
      if (!trimmed || sending) return

      setInput('')
      setSending(true)
      setMessages((prev) => [
        ...(prev || []),
        { _id: `temp-${Date.now()}`, role: 'user', content: trimmed, createdAt: new Date() },
      ])

      try {
        const { data } = await api.post('/chatbot/message', { message: trimmed })
        setMessages((prev) => [...prev, data.reply])
        speak(data.reply.content)
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            _id: `err-${Date.now()}`,
            role: 'assistant',
            content: 'Sorry, something went wrong — try again.',
            createdAt: new Date(),
          },
        ])
      } finally {
        setSending(false)
      }
    },
    [sending, speak]
  )

  function handleSend(e) {
    e.preventDefault()
    sendMessage(input)
  }

  function toggleListening() {
    if (!recognitionRef.current) return
    if (listening) {
      recognitionRef.current.stop()
      setListening(false)
    } else {
      setListening(true)
      recognitionRef.current.start()
    }
  }

  function toggleVoice() {
    if (voiceEnabled && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setVoiceEnabled((v) => !v)
  }

  if (!isAuthenticated) return null

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 w-80 sm:w-96 h-[28rem] glass rounded-lg shadow-card-hover flex flex-col overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-navy-600 bg-navy-900 dark:bg-navy-950">
            <div>
              <p className="text-sm font-semibold text-white">SVBBS AI Assistant</p>
              <p className="text-2xs text-slate-300">Ask anything · type or speak</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleVoice}
                className={`${voiceEnabled ? 'text-kc-400' : 'text-slate-300'} hover:text-white`}
                aria-label={voiceEnabled ? 'Mute voice replies' : 'Enable voice replies'}
                title={voiceEnabled ? 'Voice replies ON' : 'Voice replies OFF'}
              >
                {voiceEnabled ? <FiVolume2 size={17} /> : <FiVolumeX size={17} />}
              </button>
              <button onClick={() => setOpen(false)} className="text-slate-300 hover:text-white" aria-label="Close chat">
                <FiX size={18} />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {messages === null ? (
              <p className="text-xs text-slate-400 text-center py-6">Loading…</p>
            ) : messages.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Ask me anything — KC rules, your due dates, exam prep, or general questions. Tap the mic to speak.
              </p>
            ) : (
              messages.map((m) => (
                <div key={m._id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-md px-3 py-2 text-sm whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-kc-500 text-navy-950'
                        : 'bg-slate-100 dark:bg-navy-700 text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    <p>{m.content}</p>
                    <p className={`text-2xs mt-1 ${m.role === 'user' ? 'text-navy-950/60' : 'text-slate-400'}`}>
                      {format(new Date(m.createdAt), 'h:mm a')}
                    </p>
                  </div>
                </div>
              ))
            )}
            {sending && <p className="text-2xs text-slate-400 px-1">Thinking…</p>}
            {listening && <p className="text-2xs text-kc-500 px-1 animate-pulse">🎤 Listening…</p>}
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2 p-2.5 border-t border-slate-200 dark:border-navy-600">
            {SpeechRecognition && (
              <button
                type="button"
                onClick={toggleListening}
                className={`shrink-0 grid place-items-center w-9 h-9 rounded-md transition-colors ${
                  listening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-slate-200 dark:bg-navy-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                }`}
                aria-label="Voice input"
                title="Speak your question"
              >
                <FiMic size={15} />
              </button>
            )}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything…"
              maxLength={500}
              className="flex-1 min-w-0 rounded-md border border-slate-300 dark:border-navy-500 bg-white dark:bg-navy-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-kc-500 focus:ring-1 focus:ring-kc-500"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="shrink-0 grid place-items-center w-9 h-9 rounded-md bg-navy-900 dark:bg-kc-500 text-white dark:text-navy-950 disabled:opacity-40"
              aria-label="Send"
            >
              <FiSend size={15} />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="grid place-items-center w-14 h-14 rounded-full bg-navy-900 dark:bg-kc-500 text-white dark:text-navy-950 shadow-card-hover hover:scale-105 transition-transform"
        aria-label={open ? 'Close assistant' : 'Open assistant'}
      >
        {open ? <FiX size={22} /> : <FiMessageCircle size={22} />}
      </button>
    </div>
  )
}