"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useWorkspace } from "@/lib/workspace-context"
import { Plus, Archive, ArchiveRestore, ChevronDown, ChevronRight, Edit, Trash2, MoreVertical } from "lucide-react"
import { TodoModal } from "@/components/modals/TodoModal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteModal } from "@/components/modals/DeleteModal"
import dayjs from "dayjs"

interface Project {
  id: string
  name: string
  code: string
  client: string
}

interface TodoItem {
  id: string
  projectId: string
  title: string
  description: string | null
  status: 'todo' | 'in-progress' | 'done'
  position: number
  isArchived: boolean
  project: {
    id: string
    name: string
    code: string
    client: string | null
  } | null
  totalHours: number
  timesheetCount: number
  lastTimesheetDate: string | null
  createdAt: string
  updatedAt: string
}

export default function TodosPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [todoItems, setTodoItems] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showArchived, setShowArchived] = useState(false)
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null)
  const { currentWorkspace } = useWorkspace()

  const formatDateTime = (value?: string | null) => {
    if (!value) return '-'
    const d = dayjs(value)
    if (!d.isValid()) return '-'
    return d.format('h.mmA DD/MM/YYYY')
  }

  const fetchProjects = async () => {
    if (!currentWorkspace) return
    
    try {
      const response = await fetch(`/api/projects?workspaceId=${currentWorkspace.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setProjects(data.projects || [])
        // Expand all projects by default
        setExpandedProjects(new Set(data.projects?.map((p: Project) => p.id) || []))
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const fetchTodos = async () => {
    if (!currentWorkspace) return
    
    try {
      setLoading(true)
      const params = new URLSearchParams({
        workspaceId: currentWorkspace.id,
        includeArchived: showArchived.toString()
      })
      if (selectedProject !== "all") {
        params.append('projectId', selectedProject)
      }
      
      const response = await fetch(`/api/todo-items?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setTodoItems(data.todoItems || [])
        setError("")
      } else {
        setError(data.error || "Failed to fetch todo items")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [currentWorkspace])

  useEffect(() => {
    fetchTodos()
  }, [currentWorkspace, showArchived, selectedProject])

  const handleSaveTodo = async (todoData: any) => {
    try {
      const method = todoData.id ? 'PUT' : 'POST'
      
      const response = await fetch('/api/todo-items', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...todoData,
          workspaceId: currentWorkspace?.id
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        await fetchTodos()
        return true
      } else {
        setError(data.error || "Failed to save todo item")
        return false
      }
    } catch (error) {
      setError("Network error. Please try again.")
      return false
    }
  }

  const handleDeleteTodo = async (todoId: string) => {
    try {
      const response = await fetch(`/api/todo-items?id=${todoId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchTodos()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to delete todo item")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  const handleStatusChange = async (todoId: string, newStatus: 'todo' | 'in-progress' | 'done') => {
    try {
      const response = await fetch('/api/todo-items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: todoId,
          status: newStatus
        })
      })
      
      if (response.ok) {
        await fetchTodos()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to update todo status")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  const handleArchiveTodo = async (todoId: string, isArchived: boolean) => {
    try {
      const response = await fetch('/api/todo-items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: todoId,
          isArchived
        })
      })
      
      if (response.ok) {
        await fetchTodos()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to archive todo item")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  const handleArchiveAllDone = async () => {
    if (!currentWorkspace) return
    
    try {
      const doneItems = todoItems.filter(t => t.status === 'done' && !t.isArchived)
      
      if (doneItems.length === 0) {
        setError("No completed items to archive")
        return
      }
      
      const archivePromises = doneItems.map(item => 
        fetch('/api/todo-items', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: item.id,
            isArchived: true
          })
        })
      )
      
      await Promise.all(archivePromises)
      await fetchTodos()
      setError("")
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev)
      if (newSet.has(projectId)) {
        newSet.delete(projectId)
      } else {
        newSet.add(projectId)
      }
      return newSet
    })
  }

  // Group todos by project
  const groupedTodos = projects.reduce((acc, project) => {
    const projectTodos = todoItems
      .filter(todo => todo.projectId === project.id)
      .sort((a, b) => {
        // Sort by status: todo -> in-progress -> done
        const statusOrder = { 'todo': 0, 'in-progress': 1, 'done': 2 }
        const statusDiff = statusOrder[a.status] - statusOrder[b.status]
        if (statusDiff !== 0) return statusDiff
        // Then by position
        return a.position - b.position
      })
    acc[project.id] = projectTodos
    return acc
  }, {} as Record<string, TodoItem[]>)

  // Filter projects based on selectedProject
  const filteredProjects = selectedProject === "all" 
    ? projects 
    : projects.filter(p => p.id === selectedProject)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'todo':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">To Do</Badge>
      case 'in-progress':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">In Progress</Badge>
      case 'done':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Done</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading && todoItems.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Todos</h1>
            <p className="text-muted-foreground">Loading todos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Todos</h1>
          <p className="text-muted-foreground">
            Manage tasks and track progress across projects. Status updates automatically based on timesheets.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {todoItems.filter(t => t.status === 'done' && !t.isArchived).length > 0 && (
            <Button
              variant="outline"
              onClick={handleArchiveAllDone}
              title="Archive all completed items"
            >
              <ArchiveRestore className="h-4 w-4 mr-2" />
              Archive All Done
            </Button>
          )}
          <Button
            variant={showArchived ? "default" : "outline"}
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="h-4 w-4 mr-2" />
            {showArchived ? "Hide Archived" : "Show Archived"}
          </Button>
          <TodoModal 
            projects={projects.map(p => ({ ...p, client: { name: p.client } })) as any} 
            onSave={handleSaveTodo}
          />
          {editingTodo && (
            <TodoModal
              todo={editingTodo}
              projects={projects.filter(p => p.id === editingTodo.projectId).map(p => ({ ...p, client: { name: p.client } })) as any}
              onSave={async (todoData) => {
                const success = await handleSaveTodo(todoData)
                if (success) {
                  setEditingTodo(null)
                }
                return success
              }}
              open={!!editingTodo}
              onOpenChange={(open) => !open && setEditingTodo(null)}
            />
          )}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No projects found. Create a project first.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              {/* <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]"></TableHead>
                  <TableHead className="min-w-[420px]">Title</TableHead>
                  <TableHead className="w-[140px]">Created</TableHead>
                  <TableHead className="w-[140px]">Last Activity</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader> */}
              <TableBody>
                {filteredProjects.map((project) => {
                  const projectTodos = groupedTodos[project.id] || []
                  const isExpanded = expandedProjects.has(project.id)
                  const activeTodos = projectTodos.filter(t => !t.isArchived)
                  const archivedTodos = showArchived ? projectTodos.filter(t => t.isArchived) : []

                  if (activeTodos.length === 0 && archivedTodos.length === 0 && !showArchived) {
                    return null
                  }

                  return (
                    <React.Fragment key={`project-fragment-${project.id}`}>
                      {/* Project Header Row */}
                      <TableRow 
                        className="bg-muted/50 cursor-pointer hover:bg-muted"
                        onClick={() => toggleProject(project.id)}
                      >
                        {/* spacer under Status column so project name aligns under Title */}
                        {/* <TableCell></TableCell> */}
                        <TableCell colSpan={5}>
                          <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                            <span className="font-semibold">{project.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {project.client}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              ({activeTodos.length} active, {activeTodos.filter(t => t.status === 'done').length} done)
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Todo Items */}
                      {isExpanded && activeTodos.map((todo) => (
                        <TableRow key={todo.id} className={todo.isArchived ? 'opacity-60' : ''}>
                          <TableCell>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${
                                todo.status === 'done'
                                  ? 'bg-green-100 text-green-800'
                                  : todo.status === 'in-progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                              title={todo.status === 'done' ? 'Done' : todo.status === 'in-progress' ? 'In Progress' : 'To Do'}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                todo.status === 'done' ? 'bg-green-700' : todo.status === 'in-progress' ? 'bg-blue-700' : 'bg-gray-700'
                              }`} />
                              {todo.status === 'done' ? 'Done' : todo.status === 'in-progress' ? 'In Progress' : 'To Do'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="min-w-0">
                              <div className="font-medium truncate" title={todo.title}>{todo.title}</div>
                              {todo.description && (
                                <div className="text-sm text-muted-foreground line-clamp-1" title={todo.description}>
                                  {todo.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {formatDateTime(todo.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {formatDateTime(todo.lastTimesheetDate)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingTodo(todo)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {todo.status === 'done' && (
                                  <>
                                    {!todo.isArchived ? (
                                      <DropdownMenuItem onClick={() => handleArchiveTodo(todo.id, true)}>
                                        <Archive className="h-4 w-4 mr-2" />
                                        Archive
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem onClick={() => handleArchiveTodo(todo.id, false)}>
                                        <Archive className="h-4 w-4 mr-2" />
                                        Unarchive
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                  </>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteTodo(todo.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* Archived Todos */}
                      {isExpanded && showArchived && archivedTodos.map((todo) => (
                        <TableRow key={todo.id} className="opacity-60">
                          <TableCell>
                            <Badge variant="secondary" className="bg-gray-300 text-gray-700">Archived</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="min-w-0">
                              <div className="font-medium truncate" title={todo.title}>{todo.title}</div>
                              {todo.description && (
                                <div className="text-sm text-muted-foreground line-clamp-1" title={todo.description}>
                                  {todo.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {formatDateTime(todo.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {formatDateTime(todo.lastTimesheetDate)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleArchiveTodo(todo.id, false)}>
                                  <Archive className="h-4 w-4 mr-2" />
                                  Unarchive
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteTodo(todo.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  )
                })}
                {filteredProjects.every(p => (groupedTodos[p.id] || []).length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No todo items found. Create your first todo item to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

