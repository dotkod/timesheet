export interface TimeTrackingSession {
  id: string
  projectId: string
  projectName: string
  clientName: string
  startTime: number // timestamp
  description?: string
  workspaceId: string
}

export interface TimeTrackingState {
  activeSession: TimeTrackingSession | null
  sessionHistory: TimeTrackingSession[]
}

const STORAGE_KEY = 'timesheet-time-tracking'

export function getTimeTrackingState(): TimeTrackingState {
  if (typeof window === 'undefined') {
    return { activeSession: null, sessionHistory: [] }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        activeSession: parsed.activeSession,
        sessionHistory: parsed.sessionHistory || []
      }
    }
  } catch (error) {
    console.error('Error loading time tracking state:', error)
  }

  return { activeSession: null, sessionHistory: [] }
}

export function saveTimeTrackingState(state: TimeTrackingState): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Error saving time tracking state:', error)
  }
}

export function startTimeTracking(
  projectId: string,
  projectName: string,
  clientName: string,
  workspaceId: string
): TimeTrackingSession {
  const session: TimeTrackingSession = {
    id: `session-${Date.now()}`,
    projectId,
    projectName,
    clientName,
    startTime: Date.now(),
    workspaceId
  }

  const state = getTimeTrackingState()
  state.activeSession = session
  saveTimeTrackingState(state)

  return session
}

export function stopTimeTracking(): TimeTrackingSession | null {
  const state = getTimeTrackingState()
  const activeSession = state.activeSession

  if (!activeSession) {
    return null
  }

  // Add to history
  state.sessionHistory.unshift(activeSession)
  
  // Keep only last 50 sessions
  if (state.sessionHistory.length > 50) {
    state.sessionHistory = state.sessionHistory.slice(0, 50)
  }

  // Clear active session
  state.activeSession = null
  saveTimeTrackingState(state)

  return activeSession
}

export function getElapsedTime(session: TimeTrackingSession): number {
  return Date.now() - session.startTime
}

export function formatElapsedTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`
  } else {
    return `${minutes}m`
  }
}

export function calculateHours(milliseconds: number): number {
  // Convert to minutes first, then to hours with 2 decimal places
  const minutes = milliseconds / (1000 * 60)
  const hours = minutes / 60
  
  // Apply 15-minute minimum billing rule
  const minimumHours = 0.25 // 15 minutes = 0.25 hours
  const actualHours = Math.round(hours * 100) / 100
  
  return Math.max(actualHours, minimumHours)
}

export function calculateMinutes(milliseconds: number): number {
  const actualMinutes = Math.round(milliseconds / (1000 * 60))
  
  // Apply 15-minute minimum billing rule
  const minimumMinutes = 15
  return Math.max(actualMinutes, minimumMinutes)
}

export function clearTimeTrackingHistory(): void {
  const state = getTimeTrackingState()
  state.sessionHistory = []
  saveTimeTrackingState(state)
}

export function resumeSession(sessionId: string): boolean {
  const state = getTimeTrackingState()
  const session = state.sessionHistory.find(s => s.id === sessionId)
  
  if (session) {
    // Remove from history and make it active again
    state.sessionHistory = state.sessionHistory.filter(s => s.id !== sessionId)
    state.activeSession = session
    saveTimeTrackingState(state)
    return true
  }
  
  return false
}
