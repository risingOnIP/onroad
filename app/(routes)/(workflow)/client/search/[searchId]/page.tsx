// app/search/[searchId]/page.tsx

import { redirect } from 'next/navigation';
import React from 'react';
import { getSearchById } from '@/app/actions/client/search-actions';
import { Search } from '@/components/files/types/client';

type IndividualSearchProps = {
  params: Promise<{
    searchId: string;
  }>;
};

export default async function IndividualSearch({ params }: IndividualSearchProps) {
  const { searchId } = await params;

  let search: Search | null = null;
  try {
    search = await getSearchById(searchId);
  } catch (err) {
    console.error("Search not found", err);
    redirect('/error')
  }

  if (!search) {redirect('/error')}

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">{search.search_name}</h1>
      <p className="text-gray-700 mb-4">
        Status: <span className="capitalize">{search.status}</span>
      </p>
      <p className="text-gray-700">Location: {search.searchFilters.location}</p>
      <p className="text-gray-700">
        Budget: ${search.searchFilters.minBudget.toLocaleString()} - ${search.searchFilters.maxBudget.toLocaleString()}
      </p>
      <p className="text-gray-700">Property Type: {search.searchFilters.propertyType}</p>
    </div>
  );
}
