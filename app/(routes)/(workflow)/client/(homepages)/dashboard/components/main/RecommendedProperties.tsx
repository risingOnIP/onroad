import React from 'react';
import Image from 'next/image';

const statusStyles = {
  active: 'bg-green-500',
  pending: 'bg-amber-500',
  sold: 'bg-red-500',
  // Add more status variants as needed
};

export default function RecommendedProperties({ property }: { property: any }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden transition-transform hover:-translate-y-1 cursor-pointer">
      
      {/* Image section */}
      <div className="relative w-full h-48">
        <Image
          src={property.image}        // or wherever your image URL is stored
          alt={property.title}
          fill                         // Fill the parent container
          style={{ objectFit: 'cover' }}
        />
      </div>
      
      {/* Text/Details section */}
      <div className="p-4">
        <div className="font-semibold mb-2">{property.title}</div>
        <div className="text-blue-600 font-semibold mb-2">{property.price}</div>
        <div className="flex text-sm text-gray-600 justify-between">
          <span>{property.location}</span>
          <span>{property.client}</span>
        </div>
        <span
          className={`inline-block text-xs font-semibold px-2 py-1 rounded-full text-white mt-2 ${
            statusStyles[property.status as keyof typeof statusStyles] || 'bg-blue-500'
          }`}
        >
          {property.statusText || property.status}
        </span>
      </div>
    </div>
  );
}
