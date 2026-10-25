'use client';

import React from 'react';
import Link from 'next/link';
import { Search } from '@/components/files/types/client';

const statusStyles = {
  active: 'bg-green-500',
  closed: 'bg-gray-500',
};

type SearchCardProps = React.HTMLAttributes<HTMLDivElement> & {
  // getTetherStatus: () => Promise<"active" | "pending" | "rejected">;
  search: Search;
  status: 'active' | 'closed';
};

function markupNumber(value: number): string {
  return value.toLocaleString('en-US');
}

export default function SearchCard({ search, status,...props }: SearchCardProps) {
  const { searchFilters, realtor_email, search_name } = search;
  const { minBudget, maxBudget, propertyType } = searchFilters;

  return (
    <Link href={`/client/search/${search.id}`} passHref>
      <div
        {...props}
        className={`bg-white rounded-lg shadow overflow-hidden transition-transform hover:-translate-y-1 cursor-pointer ${props.className || ''}`}
      >
        <div className="p-4">
          <div className="font-semibold text-lg mb-1">{search_name}</div>

          <div className="text-sm text-gray-600 mb-2">
            <span className="font-medium text-gray-800">Budget:</span>{' '}
            <span className="text-blue-600 font-semibold">
              ${markupNumber(minBudget)} to ${markupNumber(maxBudget)}
            </span>
          </div>

          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{realtor_email || 'No Realtor'}</span>
            <span>{propertyType}</span>
          </div>

          {status && (
            <span
              className={`inline-block text-xs font-semibold px-2 py-1 rounded-full text-white ${statusStyles[status] || 'bg-blue-500'}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
