"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Send, Bot, User, Check, X, Play, Square, Clock } from "lucide-react"
import { useWorkspace } from "@/lib/workspace-context"
import { 
  getTimeTrackingState, 
  startTimeTracking, 
  stopTimeTracking, 
  getElapsedTime, 
  formatElapsedTime, 
  calculateHours,
  calculateMinutes,
  TimeTrackingSession 
} from "@/lib/time-tracking"

interface Project {
  id: string
  name: string
  client: {
    name: string
  }
  billingType?: "hourly" | "fixed"
  fixedAmount?: number
}

interface TimesheetData {
  date: string
  projectId: string
  hours: number
  description: string
  billable: boolean
}

interface Message {
  id: string
  type: 'bot' | 'user'
  content: string
  timestamp: Date
  suggestions?: string[]
}

interface TimesheetChatBotProps {
  projects: Project[]
  onSave: (timesheet: TimesheetData) => void
}

export function TimesheetChatBot({ projects, onSave }: TimesheetChatBotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [currentStep, setCurrentStep] = useState<'greeting' | 'mode' | 'date' | 'project' | 'hours' | 'description' | 'confirm' | 'tracking'>('greeting')
  const [timesheetData, setTimesheetData] = useState<Partial<TimesheetData>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeSession, setActiveSession] = useState<TimeTrackingSession | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { currentWorkspace } = useWorkspace()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load active session on mount
  useEffect(() => {
    const state = getTimeTrackingState()
    setActiveSession(state.activeSession)
    setIsInitialized(true)
  }, [])

  // Update elapsed time every second when tracking
  useEffect(() => {
    if (!activeSession) return

    const interval = setInterval(() => {
      setElapsedTime(getElapsedTime(activeSession))
    }, 1000)

    return () => clearInterval(interval)
  }, [activeSession])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const state = getTimeTrackingState()
      if (state.activeSession) {
        // Resume active session
        setActiveSession(state.activeSession)
        setCurrentStep('tracking')
        addBotMessage(`Welcome back! You're currently tracking time for **${state.activeSession.projectName}** (${state.activeSession.clientName}). 

⏱️ **Elapsed time:** ${formatElapsedTime(getElapsedTime(state.activeSession))}

What would you like to do?`, ['Stop tracking', 'Continue tracking', 'Add description'])
      } else {
        // Start fresh
        addBotMessage(`Hi! I'm your timesheet assistant. How would you like to log your time today?`, ['Start time tracking', 'Log completed work'])
      }
    }
  }, [isOpen, messages.length])

  const addBotMessage = (content: string, suggestions?: string[]) => {
    const message: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content,
      timestamp: new Date(),
      suggestions
    }
    setMessages(prev => [...prev, message])
  }

  const addUserMessage = (content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
  }

  const processUserInput = async (input: string) => {
    setIsProcessing(true)
    addUserMessage(input)

    try {
      switch (currentStep) {
        case 'greeting':
        case 'mode':
          if (input.toLowerCase().includes('start') || input.toLowerCase().includes('tracking')) {
            setCurrentStep('project')
            setTimeout(() => {
              addBotMessage(`Great! Let's start time tracking. Which project are you working on?`, projects.map(p => p.name))
            }, 500)
          } else if (input.toLowerCase().includes('log') || input.toLowerCase().includes('completed')) {
            setCurrentStep('date')
            const today = new Date().toISOString().split('T')[0]
            setTimeout(() => {
              addBotMessage(`Perfect! Let's log your completed work. What date did you work on?`, ['Today', 'Yesterday', 'Different date'])
            }, 500)
          } else {
            addBotMessage("Please choose how you'd like to log your time.", ['Start time tracking', 'Log completed work'])
          }
          break

        case 'tracking':
          if (input.toLowerCase().includes('stop')) {
            if (activeSession) {
              const session = stopTimeTracking()
              if (session) {
                setActiveSession(null)
                setElapsedTime(0)
                setCurrentStep('description')
                const elapsedMs = getElapsedTime(session)
                const minutes = calculateMinutes(elapsedMs)
                const hours = calculateHours(elapsedMs)
                setTimesheetData({
                  date: new Date().toISOString().split('T')[0],
                  projectId: session.projectId,
                  hours: hours
                })
                setTimeout(() => {
                  const actualMinutes = calculateMinutes(elapsedMs)
                  const actualHours = calculateHours(elapsedMs)
                  const isMinimumApplied = actualMinutes < 15
                  
                  addBotMessage(`Time tracking stopped! 

📁 **Project:** ${session.projectName} (${session.clientName})
⏱️ **Duration:** ${minutes} minutes (${hours} hours)${isMinimumApplied ? ' ⚡ *15-min minimum applied*' : ''}

What did you work on during this session?`, ['Bug fixes', 'Feature development', 'Code review', 'Testing', 'Documentation'])
                }, 500)
              }
            }
          } else if (input.toLowerCase().includes('continue')) {
            addBotMessage(`Continuing to track time for **${activeSession?.projectName}**. The timer is still running! 

⏱️ **Elapsed time:** ${formatElapsedTime(elapsedTime)}

You can come back anytime to stop tracking.`, ['Stop tracking', 'Add description'])
          } else if (input.toLowerCase().includes('description')) {
            setCurrentStep('description')
            setTimeout(() => {
              addBotMessage(`What are you working on for **${activeSession?.projectName}**? You can add notes about your current tasks.`, ['Bug fixes', 'Feature development', 'Code review', 'Testing', 'Documentation'])
            }, 500)
          } else {
            addBotMessage("What would you like to do with your active time tracking session?", ['Stop tracking', 'Continue tracking', 'Add description'])
          }
          break

        case 'date':
          // Handle date suggestions and input
          if (input.toLowerCase().includes('yes') || input.toLowerCase().includes('today')) {
            const today = new Date().toISOString().split('T')[0]
            setTimesheetData(prev => ({ ...prev, date: today }))
            setCurrentStep('project')
            setTimeout(() => {
              addBotMessage(`Perfect! Date set to ${today}. Now, which project did you work on?`, projects.map(p => p.name))
            }, 500)
          } else if (input.toLowerCase().includes('yesterday')) {
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            const yesterdayStr = yesterday.toISOString().split('T')[0]
            setTimesheetData(prev => ({ ...prev, date: yesterdayStr }))
            setCurrentStep('project')
            setTimeout(() => {
              addBotMessage(`Great! Date set to ${yesterdayStr}. Now, which project did you work on?`, projects.map(p => p.name))
            }, 500)
          } else {
            // Parse custom date input
            const dateMatch = input.match(/(\d{4}-\d{2}-\d{2})|(\d{1,2}\/\d{1,2}\/\d{4})|(\d{1,2}-\d{1,2}-\d{4})/i)
            if (dateMatch) {
              const parsedDate = new Date(input)
              if (!isNaN(parsedDate.getTime())) {
                const dateStr = parsedDate.toISOString().split('T')[0]
                setTimesheetData(prev => ({ ...prev, date: dateStr }))
                setCurrentStep('project')
                setTimeout(() => {
                  addBotMessage(`Got it! Date set to ${dateStr}. Now, which project did you work on?`, projects.map(p => p.name))
                }, 500)
              } else {
                addBotMessage("I couldn't understand that date format. Please try again with a format like '2025-01-15' or use the suggestions above.")
              }
            } else {
              addBotMessage("Please provide a valid date. You can use formats like '2025-01-15' or click one of the suggestions above.")
            }
          }
          break

        case 'project':
          // Find project by name
          const project = projects.find(p => 
            p.name.toLowerCase().includes(input.toLowerCase()) ||
            p.client.name.toLowerCase().includes(input.toLowerCase())
          )
          
          if (project) {
            if (currentStep === 'project' && !timesheetData.date) {
              // Starting time tracking
              const session = startTimeTracking(project.id, project.name, project.client.name, currentWorkspace!.id)
              setActiveSession(session)
              setCurrentStep('tracking')
              setTimeout(() => {
                addBotMessage(`🚀 **Time tracking started!**

📁 **Project:** ${project.name} (${project.client.name})
⏰ **Started at:** ${new Date().toLocaleTimeString()}

I'm now tracking your time. When you're done working, just tell me to stop tracking and I'll calculate the hours automatically!

You can also add notes about what you're working on.`, ['Stop tracking', 'Add description', 'Continue tracking'])
              }, 500)
            } else {
              // Manual entry
              setTimesheetData(prev => ({ ...prev, projectId: project.id }))
              setCurrentStep('hours')
              setTimeout(() => {
                addBotMessage(`Perfect! Selected ${project.name}. How many hours did you work?`, ['1h', '2h', '4h', '6h', '8h'])
              }, 500)
            }
          } else {
            addBotMessage("I couldn't find that project. Please try typing the exact project name or click one of the suggestions above.", projects.map(p => p.name))
          }
          break

        case 'hours':
          // Parse hours input
          const hoursMatch = input.match(/(\d+(?:\.\d+)?)/)
          if (hoursMatch) {
            const hours = parseFloat(hoursMatch[1])
            if (hours > 0 && hours <= 24) {
              setTimesheetData(prev => ({ ...prev, hours }))
              setCurrentStep('description')
              setTimeout(() => {
                addBotMessage(`Got it! ${hours} hours logged. Now, what did you work on? Please describe the tasks or activities you completed.`, ['Bug fixes', 'Feature development', 'Code review', 'Testing', 'Documentation'])
              }, 500)
            } else {
              addBotMessage("Please enter a valid number of hours between 0.25 and 24.", ['1h', '2h', '4h', '6h', '8h'])
            }
          } else {
            addBotMessage("Please enter a valid number of hours (e.g., 4, 2.5, 1.5).", ['1h', '2h', '4h', '6h', '8h'])
          }
          break

        case 'description':
          if (input.trim().length > 0) {
            setTimesheetData(prev => ({ ...prev, description: input.trim() }))
            setCurrentStep('confirm')
            
            const selectedProject = projects.find(p => p.id === timesheetData.projectId)
            const isFixedProject = selectedProject?.billingType === 'fixed'
            
            setTimeout(() => {
              const hours = timesheetData.hours || 0
              const billedMinutes = Math.round(hours * 60)
              const confirmationMessage = `Perfect! Let me confirm your timesheet entry:

📅 **Date:** ${timesheetData.date}
📁 **Project:** ${selectedProject?.name} (${selectedProject?.client.name})
⏰ **Hours:** ${hours} (${billedMinutes} minutes)${billedMinutes === 15 && hours === 0.25 ? ' ⚡ *15-min minimum*' : ''}
📝 **Description:** ${input.trim()}
💰 **Billable:** ${isFixedProject ? 'No (Fixed Monthly Project)' : 'Yes'}

Does this look correct?`
              
              addBotMessage(confirmationMessage, ['Yes, save it', 'No, start over'])
            }, 500)
          } else {
            addBotMessage("Please provide a description of what you worked on.")
          }
          break

        case 'confirm':
          if (input.toLowerCase().includes('yes') || input.toLowerCase().includes('save')) {
            const selectedProject = projects.find(p => p.id === timesheetData.projectId)
            const isFixedProject = selectedProject?.billingType === 'fixed'
            
            const finalData: TimesheetData = {
              date: timesheetData.date!,
              projectId: timesheetData.projectId!,
              hours: timesheetData.hours!,
              description: timesheetData.description!,
              billable: !isFixedProject // Fixed projects are not billable per timesheet
            }
            
            addBotMessage("Great! Creating your timesheet entry...")
            setTimeout(() => {
              onSave(finalData)
              addBotMessage("✅ Timesheet entry created successfully!")
              setTimeout(() => {
                resetChat()
              }, 2000)
            }, 1000)
          } else if (input.toLowerCase().includes('no') || input.toLowerCase().includes('start over')) {
            addBotMessage("No problem! Let's start over.")
            setTimeout(() => {
              const today = new Date().toISOString().split('T')[0]
              addBotMessage(`Let's start with today's date (${today}). Is this correct, or did you work on a different date?`, ['Yes, today', 'Yesterday', 'Different date'])
              setCurrentStep('date')
              setTimesheetData({})
            }, 500)
          } else {
            addBotMessage("Please click one of the suggestions above or type 'yes' to save or 'no' to start over.", ['Yes, save it', 'No, start over'])
          }
          break
      }
    } catch (error) {
      addBotMessage("Sorry, something went wrong. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const resetChat = () => {
    setMessages([])
    setCurrentStep('greeting')
    setTimesheetData({})
    setInputValue("")
    setTimeout(() => {
      const state = getTimeTrackingState()
      if (state.activeSession) {
        setActiveSession(state.activeSession)
        setCurrentStep('tracking')
        addBotMessage(`Welcome back! You're currently tracking time for **${state.activeSession.projectName}** (${state.activeSession.clientName}). 

⏱️ **Elapsed time:** ${formatElapsedTime(getElapsedTime(state.activeSession))}

What would you like to do?`, ['Stop tracking', 'Continue tracking', 'Add description'])
      } else {
        addBotMessage(`Hi! I'm your timesheet assistant. How would you like to log your time today?`, ['Start time tracking', 'Log completed work'])
      }
    }, 500)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && !isProcessing) {
      processUserInput(inputValue.trim())
      setInputValue("")
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
  }

  if (!currentWorkspace || !isInitialized) return null

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      {!isOpen ? (
        // Icon-only state with active session indicator
        <div className="relative">
          <Button
            onClick={() => handleOpenChange(true)}
            className={`h-12 w-12 rounded-full shadow-lg ${
              activeSession 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {activeSession ? (
              <Play className="h-6 w-6 text-white" />
            ) : (
              <Bot className="h-6 w-6 text-white" />
            )}
          </Button>
          {activeSession && (
            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              {formatElapsedTime(elapsedTime)}
            </div>
          )}
        </div>
      ) : (
        // Full chat state
        <Card className="w-96 max-h-96 shadow-lg">
          <CardContent className="p-0">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-3 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                {activeSession ? (
                  <Play className="h-4 w-4 text-green-600" />
                ) : (
                  <Bot className="h-4 w-4 text-blue-600" />
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {activeSession ? 'Time Tracking' : 'Timesheet Assistant'}
                  </span>
                  {activeSession && (
                    <span className="text-xs text-muted-foreground">
                      {activeSession.projectName} • {formatElapsedTime(elapsedTime)}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenChange(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Chat Messages */}
            <div className="h-64 overflow-y-auto p-3 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {message.type === 'user' ? (
                        <User className="h-3 w-3" />
                      ) : (
                        <Bot className="h-3 w-3" />
                      )}
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))}
              {messages.map((message) => 
                message.suggestions && message.suggestions.length > 0 && message.type === 'bot' && message.id === messages.filter(m => m.type === 'bot').pop()?.id && (
                  <div key={`suggestions-${message.id}`} className="flex justify-start">
                    <div className="flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 px-2"
                          onClick={() => {
                            setInputValue(suggestion)
                            processUserInput(suggestion)
                            setInputValue("") // Clear input after sending
                          }}
                          disabled={isProcessing}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )
              )}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-muted text-foreground rounded-lg px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Bot className="h-3 w-3" />
                      <span className="animate-pulse">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your response..."
                  className="flex-1"
                  disabled={isProcessing}
                />
                <Button type="submit" size="sm" disabled={isProcessing || !inputValue.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
