import { type FormEvent, type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { Bot, MessageCircle, RotateCcw, Send, X } from 'lucide-react'
import { ApiError } from '@/api/client'
import { type ChatMessage, sendChat } from '@/api/assistant'
import { type Role, useAuth } from '@/auth/AuthContext'
import { useOnline } from '@/offline/hooks/useOnline'
import { cn } from '@/lib/utils'

const SUGGESTIONS: Record<Role, string[]> = {
  STUDENT: ['¿Cuántas horas me faltan?', '¿Cómo registro horas sin conexión?', '¿Qué necesito para acreditar?'],
  TUTOR: ['¿Qué practicantes tienen horas por revisar?', '¿Cómo evalúo a un practicante?'],
  COMPANY: ['¿Cómo van mis ofertas?', '¿Cómo decido una postulación?'],
  COORDINATOR: ['Resume el estado de las prácticas', '¿Qué se necesita para acreditar?'],
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-soft px-4 py-3" aria-label="El asistente está escribiendo">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          aria-hidden="true"
          className="size-1.5 animate-bounce rounded-full bg-inkSoft"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  )
}

/**
 * Los modelos marcan el énfasis con **negritas** de Markdown: se pintan como
 * <strong> armando nodos de React (nunca HTML crudo).
 */
export function withBold(text: string): ReactNode[] {
  return text
    .split(/\*\*(.+?)\*\*/g)
    .map((part, index) => (index % 2 === 1 ? <strong key={index}>{part}</strong> : part))
}

function Bubble({ message }: { message: ChatMessage }) {
  const mine = message.role === 'user'
  return (
    <div className={cn('flex animate-in fade-in slide-in-from-bottom-1 duration-200', mine ? 'justify-end' : 'justify-start')}>
      <p
        className={cn(
          'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-14 leading-relaxed',
          mine ? 'rounded-br-md bg-stamp text-surface' : 'rounded-bl-md bg-soft text-ink',
        )}
      >
        <span className="sr-only">{mine ? 'Tú: ' : 'Asistente: '}</span>
        {mine ? message.content : withBold(message.content)}
      </p>
    </div>
  )
}

function ChatHeader({ onReset }: { onReset?: () => void }) {
  return (
    <header className="flex items-center gap-3 border-b border-paperRule px-4 py-3">
      <span className="flex size-9 items-center justify-center rounded-full bg-chipStamp text-stamp">
        <Bot aria-hidden="true" className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-15 font-semibold text-ink">Asistente de prácticas</h2>
        <p className="text-12 text-inkSoft">Responde con tus datos de la plataforma</p>
      </div>
      {onReset ? (
        <button
          type="button"
          onClick={onReset}
          aria-label="Empezar una conversación nueva"
          className="rounded-md p-1.5 text-inkSoft transition-colors hover:bg-pillHover hover:text-ink"
        >
          <RotateCcw aria-hidden="true" className="size-4" />
        </button>
      ) : null}
    </header>
  )
}

function Suggestions({ items, disabled, onPick }: { items: string[]; disabled: boolean; onPick: (text: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-13 text-inkSoft">Pregúntame sobre tus prácticas o sobre cómo usar la plataforma.</p>
      {items.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onPick(suggestion)}
          disabled={disabled}
          className="rounded-xl border border-line px-3 py-2 text-left text-13 text-inkBody transition-all duration-200 hover:border-stamp hover:text-ink disabled:opacity-50"
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}

/** Estado de la conversación: mensajes, envío y error. */
function useConversation(online: boolean) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send(text: string): Promise<boolean> {
    const content = text.trim()
    if (!content || sending || !online) return false
    const next: ChatMessage[] = [...messages, { role: 'user', content }]
    setMessages(next)
    setError(null)
    setSending(true)
    try {
      const { reply } = await sendChat(next)
      setMessages([...next, { role: 'assistant', content: reply }])
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo contactar al asistente.')
    } finally {
      setSending(false)
    }
    return true
  }

  function reset() {
    setMessages([])
    setError(null)
  }

  return { messages, sending, error, send, reset }
}

interface ComposerProps {
  online: boolean
  sending: boolean
  onSend: (text: string) => Promise<boolean>
  onClose: () => void
}

function Composer({ online, sending, onSend, onClose }: ComposerProps) {
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function submit() {
    const text = draft
    setDraft('')
    void onSend(text)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    submit()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
    if (event.key === 'Escape') onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-paperRule px-3 py-3">
      <label htmlFor="assistant-input" className="sr-only">
        Escribe tu pregunta
      </label>
      <textarea
        id="assistant-input"
        ref={inputRef}
        rows={1}
        value={draft}
        maxLength={2000}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={!online}
        placeholder={online ? 'Escribe tu pregunta…' : 'Necesitas conexión para usar el asistente'}
        className="max-h-32 min-h-[42px] flex-1 resize-none rounded-xl border border-line bg-surface px-3 py-2.5 text-14 text-ink transition-colors placeholder:text-inkMute focus-visible:border-stamp focus-visible:outline-none disabled:bg-soft"
      />
      <button
        type="submit"
        disabled={!online || sending || !draft.trim()}
        aria-label="Enviar"
        className="flex size-[42px] flex-none items-center justify-center rounded-xl bg-stamp text-surface transition-all duration-200 hover:bg-stamp/90 active:scale-95 disabled:bg-soft disabled:text-inkMute"
      >
        <Send aria-hidden="true" className="size-4" />
      </button>
    </form>
  )
}

function ChatPanel({ role, onClose }: { role: Role; onClose: () => void }) {
  const online = useOnline()
  const { messages, sending, error, send, reset } = useConversation(online)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' })
  }, [messages, sending])

  return (
    <section
      id="assistant-chat"
      role="dialog"
      aria-label="Asistente de prácticas"
      className="fixed inset-x-3 bottom-24 z-40 flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_60px_-20px_hsl(var(--scrim)/0.55)] animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200 sm:inset-x-auto sm:right-5 sm:w-[380px]"
    >
      <ChatHeader onReset={messages.length > 0 ? reset : undefined} />

      <div className="flex min-h-[220px] flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-4" aria-live="polite">
        {messages.length === 0 ? (
          <Suggestions items={SUGGESTIONS[role]} disabled={!online} onPick={(text) => void send(text)} />
        ) : (
          messages.map((message, index) => <Bubble key={index} message={message} />)
        )}
        {sending ? <TypingIndicator /> : null}
        {error ? (
          <p role="alert" className="rounded-xl bg-chipVoid px-3 py-2 text-13 text-void">
            {error}
          </p>
        ) : null}
        <div ref={endRef} />
      </div>

      <Composer online={online} sending={sending} onSend={send} onClose={onClose} />
    </section>
  )
}

/** Botón flotante del asistente, disponible en todas las pantallas con sesión. */
export function AssistantChat() {
  const { role } = useAuth()
  const [open, setOpen] = useState(false)

  if (!role) return null

  return (
    <>
      <button
        type="button"
        data-tour="assistant"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="assistant-chat"
        aria-label={open ? 'Cerrar el asistente' : 'Abrir el asistente'}
        className="fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-stamp text-surface shadow-[0_12px_32px_-12px_hsl(var(--scrim)/0.6)] transition-all duration-200 ease-in-out hover:scale-105 active:scale-95"
      >
        {open ? <X aria-hidden="true" className="size-6" /> : <MessageCircle aria-hidden="true" className="size-6" />}
      </button>

      {open ? <ChatPanel role={role} onClose={() => setOpen(false)} /> : null}
    </>
  )
}
