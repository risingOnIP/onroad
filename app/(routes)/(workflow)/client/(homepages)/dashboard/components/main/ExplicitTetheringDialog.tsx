"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent, 
  SelectItem,
} from "@/components/ui/select";
import {
  getSearchesWithoutRealtor,
  addSearch,
} from "@/app/actions/client/search-actions";
import { Search } from "@/components/files/types/client";
import AddSearchDialog from "../../../search/components/AddSearchDialog";
import { acceptPendingTetherRequestByClient } from "@/app/actions/tethers/realtor-client-tether-actions";

interface ExplicitTetheringDialogProps {
  explicitTether: {explicitTetherId: string, realtorEmail: string } | null;
  setExplicitTether: (setValue:  {explicitTetherId: string, realtorEmail: string }| null) => void;
  onTetherSuccess: () => void; 
}

const ExplicitTetheringDialog: React.FC<ExplicitTetheringDialogProps> = ({
  explicitTether,
  setExplicitTether,
  onTetherSuccess
}) => {
  const [selectedSearchId, setSelectedSearchId] = useState<string>("");
  const [searchesWithoutRealtor, setSearchesWithoutRealtor] = useState<
    Search[]
  >([]);
  const [isAddSearchDialogOpen, setIsAddSearchDialogOpen] = useState(false);

  useEffect(() => {
    const fetchSearches = async () => {
      const searches = await getSearchesWithoutRealtor();
      setSearchesWithoutRealtor(searches);
    };

    fetchSearches();
  }, []);

  const handleSaveFromDropdownSearches = async () => {
    if (selectedSearchId) {
      //saving from dropdown of searches without realtor

      await acceptPendingTetherRequestByClient(
        explicitTether!.explicitTetherId,
        selectedSearchId
      );

      setExplicitTether(null);
      onTetherSuccess(); 
    }
  };

  const handleAddSearch = async (newSearch: Partial<Search>) => {
    try {
      
      //make a new search in supabase, and tether to this search in supabase and close all dialogs
      const inserting = { ...newSearch, status: "active" } as Search;
      const searchJustAdded: Search = await addSearch(inserting, false)

      //tether correctly 
      acceptPendingTetherRequestByClient(explicitTether?.explicitTetherId ?? "", searchJustAdded.id)
      setIsAddSearchDialogOpen(false);
      setExplicitTether(null);
      onTetherSuccess(); 
    } catch (error) {
      console.error("Failed to add search:", error);
    }
  };

  return (
    <>
      <Dialog
        open={explicitTether?.explicitTetherId !== null}
        onOpenChange={() => setExplicitTether(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tether to a saved search</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Choose a search</label>
              <Select
                value={selectedSearchId}
                onValueChange={(value) => setSelectedSearchId(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a search…" />
                </SelectTrigger>
                <SelectContent>
                  {searchesWithoutRealtor.map((search) => (
                    <SelectItem key={search.id} value={search.id}>
                      {search.search_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="ghost" onClick={() => setExplicitTether(null)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsAddSearchDialogOpen(true)}
            >
              Create New Search
            </Button>
            <Button disabled={!selectedSearchId} onClick={handleSaveFromDropdownSearches}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddSearchDialog
        open={isAddSearchDialogOpen}
        onOpenChange={setIsAddSearchDialogOpen}
        handleSave={handleAddSearch}
        presetRealtorEmail={explicitTether?.realtorEmail || ""}
      />
    </>
  );
};

export default ExplicitTetheringDialog;
