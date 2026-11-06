import type { RealtimeEvent } from '@/domain/realtime/schema'

const REMEMBERED_IDS = 300

// descarta o que já foi processado e o que chega com versão menor ou igual à última vista do recurso
export class EventGuard {
  private ids = new Set<string>()
  private versions = new Map<string, number>()

  accept(event: RealtimeEvent) {
    if (this.ids.has(event.id)) return false
    this.ids.add(event.id)
    if (this.ids.size > REMEMBERED_IDS) this.ids.delete(this.ids.values().next().value!)

    const resource = `${event.resource.type}:${event.resource.id}`
    if (event.version <= (this.versions.get(resource) ?? 0)) return false
    this.versions.set(resource, event.version)
    return true
  }

  clear() {
    this.ids.clear()
    this.versions.clear()
  }
}
