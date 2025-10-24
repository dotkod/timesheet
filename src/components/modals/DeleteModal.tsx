"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Trash2 } from "lucide-react"

interface DeleteModalProps {
  itemType: string
  itemName: string
  onConfirm: () => void
  trigger?: React.ReactNode
}

export function DeleteModal({ itemType, itemName, onConfirm, trigger }: DeleteModalProps) {
  const [open, setOpen] = useState(false)

  const handleConfirm = () => {
    onConfirm()
    setOpen(false)
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
      <Trash2 className="h-4 w-4 mr-2" />
      Delete
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-red-600">Delete {itemType}</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{itemName}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm}>
            Delete {itemType}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


