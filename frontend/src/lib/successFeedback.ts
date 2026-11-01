export type SuccessFeedback = { id: number; message: string }

const listeners = new Set<() => void>()
let feedback: SuccessFeedback[] = []
let nextId = 1

export function showSuccessFeedback(message = 'L’opération a bien été effectuée.') {
  feedback = [...feedback, { id: nextId++, message }]
  listeners.forEach((listener) => listener())
}

export function dismissSuccessFeedback(id: number) {
  const nextFeedback = feedback.filter((item) => item.id !== id)
  if (nextFeedback.length === feedback.length) return
  feedback = nextFeedback
  listeners.forEach((listener) => listener())
}

export function subscribeSuccessFeedback(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getSuccessFeedbackSnapshot() {
  return feedback
}
