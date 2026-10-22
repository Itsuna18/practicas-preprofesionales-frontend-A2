import { api } from './client'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/** El backend acepta hasta 20 mensajes por conversación. */
export const MAX_CHAT_MESSAGES = 20

/**
 * Lo que se envía: los últimos mensajes, empezando siempre por uno de la
 * persona, como exige el backend.
 */
export function trimConversation(messages: ChatMessage[]): ChatMessage[] {
  const recent = messages.slice(-MAX_CHAT_MESSAGES)
  const firstUser = recent.findIndex((m) => m.role === 'user')
  return firstUser === -1 ? [] : recent.slice(firstUser)
}

// Requiere red: la respuesta la genera el backend con Claude.
export function sendChat(messages: ChatMessage[]): Promise<{ reply: string }> {
  return api<{ reply: string }>('/assistant/chat', {
    method: 'POST',
    body: JSON.stringify({ messages: trimConversation(messages) }),
  })
}
