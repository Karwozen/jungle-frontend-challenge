import { useAnnouncement } from '@/features/realtime/announcer'

function LiveRegion() {
  const message = useAnnouncement()

  return (
    <p role="status" aria-live="polite" className="sr-only">
      {message}
    </p>
  )
}

export default LiveRegion
