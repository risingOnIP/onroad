"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useTransition,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Edit, Save, X, Users } from "lucide-react";
import { Party } from "@/components/files/types/realtor";
import Fuse from "fuse.js";
import { getAllParties, updatePartyApiCall } from "@/app/actions/realtor/client-actions";
import { debounce } from "lodash";
import { createDealOptionPartyRow, getDealOptionPartiesWithFullInformation, removeDealOptionParty } from "@/app/actions/realtor/dealClient-actions";
import { toast } from "sonner";

interface AddPartySectionProps {
  dealOptionId: string;
  dealSide: string;
  dealOptionAddress: string;
}

interface LocalDealParty {
  role: "seller" | "buyer" | "landlord" | "tenant" | "seller_agent" | "buyer_agent" | "tenant_agent" | "landlord_agent";
  partyNumber: number;
  party: {
    id?: string;
    full_name: string;
    email: string;
  };
  isExisting?: boolean;
  isEditing?: boolean;
}



export default function AddPartySection({
  dealOptionId,
  dealSide,
  dealOptionAddress,
}: AddPartySectionProps) {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const fuseRef = useRef<Fuse<Party> | null>(null);
  const [suggestionFor, setSuggestionFor] = useState<number | null>(null);
  const [showPartySearch, setShowPartySearch] = useState(false);
  const [partySearchResults, setPartySearchResults] = useState<Party[]>([]);
  const [activeField, setActiveField] = useState<"name" | "email" | null>(null);
  const searchRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [, startTransition] = useTransition();

  const [parties, setParties] = useState<LocalDealParty[]>([]);

  const getDefaultPartyRole = (ds: string) =>
    ds === "buy" ? "seller" : "landlord";

  const roleOptions: string[] = (() => {
    switch (dealSide) {
      case "buy":
        return ["seller", "seller_agent"];
      case "rent":
        return ["landlord", "landlord_agent"];
      default:
        return [];
    }
  })();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const clickedInsideSomeCard = searchRefs.current.some(
        (ref) => ref && ref.contains(e.target as Node)
      );
      if (!clickedInsideSomeCard) {
        setShowPartySearch(false);
        setSuggestionFor(null);
        setActiveField(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const performSearch = useCallback(
    debounce((value: string) => {
      startTransition(() => {
        if (fuseRef.current && value.trim()) {
          const results = fuseRef.current.search(value).map((r) => r.item);
          setPartySearchResults(results);
          setShowPartySearch(true);
        } else {
          setPartySearchResults([]);
          setShowPartySearch(false);
        }
      });
    }, 200),
    [startTransition]
  );

  useEffect(() => {
    performSearch(searchTerm);
  }, [searchTerm, performSearch]);

  const handlePartySelect = (party: Party, index: number) => {
    updateParty(index, "full_name", party.full_name);
    updateParty(index, "email", party.email);
    setParties(prev => prev.map((p, i) => 
      i === index ? { ...p, party: { ...p.party, id: party.id } } : p
    ));
    setShowPartySearch(false);
    setSuggestionFor(null);
    setActiveField(null);
    setSearchTerm("");
  };

  const calculatePartyNumbers = (ps: LocalDealParty[]) => {
    const roleCounts: Record<string, number> = {};
    return ps.map((p) => {
      roleCounts[p.role] = (roleCounts[p.role] || 0) + 1;
      return { ...p, partyNumber: roleCounts[p.role] };
    });
  };

  const updateParty = (
    index: number,
    field: "role" | "full_name" | "email",
    value: string
  ) => {
    setParties((prev) => {
      const next = prev.map((p, i) =>
        i !== index
          ? p
          : field === "role"
          ? { ...p, role: value as LocalDealParty["role"] }
          : { ...p, party: { ...p.party, [field]: value } }
      );
      return calculatePartyNumbers(next);
    });
  };

  const addParty = () =>
    setParties((prev) =>
      calculatePartyNumbers([
        ...prev,
        {
          party: { full_name: "", email: "" },
          role: getDefaultPartyRole(dealSide) as LocalDealParty["role"],
          partyNumber: 0,
          isExisting: false,
        },
      ])
    );

  const removeParty = async (idx: number) => {
    const party = parties[idx];
    if (party.isExisting && party.party.id) {
      try {
        setLoading(true);
        await removeDealOptionParty(dealOptionId, party.party.id);
        toast.success("Party removed from deal option");
      } catch (error) {
        console.error("Error removing party from deal option:", error);
        toast.error("Failed to remove party from deal option");
        return;
      } finally {
        setLoading(false);
      }
    }
    setParties((prev) =>
      calculatePartyNumbers(prev.filter((_, i) => i !== idx))
    );
  };

  const toggleEditParty = (idx: number) => {
    setParties(prev => prev.map((p, i) => 
      i === idx ? { ...p, isEditing: !p.isEditing } : p
    ));
  };

  const savePartyChanges = async (idx: number) => {
    const party = parties[idx];
    if (party.isExisting && party.party.id) {
      try {
        setLoading(true);
        await updatePartyApiCall({
          id: party.party.id!,
          full_name: party.party.full_name,
          email: party.party.email,
        }, party.party.id);
        toast.success("Party updated successfully");
        toggleEditParty(idx);
      } catch (error) {
        console.error("Error updating party:", error);
        toast.error("Failed to update party");
      } finally {
        setLoading(false);
      }
    } else {
      toggleEditParty(idx);
    }
  };

  const loadDealOptionParties = useCallback(async () => {
    if (!dealOptionId) return;
    
    setInitialLoading(true);
    try {
      const dealOptionParties = await getDealOptionPartiesWithFullInformation(dealOptionId);
      
      const partyList = (dealOptionParties || [])
        .map((dp: {party: Party, role: string, partyNumber: number}) => ({
          role: dp.role as LocalDealParty["role"],
          partyNumber: dp.partyNumber || 1,
          party: {
            id: dp.party.id,
            full_name: dp.party.full_name || '',
            email: dp.party.email || '',
          },
          isExisting: true,
          isEditing: false,
        }));

      setParties(calculatePartyNumbers(partyList));

      // Initialize party search
      const allParties = await getAllParties();
      fuseRef.current = new Fuse(allParties, {
        keys: ["full_name", "email"],
        threshold: 0.3,
      });

    } catch (error) {
      console.error("Error loading deal option parties:", error);
      toast.error("Failed to load deal option parties");
    } finally {
      setInitialLoading(false);
    }
  }, [dealOptionId]);

  useEffect(() => {
    loadDealOptionParties();
  }, [loadDealOptionParties]);

  const allPartiesValid = parties.every(
    (p) => p.party.full_name.trim() && p.party.email.trim() && p.role.trim()
  );

  const saveParties = async () => {
    setLoading(true);
    try {
      const newParties = parties.filter(p => !p.isExisting);
      if (newParties.length > 0) {
        await createDealOptionPartyRow(
          dealOptionId,
          newParties.map(p => ({
            role: p.role,
            realtorIsRepresenting: false,
            party: {
              full_name: p.party.full_name,
              email: p.party.email,
              phone_number: "",
              current_transaction_status: "searching",
              form_information: {},
              notes: "",
            },
            partyNumber: p.partyNumber,
          }))
        );
      }

      toast.success("Deal option parties updated successfully");
      await loadDealOptionParties();
    } catch (error) {
      console.error("Error updating deal option parties:", error);
      toast.error("Failed to update deal option parties");
    } finally {
      setLoading(false);
    }
  };

  // Only show for buy and rent deals
  if (dealSide !== "buy" && dealSide !== "rent") {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-600" />
          Manage Parties for {dealOptionAddress}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {initialLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4" />
              <p className="text-gray-600">Loading parties...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Deal Option Parties</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={addParty}
                className="flex items-center gap-1"
              >
                <Plus size={14} /> Add Party
              </Button>
            </div>

            {parties.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No parties added to this deal option yet.
              </div>
            ) : (
              <div className="space-y-3">
                {parties.map((party, idx) => (
                  <Card key={idx} className="relative border-gray-200">
                    <CardContent className="p-4">
                      {/* Party Actions */}
                      <div className="absolute top-2 right-2 flex gap-1">
                        {party.isExisting && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => party.isEditing ? savePartyChanges(idx) : toggleEditParty(idx)}
                            className="h-6 w-6 p-0"
                          >
                            {party.isEditing ? <Save size={12} /> : <Edit size={12} />}
                          </Button>
                        )}
                        {party.isExisting && party.isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleEditParty(idx)}
                            className="h-6 w-6 p-0"
                          >
                            <X size={12} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeParty(idx)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>

                      {/* Party Header */}
                      <div className="mb-3">
                        <h5 className="text-sm font-semibold capitalize">
                          {party.role.replace('_', ' ')} {party.partyNumber}
                          {party.isExisting && (
                            <span className="text-xs text-green-600 ml-2">(Existing)</span>
                          )}
                        </h5>
                      </div>

                      {/* Role Select */}
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">Role</Label>
                          <Select
                            value={party.role}
                            onValueChange={(v) => updateParty(idx, "role", v)}
                            disabled={party.isExisting && !party.isEditing}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              {roleOptions.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt.replace('_', ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Name Input */}
                        <div>
                          <Label className="text-xs">Name</Label>
                          <div
                            className="relative"
                            ref={(el) => {
                              if (activeField === "name") searchRefs.current[idx] = el;
                            }}
                          >
                            <Input
                              placeholder="John Doe"
                              value={party.party.full_name}
                              onChange={(e) => {
                                updateParty(idx, "full_name", e.target.value);
                                if (!party.isExisting) {
                                  setSuggestionFor(idx);
                                  setActiveField("name");
                                  setSearchTerm(e.target.value);
                                }
                              }}
                              onFocus={(e) => {
                                if (!party.isExisting) {
                                  searchRefs.current[idx] = e.currentTarget
                                    .parentElement as HTMLDivElement;
                                  setSuggestionFor(idx);
                                  setActiveField("name");
                                  if (party.party.full_name) {
                                    setShowPartySearch(true);
                                  }
                                }
                              }}
                              disabled={party.isExisting && !party.isEditing}
                              autoComplete="off"
                              autoCorrect="off"
                            />

                            {/* Search Suggestions */}
                            {!party.isExisting &&
                              activeField === "name" &&
                              suggestionFor === idx &&
                              showPartySearch &&
                              partySearchResults.length > 0 && (
                                <div className="absolute left-0 right-0 top-full z-50 mt-1 bg-background border rounded-md shadow-sm max-h-48 overflow-y-auto">
                                  {partySearchResults.map((result, rIdx) => (
                                    <div
                                      key={rIdx}
                                      className="px-3 py-1.5 hover:bg-accent/50 cursor-pointer text-sm"
                                      onClick={() => handlePartySelect(result, idx)}
                                    >
                                      <div className="text-foreground">
                                        {result.full_name}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {result.email}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        </div>

                        {/* Email Input */}
                        <div>
                          <Label className="text-xs">Email</Label>
                          <div
                            className="relative"
                            ref={(el) => {
                              if (activeField === "email") searchRefs.current[idx] = el;
                            }}
                          >
                            <Input
                              placeholder="party@example.com"
                              value={party.party.email}
                              onChange={(e) => {
                                updateParty(idx, "email", e.target.value);
                                if (!party.isExisting) {
                                  setSuggestionFor(idx);
                                  setActiveField("email");
                                  setSearchTerm(e.target.value);
                                }
                              }}
                              onFocus={(e) => {
                                if (!party.isExisting) {
                                  searchRefs.current[idx] = e.currentTarget
                                    .parentElement as HTMLDivElement;
                                  setSuggestionFor(idx);
                                  setActiveField("email");
                                  if (party.party.email) setShowPartySearch(true);
                                }
                              }}
                              disabled={party.isExisting && !party.isEditing}
                              autoComplete="off"
                              autoCorrect="off"
                            />

                            {/* Email Search Suggestions */}
                            {!party.isExisting &&
                              activeField === "email" &&
                              suggestionFor === idx &&
                              showPartySearch &&
                              partySearchResults.length > 0 && (
                                <div className="absolute left-0 right-0 top-full z-50 mt-1 bg-background border rounded-md shadow-sm max-h-48 overflow-y-auto">
                                  {partySearchResults.map((result, rIdx) => (
                                    <div
                                      key={rIdx}
                                      className="px-3 py-1.5 hover:bg-accent/50 cursor-pointer text-sm"
                                      onClick={() => handlePartySelect(result, idx)}
                                    >
                                      <div className="text-foreground">
                                        {result.full_name}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {result.email}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Save Button */}
            {parties.filter(p => !p.isExisting).length > 0 && (
              <div className="flex justify-end pt-4">
                <Button
                  disabled={!allPartiesValid || loading}
                  onClick={saveParties}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={16} /> Saving…
                    </>
                  ) : (
                    <>
                      <Save className="mr-2" size={16} />
                      Save Parties
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}