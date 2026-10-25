"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Plus, Users } from "lucide-react";
import { Party } from "@/components/files/types/realtor";
import Fuse from "fuse.js";
import { getAllParties } from "@/app/actions/realtor/client-actions";
import {
  createDealPartyRow,
  createDealOptionPartyRow,
} from "@/app/actions/realtor/dealClient-actions";
import { toast } from "sonner";
import { debounce } from "lodash";

// Cache for parties data to avoid repeated API calls
let partiesCache: Party[] | null = null;
let fuseInstance: Fuse<Party> | null = null;
let cacheInitialized = false;

// Function to invalidate cache (can be called when parties are updated)
export const invalidatePartiesCache = () => {
  partiesCache = null;
  fuseInstance = null;
  cacheInitialized = false;
};

interface AddPartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPartyAdded: () => void;
  dealId?: string;
  dealOptionId?: string;
  dealSide?: string;
  dealOptionName?: string;
  existingEmails?: string[];
}

interface NewParty {
  full_name: string;
  email: string;
  role: string;
}

export default function AddPartyModal({
  isOpen,
  onClose,
  onPartyAdded,
  dealId,
  dealOptionId,
  dealSide,
  dealOptionName,
  existingEmails = [],
}: AddPartyModalProps) {
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [initializingSearch, setInitializingSearch] = useState(false);
  const [newParty, setNewParty] = useState<NewParty>({
    full_name: "",
    email: "",
    role: "",
  });
  const [validationErrors, setValidationErrors] = useState<{
    full_name?: string;
    email?: string;
    role?: string;
  }>({});

  // Search functionality
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Party[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Role options based on deal side and deal option name
  const roleOptions: string[] = (() => {
    if (!dealSide || !dealOptionName) return [];
    
    const isDealWide = dealOptionName.toLowerCase() === "deal-wide";
    
    switch (dealSide) {
      case "buy":
        if (isDealWide) {
          return ["buyer", "buyer_agent"];
        } else {
          return ["seller", "seller_agent", "buyer", "buyer_agent"];
        }
      case "rent":
        if (isDealWide) {
          return ["tenant", "tenant_agent"];
        } else {
          return ["landlord", "landlord_agent", "tenant", "tenant_agent"];
        }
      case "sell":
        return ["seller", "seller_agent", "buyer", "buyer_agent"];
      case "lease":
        return ["landlord", "tenant", "landlord_agent", "tenant_agent"];
      default:
        return [];
    }
  })();

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        if (fuseInstance && value.trim()) {
          setSearchLoading(true);
          try {
            const results = fuseInstance.search(value);
            setSearchResults(results.map((result) => result.item));
            setShowSearchResults(true);
          } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
            setShowSearchResults(false);
          } finally {
            setSearchLoading(false);
          }
        } else {
          setSearchResults([]);
          setShowSearchResults(false);
          setSearchLoading(false);
        }
      }, 300),
    []
  );


  // Initialize Fuse search when modal opens (with caching)
  useEffect(() => {
    const initializeSearch = async () => {
      if (cacheInitialized && fuseInstance) {
        // Already initialized, no need to fetch again
        return;
      }

      setInitializingSearch(true);
      
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      try {
        if (!partiesCache) {
          const allParties = await getAllParties();
          partiesCache = allParties;
        }
        
        if (!fuseInstance) {
          fuseInstance = new Fuse(partiesCache, {
            keys: ["full_name", "email"],
            threshold: 0.3,
            includeScore: true,
          });
        }
        
        cacheInitialized = true;
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error("Error initializing party search:", error);
        }
      } finally {
        setInitializingSearch(false);
      }
    };

    if (isOpen) {
      initializeSearch();
    }
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isOpen]);

  // Comprehensive state cleanup logic
  useEffect(() => {
    if (!isOpen) {
      // Cancel any pending operations
      debouncedSearch.cancel();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      // Reset all state immediately and synchronously
      setNewParty({ full_name: "", email: "", role: "" });
      setSearchTerm("");
      setSearchResults([]);
      setShowSearchResults(false);
      setSearchLoading(false);
      setInitializingSearch(false);
      setLoading(false);
      setValidationErrors({});
      
      // Force cleanup of any lingering UI state
      if (searchDropdownRef.current) {
        searchDropdownRef.current.blur();
      }
    }
  }, [isOpen]);
  
  // Additional cleanup on component unmount
  useEffect(() => {
    return () => {
      // Ensure cleanup happens even if component unmounts while modal is open
      debouncedSearch.cancel();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedSearch]);

  // Handle clicking outside search dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };
    
    // Always add listener when modal is open, always clean up
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    // Always return cleanup function
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSearchChange = useCallback(
    (value: string) => {
      try {
        setSearchTerm(value);
        setNewParty((prev) => ({ ...prev, full_name: value }));
        debouncedSearch(value);
      } catch (error) {
        console.error('Error in handleSearchChange:', error);
        // Reset search state on error
        setSearchResults([]);
        setShowSearchResults(false);
        setSearchLoading(false);
      }
    },
    [debouncedSearch]
  );

  const handleSelectParty = useCallback(
    (party: Party) => {
      setNewParty({
        full_name: party.full_name,
        email: party.email,
        role: newParty.role, // Keep the selected role
      });
      setSearchTerm(party.full_name);
      setShowSearchResults(false);
      // Clear email error if it exists
      setValidationErrors(prev => ({ ...prev, email: undefined }));
    },
    [newParty.role]
  );

  const validateEmail = (email: string) => {
    const normalizedEmail = email.toLowerCase();
    if (existingEmails.some(e => e.toLowerCase() === normalizedEmail)) {
      setValidationErrors(prev => ({ 
        ...prev, 
        email: "A party with this email already exists in this deal" 
      }));
      return false;
    }
    setValidationErrors(prev => ({ ...prev, email: undefined }));
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setValidationErrors({});

    // Validate required fields
    let hasErrors = false;
    const errors: { full_name?: string; email?: string; role?: string } = {};

    if (!newParty.full_name) {
      errors.full_name = "Name is required";
      hasErrors = true;
    }

    if (!newParty.email) {
      errors.email = "Email is required";
      hasErrors = true;
    } else if (!validateEmail(newParty.email)) {
      hasErrors = true;
      // Error already set by validateEmail
    }

    if (!newParty.role) {
      errors.role = "Role is required";
      hasErrors = true;
    }

    if (hasErrors) {
      setValidationErrors(errors);
      return;
    }

    if (!dealId && !dealOptionId) {
      toast.error("No deal or deal option ID provided");
      return;
    }

    setLoading(true);
    try {
      // Determine whether to use dealOptionId based on specific rules for each deal type and role
      const shouldUseDealOption = () => {
        switch (dealSide) {
          case "buy":
            // Only seller and seller_agent use dealOptionId
            return newParty.role === "seller" || newParty.role === "seller_agent";
          case "rent":
            // Only landlord and landlord_agent use dealOptionId
            return newParty.role === "landlord" || newParty.role === "landlord_agent";
          case "sell":
            // Nobody uses dealOptionId in sell deals
            return false;
          case "lease":
            // Nobody uses dealOptionId in lease deals
            return false;
          default:
            return false;
        }
      };

      // Determine realtorIsRepresenting based on specific rules for each deal type and role
      const getRealtorIsRepresenting = () => {

        switch (dealSide) {
          case "buy":

            return newParty.role === "buyer";
          case "rent":
            return newParty.role === "tenant";
          case "lease":
            return newParty.role === "landlord";
          case "sell":
            return newParty.role === "seller";
          default:
            return false;
        }
      };

      const willUseDealOption = shouldUseDealOption() && dealOptionId;
      const realtorIsRepresenting = getRealtorIsRepresenting();

      const partyData = {
        role: newParty.role,
        realtorIsRepresenting,
        partyNumber: 1, // This will be handled by the backend
        party: {
          full_name: newParty.full_name,
          email: newParty.email,
          phone_number: "",
          current_transaction_status: "searching" as const,
          form_information: {},
          notes: "",
        },
      };

      if (willUseDealOption) {
        await createDealOptionPartyRow(dealOptionId, [partyData]);
      } else if (dealId) {
        await createDealPartyRow(dealId, [partyData]);
      } else {
        toast.error("Unable to determine where to save the party");
        return;
      }

      toast.success("Party added successfully!");
      // Invalidate cache so new party appears in search
      invalidatePartiesCache();
      onPartyAdded();
      onClose(); // Signal parent to close. State cleanup is handled by useEffect.
    } catch (error) {
      console.error("Error adding party:", error);
      toast.error("Failed to add party. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      modal={true}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Add New Party
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="party-name">Name *</Label>
            <div className="relative" ref={searchDropdownRef}>
              <Input
                id="party-name"
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Enter party name"
                required
                autoComplete="off"
                className={validationErrors.full_name ? "border-red-500" : ""}
              />
              {(searchLoading || initializingSearch) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}

              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-[52] w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((party) => (
                    <div
                      key={party.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                      onClick={() => handleSelectParty(party)}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div className="font-medium">{party.full_name}</div>
                      <div className="text-sm text-gray-600">{party.email}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {validationErrors.full_name && (
              <p className="text-sm text-red-500 mt-1">{validationErrors.full_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="party-email">Email *</Label>
            <Input
              id="party-email"
              type="email"
              value={newParty.email}
              onChange={(e) => {
                setNewParty((prev) => ({ ...prev, email: e.target.value }));
                // Clear error when user starts typing
                if (validationErrors.email) {
                  setValidationErrors(prev => ({ ...prev, email: undefined }));
                }
              }}
              onBlur={(e) => {
                // Validate email on blur
                if (e.target.value) {
                  validateEmail(e.target.value);
                }
              }}
              placeholder="Enter email address"
              required
              className={validationErrors.email ? "border-red-500" : ""}
            />
            {validationErrors.email && (
              <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="party-role">Role *</Label>
            <Select
              value={newParty.role}
              onValueChange={(value) => {
                setNewParty((prev) => ({ ...prev, role: value }));
                // Clear error when user selects a role
                if (validationErrors.role) {
                  setValidationErrors(prev => ({ ...prev, role: undefined }));
                }
              }}
            >
              <SelectTrigger className={validationErrors.role ? "border-red-500" : ""}>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="z-[51]">
                {roleOptions.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.role && (
              <p className="text-sm text-red-500 mt-1">{validationErrors.role}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Party
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
