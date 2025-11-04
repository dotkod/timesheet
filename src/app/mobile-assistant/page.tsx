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
  const [currentStep, setCurrentStep] = useState<'date' | 'project' | 'hours' | 'description' | 'todos' | 'confirm'>('date')
  const [formData, setFormData] = useState({
    date: '',
    projectId: '',
    hours: '',
    description: '',
    billable: false
  })
  const [availableTodos, setAvailableTodos] = useState<any[]>([])
  const [selectedTodos, setSelectedTodos] = useState<Array<{ todoItemId: string; hoursAllocated: number }>>([])

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
        case 'todos':
          await handleTodosInput(input)
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

  const fetchTodosForProject = async (projectId: string) => {
    if (!projectId || !currentWorkspace) return []
    
    try {
      const response = await fetch(`/api/todo-items?projectId=${projectId}&workspaceId=${currentWorkspace.id}&includeArchived=false`)
      const data = await response.json()
      
      if (response.ok) {
        const todos = data.todoItems || []
        // Ensure todos have the expected structure
        const formattedTodos = todos.map((t: any) => ({
          id: t.id,
          title: t.title,
          status: t.status || 'todo'
        }))
        setAvailableTodos(formattedTodos)
        return formattedTodos
      } else {
        console.error('Failed to fetch todos:', data.error)
      }
    } catch (error) {
      console.error('Failed to fetch todos:', error)
    }
    return []
  }

  const handleDescriptionInput = async (input: string) => {
    setFormData(prev => ({ ...prev, description: input }))
    
    // Fetch todos for the selected project
    const todos = await fetchTodosForProject(formData.projectId)
    
    if (todos.length > 0) {
      setCurrentStep('todos')
      addBotMessage(`Would you like to link any todo items to this timesheet? I found ${todos.length} todo(s) for this project.`, 
        ['Yes, link todos', 'No, skip', ...todos.slice(0, 5).map((t: any) => t.title)])
    } else {
      showConfirmation()
      setCurrentStep('confirm')
    }
  }

  const handleTodosInput = async (input: string) => {
    const normalize = (value: string) =>
      (value || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    if (input.toLowerCase().includes('yes') || input.toLowerCase().includes('link')) {
      const todoList = availableTodos.map((t: any, i: number) => `${i + 1}. ${t.title} (${t.status})`).join('\n')
      addBotMessage(`Here are the available todos:\n\n${todoList}\n\nYou can select by typing numbers (e.g., "1, 3") or type "skip" to continue.`, 
        ['Skip', ...availableTodos.slice(0, 5).map((t: any) => t.title)])
    } else if (input.toLowerCase().includes('no') || input.toLowerCase().includes('skip')) {
      setSelectedTodos([])
      showConfirmation()
      setCurrentStep('confirm')
    } else {
      // Match todos by numbers or names
      const matchedTodos: any[] = []
      const inputLower = input.toLowerCase()
      const inputNorm = normalize(input)
      
      const isNumberList = /^\s*\d+(\s*,\s*\d+)*\s*$/.test(input)
      if (isNumberList) {
        const numberMatches = input.match(/\d+/g)
        numberMatches?.forEach(num => {
          const index = parseInt(num) - 1
          if (index >= 0 && index < availableTodos.length) {
            matchedTodos.push(availableTodos[index])
          }
        })
      } else {
        availableTodos.forEach((todo: any) => {
          const titleLower = (todo.title || '').toLowerCase()
          const titleNorm = normalize(todo.title || '')
          if (
            inputLower === titleLower ||
            titleLower.includes(inputLower) ||
            inputLower.includes(titleLower) ||
            inputNorm === titleNorm ||
            titleNorm.includes(inputNorm) ||
            inputNorm.includes(titleNorm)
          ) {
            matchedTodos.push(todo)
          }
        })
      }
      
      if (matchedTodos.length > 0) {
        const hoursPerTodo = parseFloat(formData.hours) / matchedTodos.length
        setSelectedTodos(prev => {
          const newTodos = [...prev]
          matchedTodos.forEach((todo: any) => {
            if (!newTodos.find(t => t.todoItemId === todo.id)) {
              newTodos.push({ todoItemId: todo.id, hoursAllocated: hoursPerTodo })
            }
          })
          return newTodos
        })
        addBotMessage(`Great! I've linked ${matchedTodos.length} todo item(s) (${hoursPerTodo.toFixed(2)}h each). Ready to confirm?`, 
          ['Yes, confirm', 'Skip'])
      } else {
        addBotMessage("I couldn't find those todos. Try again or type 'skip' to continue.", 
          ['Skip', ...availableTodos.slice(0, 5).map((t: any) => t.title)])
      }
    }
  }

  const showConfirmation = () => {
    const project = projects.find(p => p.id === formData.projectId)
    let confirmMessage = `Perfect! Here's your timesheet entry:

📅 **Date:** ${formData.date}
🏢 **Project:** ${project?.name || 'Unknown'}
⏰ **Hours:** ${formData.hours}
📝 **Description:** ${formData.description}
💰 **Billable:** ${formData.billable ? 'Yes' : 'No'}`

    if (selectedTodos.length > 0) {
      const totalAllocated = selectedTodos.reduce((sum, t) => sum + (t.hoursAllocated || 0), 0)
      confirmMessage += `\n\n✅ **Linked Todos:** ${selectedTodos.length} todo item(s) (${totalAllocated.toFixed(2)}h allocated)`
    }

    confirmMessage += `\n\nDoes this look correct?`
    addBotMessage(confirmMessage, ['Yes, save it', 'No, let me fix it'])
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
          billable: formData.billable,
          todoItems: selectedTodos.filter(t => t.hoursAllocated > 0)
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
    setSelectedTodos([])
    setAvailableTodos([])
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
      {/* Chat Messages - Scrollable area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4 pb-20">
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

      {/* Input Area - FIXED at bottom */}
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-border p-4 z-10">
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
