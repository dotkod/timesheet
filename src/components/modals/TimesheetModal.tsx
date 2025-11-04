"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Edit, Clock, Calendar, FolderOpen, FileText, DollarSign, X, CheckSquare } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

interface TodoItem {
  id: string
  title: string
  status: 'todo' | 'in-progress' | 'done'
  hoursAllocated?: number
}

interface Timesheet {
  id?: string
  date: string
  projectId: string
  hours: number
  description: string
  billable: boolean
  todoItems?: Array<{ todoItemId: string; hoursAllocated: number }>
}

interface Project {
  id: string
  name: string
  client: {
    name: string
  }
  billingType?: "hourly" | "fixed"
  fixedAmount?: number
}

interface TimesheetModalProps {
  timesheet?: Timesheet
  projects: Project[]
  onSave: (timesheet: Timesheet) => void
  trigger?: React.ReactNode
}

export function TimesheetModal({ timesheet, projects, onSave, trigger }: TimesheetModalProps) {
  const [open, setOpen] = useState(false)
  const [availableTodos, setAvailableTodos] = useState<TodoItem[]>([])
  const [selectedTodos, setSelectedTodos] = useState<Array<{ todoItemId: string; hoursAllocated: number }>>([])
  const [loadingTodos, setLoadingTodos] = useState(false)
  const [formData, setFormData] = useState<Timesheet>({
    date: timesheet?.date || new Date().toISOString().split('T')[0],
    projectId: timesheet?.projectId || "",
    hours: timesheet?.hours || 1,
    description: timesheet?.description || "",
    billable: timesheet?.billable ?? false,
    ...(timesheet?.id && { id: timesheet.id })
  })

  // Fetch todos when project is selected
  useEffect(() => {
    if (formData.projectId) {
      fetchTodosForProject(formData.projectId)
    } else {
      setAvailableTodos([])
      setSelectedTodos([])
    }
  }, [formData.projectId])

  // Load existing todos when editing
  useEffect(() => {
    if (timesheet?.todoItems && timesheet.todoItems.length > 0) {
      setSelectedTodos(timesheet.todoItems)
    } else {
      setSelectedTodos([])
    }
  }, [timesheet?.todoItems])

  // Handle initial state for fixed projects when editing
  useEffect(() => {
    if (timesheet?.projectId) {
      const project = projects.find(p => p.id === timesheet.projectId)
      if (project?.billingType === 'fixed') {
        setFormData(prev => ({ ...prev, billable: false }))
      }
    }
  }, [timesheet?.projectId, projects])

  const fetchTodosForProject = async (projectId: string) => {
    if (!projectId) return
    
    try {
      setLoadingTodos(true)
      // Get workspace from current context - we'll need to pass it or get it another way
      // For now, we'll fetch all todos and filter by project
      const response = await fetch(`/api/todo-items?projectId=${projectId}&includeArchived=false`)
      const data = await response.json()
      
      if (response.ok) {
        setAvailableTodos(data.todoItems || [])
      }
    } catch (error) {
      console.error('Failed to fetch todos:', error)
    } finally {
      setLoadingTodos(false)
    }
  }

  const handleToggleTodo = (todoId: string) => {
    setSelectedTodos(prev => {
      const existing = prev.find(t => t.todoItemId === todoId)
      if (existing) {
        return prev.filter(t => t.todoItemId !== todoId)
      } else {
        return [...prev, { todoItemId: todoId, hoursAllocated: 0 }]
      }
    })
  }

  const handleTodoHoursChange = (todoId: string, hours: number) => {
    setSelectedTodos(prev => {
      const updated = prev.map(t => 
        t.todoItemId === todoId 
          ? { ...t, hoursAllocated: Math.max(0, Math.min(hours, formData.hours)) }
          : t
      )
      return updated
    })
  }

  const getRemainingHours = () => {
    const allocatedHours = selectedTodos.reduce((sum, t) => sum + (t.hoursAllocated || 0), 0)
    return formData.hours - allocatedHours
  }

  const autoDistributeHours = () => {
    if (selectedTodos.length === 0) return
    const hoursPerTodo = formData.hours / selectedTodos.length
    setSelectedTodos(prev => prev.map(t => ({ ...t, hoursAllocated: hoursPerTodo })))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Ensure hours is at least 0.25 if it's 0
    const dataToSave = {
      ...formData,
      hours: formData.hours === 0 ? 0.25 : formData.hours,
      todoItems: selectedTodos.filter(t => t.hoursAllocated > 0) // Only include todos with allocated hours
    }
    
    onSave(dataToSave)
    setOpen(false)
    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      projectId: "",
      hours: 1,
      description: "",
      billable: false
    })
    setSelectedTodos([])
    setAvailableTodos([])
  }

  const handleChange = (field: keyof Timesheet, value: string | number | boolean) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // If project changed, check if it's a fixed monthly project
      if (field === 'projectId') {
        const selectedProject = projects.find(p => p.id === value)
        if (selectedProject?.billingType === 'fixed') {
          newData.billable = false // Fixed projects are not billable per timesheet
        }
      }
      
      return newData
    })
  }

  // Get selected project to check billing type
  const selectedProject = projects.find(p => p.id === formData.projectId)
  const isFixedProject = selectedProject?.billingType === 'fixed'

  const defaultTrigger = timesheet ? (
    <Button variant="outline" size="sm">
      <Edit className="h-4 w-4 mr-2" />
      Edit
    </Button>
  ) : (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Add New Entry
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-[95vw] md:w-[90vw] lg:w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {timesheet ? "Edit Timesheet" : "Add Timesheet"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-hidden">
          
          {/* Date and Project Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                required
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project">Project *</Label>
              <Select value={formData.projectId} onValueChange={(value) => handleChange("projectId", value)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{project.name}</span>
                        <span className="text-xs text-muted-foreground">{project.client.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Hours and Billable Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="hours">Hours *</Label>
              <Input
                id="hours"
                type="number"
                step="0.25"
                min="0"
                max="24"
                value={formData.hours}
                onChange={(e) => handleChange("hours", parseFloat(e.target.value) || 1)}
                placeholder="1.00"
                required
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">Decimal format (e.g., 1.5 = 1h 30m)</p>
            </div>
            {!isFixedProject && (
              <div className="space-y-1.5">
                <Label>Billable</Label>
                <div className="flex items-center gap-2 border rounded-md px-3 h-10">
                  <p className="text-sm flex-1">Billable to Client</p>
                  <Switch
                    checked={formData.billable}
                    onCheckedChange={(checked) => handleChange("billable", checked)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              placeholder="Describe what you worked on..."
              required
              className="resize-none"
            />
          </div>

          {/* Quick Hours Buttons */}
          <div className="flex gap-1.5">
            {[0.5, 1, 1.5, 2, 4, 8].map((hours) => (
              <Button
                key={hours}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleChange("hours", hours)}
                className="text-xs h-8"
              >
                {hours}h
              </Button>
            ))}
          </div>

          {/* Todo Items Selection */}
          {formData.projectId && (
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Link Todo Items (Optional)
                </Label>
                {selectedTodos.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={autoDistributeHours}
                    className="text-xs"
                  >
                    Auto-Distribute Hours
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Select todo items and allocate hours from this timesheet
              </p>
              
              {loadingTodos ? (
                <p className="text-sm text-muted-foreground">Loading todos...</p>
              ) : availableTodos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No todo items available for this project. Create them in the Todos page.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableTodos.map((todo) => {
                    const isSelected = selectedTodos.some(t => t.todoItemId === todo.id)
                    const selectedTodo = selectedTodos.find(t => t.todoItemId === todo.id)
                    
                    return (
                      <Card key={todo.id} className={`p-3 ${isSelected ? 'border-primary' : ''}`}>
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleTodo(todo.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{todo.title}</p>
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs mt-1 ${
                                    todo.status === 'todo' ? 'bg-gray-100 text-gray-800' :
                                    todo.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                    'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {todo.status.replace('-', ' ')}
                                </Badge>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`hours-${todo.id}`} className="text-xs">
                                  Hours:
                                </Label>
                                <Input
                                  id={`hours-${todo.id}`}
                                  type="number"
                                  step="0.25"
                                  min="0"
                                  max={formData.hours}
                                  value={selectedTodo?.hoursAllocated || 0}
                                  onChange={(e) => handleTodoHoursChange(todo.id, parseFloat(e.target.value) || 0)}
                                  className="h-8 w-20 text-sm"
                                />
                                <span className="text-xs text-muted-foreground">
                                  of {formData.hours}h
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
              
              {selectedTodos.length > 0 && (
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Allocated:</span>
                    <span className="font-semibold">
                      {selectedTodos.reduce((sum, t) => sum + (t.hoursAllocated || 0), 0).toFixed(2)}h
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Remaining:</span>
                    <span className={`font-semibold ${getRemainingHours() < 0 ? 'text-destructive' : ''}`}>
                      {getRemainingHours().toFixed(2)}h
                    </span>
                  </div>
                  {getRemainingHours() < 0 && (
                    <p className="text-xs text-destructive mt-1">
                      Warning: Total allocated hours exceeds timesheet hours
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {timesheet ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


