"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"

interface TodoItem {
  id?: string
  projectId: string
  title: string
  description?: string | null
  status?: 'todo' | 'in-progress' | 'done'
  position?: number
  isArchived?: boolean
}

interface Project {
  id: string
  name: string
  code: string
  client: {
    name: string
  }
}

interface TodoModalProps {
  todo?: TodoItem
  projects: Project[]
  onSave: (todo: TodoItem) => Promise<boolean> | boolean
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultProjectId?: string // Pre-select a project and hide the selector
}

export function TodoModal({ todo, projects, onSave, trigger, open: controlledOpen, onOpenChange, defaultProjectId }: TodoModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [formData, setFormData] = useState<TodoItem>({
    projectId: todo?.projectId || defaultProjectId || "",
    title: todo?.title || "",
    description: todo?.description || "",
    status: 'todo', // Always default to 'todo' for new todos
    ...(todo?.id && { id: todo.id, status: todo.status }) // Preserve existing status when editing
  })

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen

  useEffect(() => {
    if (todo) {
      setFormData({
        projectId: todo.projectId || "",
        title: todo.title || "",
        description: todo.description || "",
        status: todo.status || 'todo', // Preserve existing status when editing
        ...(todo.id && { id: todo.id })
      })
    } else {
      setFormData({
        projectId: defaultProjectId || "",
        title: "",
        description: "",
        status: 'todo' // Always default to 'todo' for new todos
      })
    }
  }, [todo, open, defaultProjectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const success = await onSave(formData)
    if (success) {
      setOpen(false)
      // Reset form if creating new
      if (!todo) {
        setFormData({
          projectId: defaultProjectId || "",
          title: "",
          description: "",
          status: 'todo'
        })
      }
    }
  }

  const defaultTrigger = todo ? (
    <Button variant="outline" size="sm">
      Edit
    </Button>
  ) : (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Add Todo
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-[95vw] md:w-[90vw] lg:w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {todo ? "Edit Todo" : "Add Todo"}
          </DialogTitle>
          <DialogDescription>
            {todo 
              ? "Update the todo item details" 
              : defaultProjectId 
                ? "Create a new todo item for this project"
                : "Create a new todo item"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Show project selector only if no default project is provided */}
          {!defaultProjectId && (
            <div className="space-y-1.5">
              <Label htmlFor="project">Project *</Label>
              <Select 
                value={formData.projectId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}
                disabled={!!todo} // Don't allow changing project after creation
              >
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
          )}
          {/* Show project name (read-only) if default project is set */}
          {defaultProjectId && !todo && (
            <div className="space-y-1.5">
              <Label>Project</Label>
              <div className="h-10 px-3 py-2 rounded-md border bg-muted text-sm flex items-center">
                {projects.find(p => p.id === formData.projectId)?.name || 'Unknown Project'}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter todo title"
              required
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="Enter todo description (optional)"
              className="resize-none"
            />
          </div>


          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.projectId || !formData.title}>
              {todo ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

