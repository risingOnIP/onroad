'use client';

import React, { useEffect, useState } from "react";
import AddSearchDialog from "./AddSearchDialog";
import { addSearch, getAllSearches } from "@/app/actions/client/search-actions";
import SearchCard from "./SearchCard";
import { Search } from "@/components/files/types/client";

type PropertySearchesProps = {
  statusShown: "active" | "closed" | "all";
  shouldShowAddCard?: boolean;
};

export default function PropertySearches({
  statusShown = "all",
  shouldShowAddCard = false,
}: PropertySearchesProps) {
  const [addSearchDialog, setAddSearchDialog] = useState(false);
  const [searchArray, setSearchArray] = useState<Search[]>([]);

  // Fetch and set searches based on status
  const fillSearches = async (status: "active" | "closed" | "all"): Promise<Search[]> => {
    const allSearches = await getAllSearches();
    if (status === "all") return allSearches;
    return allSearches.filter((search) => search.status === status);
  };

  // Initial load
  useEffect(() => {
    const fetchSearches = async () => {
      const searches = await fillSearches(statusShown);
      setSearchArray(searches);
    };
    fetchSearches();
  }, [statusShown]);

  // Handle new search addition
  const onAddSearch = async (passed: Partial<Search>) => {
    const inserting = { ...passed, status: "active" } as Search;
    await addSearch(inserting, true);
    const refreshed = await fillSearches(statusShown);
    setSearchArray(refreshed);
  };

  return (
    <>
      <section className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {searchArray.map((property) => (
            <SearchCard key={property.id} search={property} status={property.status}/>
          ))}

          {shouldShowAddCard && (
            <div
              onClick={() => setAddSearchDialog(true)}
              className="bg-white bg-opacity-20 rounded-lg overflow-hidden transition-transform hover:-translate-y-1 hover:bg-opacity-70 cursor-pointer border-2 border-dashed border-gray-300 border-opacity-30 flex items-center justify-center h-full min-h-32"
            >
              <div className="p-4 text-center">
                <div className="font-semibold text-gray-400">Add Search</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Dialog controlled from state */}
      <AddSearchDialog
        open={addSearchDialog}
        onOpenChange={setAddSearchDialog}
        handleSave={onAddSearch}
      />
    </>
  );
}
