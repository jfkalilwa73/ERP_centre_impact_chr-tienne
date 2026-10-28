import { useEffect, useSyncExternalStore } from 'react'
import { X } from 'lucide-react'
import { Alert } from './Alert'
import { Button } from './Button'
import {
  dismissSuccessFeedback,
  getSuccessFeedbackSnapshot,
  subscribeSuccessFeedback,
  type SuccessFeedback,
} from '@/lib/successFeedback'

const EMPTY_FEEDBACK: SuccessFeedback[] = []

function SuccessMessage({ feedback }: { feedback: SuccessFeedback }) {
  useEffect(() => {
    const timeout = window.setTimeout(() => dismissSuccessFeedback(feedback.id), 5000)
    return () => window.clearTimeout(timeout)
  }, [feedback.id])

  return (
    <div className="relative rounded-lg shadow-lg">
      <Alert variant="success" title="Confirmation" className="pr-10">
        {feedback.message}
      </Alert>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label="Fermer le message de confirmation"
        className="absolute top-1 right-1 !px-2 !py-1"
        onClick={() => dismissSuccessFeedback(feedback.id)}
      >
        <X className="size-4" aria-hidden="true" />
      </Button>
    </div>
  )
}

export function SuccessFeedbackRegion() {
  const feedback = useSyncExternalStore(
    subscribeSuccessFeedback,
    getSuccessFeedbackSnapshot,
    () => EMPTY_FEEDBACK,
  )

  if (feedback.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex w-[min(28rem,calc(100vw-2rem))] flex-col gap-2">
      {feedback.map((item) => (
        <SuccessMessage key={item.id} feedback={item} />
      ))}
    </div>
  )
}
