import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import { type ChatMessage, trimConversation } from '@/api/assistant'
import { AssistantChat } from './AssistantChat'

// Implementación simple (no vi.fn) para que los rechazos atrapados no se
// reporten como no manejados.
const sent: ChatMessage[][] = []
let nextReply: () => Promise<{ reply: string }> = () => Promise.resolve({ reply: 'ok' })
vi.mock('@/api/assistant', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/api/assistant')>()
  return {
    ...original,
    sendChat: (messages: ChatMessage[]) => {
      sent.push(messages)
      return nextReply()
    },
  }
})

let role: string | null = 'STUDENT'
vi.mock('@/auth/AuthContext', () => ({ useAuth: () => ({ role }) }))

let online = true
vi.mock('@/offline/hooks/useOnline', () => ({ useOnline: () => online }))

beforeEach(() => {
  sent.length = 0
  role = 'STUDENT'
  online = true
  nextReply = () => Promise.resolve({ reply: 'Te faltan 180 horas aprobadas.' })
})

async function openChat() {
  render(<AssistantChat />)
  await userEvent.click(screen.getByRole('button', { name: 'Abrir el asistente' }))
  return screen.getByRole('dialog', { name: 'Asistente de prácticas' })
}

describe('AssistantChat', () => {
  it('opens, sends a question with Enter and shows the reply', async () => {
    await openChat()
    const input = screen.getByLabelText('Escribe tu pregunta')
    expect(input).toHaveFocus()

    await userEvent.type(input, '¿Cuántas horas me faltan?{Enter}')

    expect(await screen.findByText('Te faltan 180 horas aprobadas.')).toBeInTheDocument()
    expect(sent[0]).toEqual([{ role: 'user', content: '¿Cuántas horas me faltan?' }])
    expect(input).toHaveValue('')
  })

  it('sends the whole conversation on the next question', async () => {
    await openChat()
    await userEvent.type(screen.getByLabelText('Escribe tu pregunta'), 'hola{Enter}')
    await screen.findByText('Te faltan 180 horas aprobadas.')
    await userEvent.type(screen.getByLabelText('Escribe tu pregunta'), 'gracias{Enter}')

    await vi.waitFor(() => expect(sent).toHaveLength(2))
    expect(sent[1].map((m) => m.role)).toEqual(['user', 'assistant', 'user'])
  })

  it('offers suggestions by role', async () => {
    role = 'TUTOR'
    await openChat()
    await userEvent.click(screen.getByRole('button', { name: '¿Qué practicantes tienen horas por revisar?' }))
    expect(sent[0][0].content).toBe('¿Qué practicantes tienen horas por revisar?')
  })

  it('shows the backend error, for example when it is not configured', async () => {
    nextReply = () => Promise.reject(new ApiError(503, 'El asistente no está configurado'))
    await openChat()
    await userEvent.type(screen.getByLabelText('Escribe tu pregunta'), 'hola{Enter}')
    expect(await screen.findByRole('alert')).toHaveTextContent('El asistente no está configurado')
  })

  it('cannot be used without connection', async () => {
    online = false
    await openChat()
    expect(screen.getByLabelText('Escribe tu pregunta')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled()
  })

  it('starts over and closes with Escape', async () => {
    await openChat()
    await userEvent.type(screen.getByLabelText('Escribe tu pregunta'), 'hola{Enter}')
    await screen.findByText('Te faltan 180 horas aprobadas.')

    await userEvent.click(screen.getByRole('button', { name: 'Empezar una conversación nueva' }))
    expect(screen.queryByText('Te faltan 180 horas aprobadas.')).not.toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Escribe tu pregunta'), '{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders nothing without a session', () => {
    role = null
    const { container } = render(<AssistantChat />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('trimConversation', () => {
  it('keeps the last 20 messages and always starts with the person', () => {
    const long: ChatMessage[] = Array.from({ length: 25 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: String(i),
    }))
    const trimmed = trimConversation(long)
    expect(trimmed.length).toBeLessThanOrEqual(20)
    expect(trimmed[0].role).toBe('user')
    expect(trimmed.at(-1)?.content).toBe('24')
  })

  it('returns nothing when there is no message from the person', () => {
    expect(trimConversation([{ role: 'assistant', content: 'hola' }])).toEqual([])
  })
})
