import React, { useState, useEffect } from 'react';
import { Search, Filter, Edit, MoreHorizontal } from 'lucide-react';
import Fuse from 'fuse.js';

export default function PropertyTable({ properties = [], onFilter, onEdit, onMore }: { properties: any[], onFilter: () => void, onEdit: (property: any) => void, onMore: (property: any) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProperties, setFilteredProperties] = useState(properties);
  
  // Configure Fuse.js
  const fuseOptions = {
    keys: [
      'address',
      'client',
      'price',
      'status',
      'type',
      'lastUpdate'
    ],
    threshold: 0.4, // Lower threshold = stricter matching
    includeScore: true
  };
  
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredProperties(properties);
      return;
    }
    
    const fuse = new Fuse(properties, fuseOptions);
    const results = fuse.search(searchTerm);
    
    // Extract the item from each result
    const matchedProperties = results.map(result => result.item);
    setFilteredProperties(matchedProperties);
  }, [searchTerm, properties, fuseOptions]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  return (
    <section className="bg-card rounded-lg shadow overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">View My Properties</h2>
        <div className="flex gap-3">
          <div className="flex items-center bg-muted rounded px-3 py-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search properties..." 
              className="bg-transparent border-none ml-2 outline-none w-52"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <button 
            className="flex items-center border border-border rounded px-3 py-2 hover:bg-muted/50"
            onClick={onFilter}
          >
            <Filter className="w-4 h-4" />
            <span className="ml-2">Filter</span>
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Address</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Client</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Price</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Type</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Last Update</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProperties.length > 0 ? (
              filteredProperties.map((property, index) => (
                <tr key={index} className="border-t border-border hover:bg-muted/30">
                  <td className="py-3 px-4">{property.address}</td>
                  <td className="py-3 px-4">{property.client}</td>
                  <td className="py-3 px-4">{property.price}</td>
                  <td className="py-3 px-4">{property.status}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                      property.type === 'buying' ? 'bg-info/20 text-info-foreground' : 'bg-success/20 text-success-foreground'
                    }`}>
                      {property.type === 'buying' ? 'Buying' : 'Selling'}
                    </span>
                  </td>
                  <td className="py-3 px-4">{property.lastUpdate}</td>
                  <td className="py-3 px-4 flex gap-2">
                    <button 
                      className="text-muted-foreground hover:text-info" 
                      onClick={() => onEdit && onEdit(property)}
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button 
                      className="text-muted-foreground hover:text-info"
                      onClick={() => onMore && onMore(property)}
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="border-t border-border">
                <td colSpan={7} className="py-4 px-4 text-center text-muted-foreground">
                  No properties found matching your search
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}