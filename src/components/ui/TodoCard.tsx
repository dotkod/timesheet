"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Archive, Trash2, Edit, CheckCircle2, Circle, PlayCircle } from "lucide-react"
import { TodoModal } from "@/components/modals/TodoModal"
import { useState } from "react"
import { useWorkspace } from "@/lib/workspace-context"

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
  createdAt: string
  updatedAt: string
}

interface TodoCardProps {
  todo: TodoItem
  onStatusChange: (todoId: string, newStatus: 'todo' | 'in-progress' | 'done') => void
  onArchive: (todoId: string, isArchived: boolean) => void
  onDelete: (todoId: string) => void
  onEdit: (todo: TodoItem) => Promise<boolean> | boolean
}

export function TodoCard({ todo, onStatusChange, onArchive, onDelete, onEdit }: TodoCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const { currentWorkspace } = useWorkspace()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo':
        return <Circle className="h-4 w-4" />
      case 'in-progress':
        return <PlayCircle className="h-4 w-4" />
      case 'done':
        return <CheckCircle2 className="h-4 w-4" />
      default:
        return <Circle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      case 'done':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleEdit = async (todoData: any) => {
    const res = await onEdit(todoData)
    if (res !== false) {
      setEditOpen(false)
      return true
    }
    return false
  }

  return (
    <>
      <Card className={`p-3 hover:shadow-md transition-shadow ${todo.isArchived ? 'opacity-60' : ''}`}>
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="font-medium text-sm leading-tight">{todo.title}</h4>
              {todo.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {todo.description}
                </p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {todo.status !== 'todo' && (
                  <DropdownMenuItem onClick={() => onStatusChange(todo.id, 'todo')}>
                    <Circle className="h-4 w-4 mr-2" />
                    Move to To Do
                  </DropdownMenuItem>
                )}
                {todo.status !== 'in-progress' && (
                  <DropdownMenuItem onClick={() => onStatusChange(todo.id, 'in-progress')}>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Move to In Progress
                  </DropdownMenuItem>
                )}
                {todo.status !== 'done' && (
                  <DropdownMenuItem onClick={() => onStatusChange(todo.id, 'done')}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark as Done
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {/* Only allow archiving done items */}
                {todo.status === 'done' && (
                  <>
                    {!todo.isArchived ? (
                      <DropdownMenuItem onClick={() => onArchive(todo.id, true)}>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => onArchive(todo.id, false)}>
                        <Archive className="h-4 w-4 mr-2" />
                        Unarchive
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem 
                  onClick={() => onDelete(todo.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>
      {editOpen && (
        <TodoModal
          todo={todo}
          projects={todo.project ? [{
            id: todo.project.id,
            name: todo.project.name,
            code: todo.project.code,
            client: { name: todo.project.client || '' }
          }] : []}
          onSave={handleEdit}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </>
  )
}

