"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useWorkspace } from "@/lib/workspace-context"
import { ArrowLeft, Send, Bot, User } from "lucide-react"

interface Project {
  id: string
  name: string
  client: string
  billingType: 'hourly' | 'fixed'
  hourlyRate?: number
  fixedAmount?: number
}

interface Message {
  id: string
  type: 'bot' | 'user'
  content: string
  suggestions?: string[]
}

export default function MobileAssistantPage() {
  return <MobileAssistantContent />
}

function MobileAssistantContent() {
  const router = useRouter()
  const { currentWorkspace } = useWorkspace()
  const [projects, setProjects] = useState<Project[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState<'date' | 'project' | 'hours' | 'description' | 'confirm'>('date')
  const [formData, setFormData] = useState({
    date: '',
    projectId: '',
    hours: '',
    description: '',
    billable: false
  })

  useEffect(() => {
    fetchProjects()
    initializeChat()
  }, [])

  const fetchProjects = async () => {
    if (!currentWorkspace) return
    
    try {
      const response = await fetch(`/api/projects?workspaceId=${currentWorkspace.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const initializeChat = () => {
    const today = new Date().toISOString().split('T')[0]
    const initialMessage: Message = {
      id: '1',
      type: 'bot',
      content: `Hi! I'll help you create a timesheet entry. Let's start with the date. Is today (${today}) correct?`,
      suggestions: ['Yes, today', 'Yesterday', 'Different date']
    }
    setMessages([initialMessage])
    setFormData(prev => ({ ...prev, date: today }))
  }

  const addBotMessage = (content: string, suggestions?: string[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content,
      suggestions
    }
    setMessages(prev => [...prev, newMessage])
  }

  const addUserMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content
    }
    setMessages(prev => [...prev, newMessage])
  }

  const processUserInput = async (input: string) => {
    if (!input.trim()) return

    addUserMessage(input)
    setIsProcessing(true)

    try {
      switch (currentStep) {
        case 'date':
          await handleDateInput(input)
          break
        case 'project':
          await handleProjectInput(input)
          break
        case 'hours':
          await handleHoursInput(input)
          break
        case 'description':
          await handleDescriptionInput(input)
          break
        case 'confirm':
          await handleConfirmation(input)
          break
      }
    } catch (error) {
      console.error('Error processing input:', error)
      addBotMessage("Sorry, something went wrong. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDateInput = async (input: string) => {
    let date = input.toLowerCase()
    
    if (date.includes('today') || date.includes('yes')) {
      // Keep today's date
      addBotMessage("Great! Now, which project did you work on?", 
        projects.map(p => p.name))
      setCurrentStep('project')
    } else if (date.includes('yesterday')) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      setFormData(prev => ({ ...prev, date: yesterdayStr }))
      addBotMessage(`Perfect! Yesterday (${yesterdayStr}). Now, which project did you work on?`, 
        projects.map(p => p.name))
      setCurrentStep('project')
    } else {
      // Try to parse the date
      const parsedDate = new Date(input)
      if (!isNaN(parsedDate.getTime())) {
        const dateStr = parsedDate.toISOString().split('T')[0]
        setFormData(prev => ({ ...prev, date: dateStr }))
        addBotMessage(`Got it! ${dateStr}. Now, which project did you work on?`, 
          projects.map(p => p.name))
        setCurrentStep('project')
      } else {
        addBotMessage("I didn't understand that date. Please try again or use 'today', 'yesterday', or a specific date like '2024-01-15'.", 
          ['Today', 'Yesterday', 'Try again'])
      }
    }
  }

  const handleProjectInput = async (input: string) => {
    const project = projects.find(p => 
      p.name.toLowerCase().includes(input.toLowerCase()) ||
      input.toLowerCase().includes(p.name.toLowerCase())
    )
    
    if (project) {
      setFormData(prev => ({ ...prev, projectId: project.id }))
      
      // Check if it's a fixed project
      if (project.billingType === 'fixed') {
        setFormData(prev => ({ ...prev, billable: false }))
        addBotMessage(`Perfect! ${project.name} (Fixed Monthly). How many hours did you work?`, 
          ['1', '2', '4', '8'])
      } else {
        addBotMessage(`Great! ${project.name}. How many hours did you work?`, 
          ['1', '2', '4', '8'])
      }
      setCurrentStep('hours')
    } else {
      addBotMessage("I couldn't find that project. Please try again or select from the suggestions.", 
        projects.map(p => p.name))
    }
  }

  const handleHoursInput = async (input: string) => {
    const hours = parseFloat(input)
    
    if (isNaN(hours) || hours <= 0) {
      addBotMessage("Please enter a valid number of hours (e.g., 1, 2.5, 4).", 
        ['1', '2', '4', '8'])
      return
    }
    
    setFormData(prev => ({ ...prev, hours: hours.toString() }))
    addBotMessage("Excellent! Now, please describe what you worked on.", 
      ['Bug fixes', 'Feature development', 'Code review', 'Meeting'])
    setCurrentStep('description')
  }

  const handleDescriptionInput = async (input: string) => {
    setFormData(prev => ({ ...prev, description: input }))
    
    const project = projects.find(p => p.id === formData.projectId)
    const confirmMessage = `Perfect! Here's your timesheet entry:

📅 **Date:** ${formData.date}
🏢 **Project:** ${project?.name || 'Unknown'}
⏰ **Hours:** ${formData.hours}
📝 **Description:** ${input}
💰 **Billable:** ${formData.billable ? 'Yes' : 'No'}

Does this look correct?`

    addBotMessage(confirmMessage, ['Yes, save it', 'No, let me fix it'])
    setCurrentStep('confirm')
  }

  const handleConfirmation = async (input: string) => {
    if (input.toLowerCase().includes('yes') || input.toLowerCase().includes('save')) {
      await saveTimesheet()
    } else {
      addBotMessage("No problem! Let's start over.", ['Start again'])
      resetChat()
    }
  }

  const saveTimesheet = async () => {
    try {
      const response = await fetch('/api/timesheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId: currentWorkspace?.id,
          projectId: formData.projectId,
          date: formData.date,
          hours: parseFloat(formData.hours),
          description: formData.description,
          billable: formData.billable
        }),
      })

      if (response.ok) {
        addBotMessage("✅ Timesheet entry saved successfully! Would you like to create another entry?", 
          ['Yes, create another', 'No, I\'m done'])
        setCurrentStep('date')
        resetFormData()
      } else {
        const error = await response.json()
        addBotMessage(`❌ Failed to save: ${error.error || 'Unknown error'}. Let's try again.`, 
          ['Try again'])
      }
    } catch (error) {
      addBotMessage("❌ Network error. Please try again.", ['Try again'])
    }
  }

  const resetChat = () => {
    setCurrentStep('date')
    resetFormData()
    initializeChat()
  }

  const resetFormData = () => {
    const today = new Date().toISOString().split('T')[0]
    setFormData({
      date: today,
      projectId: '',
      hours: '',
      description: '',
      billable: false
    })
  }

  const handleSend = () => {
    if (inputValue.trim()) {
      processUserInput(inputValue)
      setInputValue("")
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    processUserInput(suggestion)
    setInputValue("")
  }

  return (
    <div className="h-full flex flex-col md:hidden">
      {/* Chat Messages - Fixed height, scrollable */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start space-x-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.type === 'bot' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {message.type === 'bot' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>
              <div className={`rounded-lg p-3 ${
                message.type === 'bot' 
                  ? 'bg-muted text-foreground' 
                  : 'bg-primary text-primary-foreground'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {/* Show suggestions only for the most recent bot message */}
                {message.type === 'bot' && message.suggestions && message === messages[messages.length - 1] && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-2"
                        onClick={() => handleSuggestionClick(suggestion)}
                        disabled={isProcessing}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="bg-background border-t border-border p-4 pb-32">
        <div className="flex items-center space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your response..."
            className="flex-1"
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={isProcessing}
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isProcessing}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
