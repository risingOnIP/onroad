'use client'

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import React, { useState } from "react";

interface AddBlockModalProps {
  handleAddBlock: (newBlockName: string) => void;
  isAddBlockModalOpen: boolean, 
  setIsAddBlockModalOpen: (change: boolean) => void; 
  previousBlockNames: string[]; 
}

const AddBlockModal = ({ handleAddBlock, isAddBlockModalOpen, setIsAddBlockModalOpen, previousBlockNames }: AddBlockModalProps) => {

  interface ErrorMessage {
    title: string,
    message: string; 
  }

  const [newBlockName, setNewBlockName] = useState("");
  const [errorMsg, setErrorMsg] = useState<ErrorMessage | null>(null)


  const onBlockAdded = () => {
    if (newBlockName.includes("%20")) {
      setErrorMsg({title: '"%20" not allowed in name', message: '"Please do not use %20 in the block name."'})
    }
    else if (previousBlockNames.includes(newBlockName)) {
      setErrorMsg({title: "Duplicate Block name", message: "You cannot have two block names with the same name."})
    }
    else {  
      handleAddBlock(newBlockName)
    }
  }

  return (
    <Dialog open={isAddBlockModalOpen} onOpenChange={setIsAddBlockModalOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Form Block</DialogTitle>
          <DialogDescription>
            Enter a name for the new block. Questions added under this block
            will be grouped together.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="block-name" className="text-right">
              Name
            </Label>
            <Input
              id="block-name"
              value={newBlockName}
              onChange={(e) => setNewBlockName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Property Details"
            />
          </div>
        </div>


        {(errorMsg!= null) && (<Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            
            <AlertDescription>
              You cannot use %20 in the block name.
            </AlertDescription>
        </Alert>)}


        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
          <Button type="button" onClick={onBlockAdded}>
            Create Block
            </Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddBlockModal
