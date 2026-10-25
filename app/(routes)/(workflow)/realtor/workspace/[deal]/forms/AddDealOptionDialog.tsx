"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AddDealOptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddDealOption: (address: string) => void;
}

interface AddressSuggestion {
  place_name: string;
  full_address?: string;
  feature_name?: string;
}

export default function AddDealOptionDialog({
  open,
  onOpenChange,
  onAddDealOption
}: AddDealOptionDialogProps) {
  const [address, setAddress] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoibWNwMWx0IiwiYSI6ImNtY3Bydmt3OTA0N24yam9vZ2t5bTc5bzMifQ.wBMO_nsbyJy3ZA9IVXPulQ";

  const searchAddresses = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&types=address&limit=5&country=US`
      );
      
      if (response.ok) {
        const data = await response.json();
        const addressSuggestions: AddressSuggestion[] = data.features.map((feature: any) => ({
          place_name: feature.place_name,
          full_address: feature.properties?.full_address || feature.place_name,
          feature_name: feature.properties?.feature_name
        }));
        
        setSuggestions(addressSuggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
    searchAddresses(value);
  };

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    setAddress(suggestion.full_address || suggestion.place_name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleSubmit = () => {
    if (!address.trim()) return;
    if (address.toLowerCase() === "deal-wide") {
      toast.error("Deal-wide option not allowed");
      return;
    }
    onAddDealOption(address);
    // Reset and close
    setAddress("");
    setSuggestions([]);
    setShowSuggestions(false);
    onOpenChange(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setAddress("");
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md z-50">
        <DialogHeader>
          <DialogTitle>Add New Property</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <form>
            <div className="relative" ref={dropdownRef}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Property Address"
                className="w-full p-2 border rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={address}
                onChange={handleAddressChange}
                autoComplete="address-line1"
              />
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="absolute right-2 top-2.5">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                </div>
              )}

              {/* Custom dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-[9999] max-h-48 overflow-y-auto mt-1">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 text-sm text-gray-900"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <div className="font-medium">{suggestion.place_name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-black"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-black text-white hover:bg-gray-800"
          >
            Add Deal Option
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
