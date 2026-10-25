"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Users,
  Settings,
} from "lucide-react";
import { Party, Deal, Profile } from "@/components/files/types/realtor";
import { getAllTemplateNames } from "@/app/actions/realtor/template-actions";
import Fuse from "fuse.js";
import {
  getAllParties,
  updatePartyApiCall,
} from "@/app/actions/realtor/client-actions";
import { debounce } from "lodash";
import { getAllPartyIntakeTemplateNamesByDealSide } from "@/app/actions/realtor/client-intake-template-actions";
import { updateDeal, getDealClients } from "@/app/actions/realtor/deal-actions";
import {
  createDealPartyRow,
  removeDealParty,
} from "@/app/actions/realtor/dealClient-actions";
import { getProfile } from "@/app/actions/realtor/profile-actions";
import { toast } from "sonner";
import DealSettingsSectionSkeleton from "@/components/loading-skeletons/DealSettingsSectionSkeleton";

interface DealSettingsSectionProps {
  dealId: string;
  dealData: Deal;
}

export default function DealSettingsSection({
  dealId,
  dealData: deal,
}: DealSettingsSectionProps) {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const router = useRouter();

  const [allFormTemplates, setAllFormTemplates] = useState<string[]>([]);
  const [allClientTemplates, setAllClientTemplates] = useState<string[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const [useFormTemplate, setUseFormTemplate] = useState(true);
  const [useClientTemplate, setUseClientTemplate] = useState(true);
  const [propertyType, setPropertyType] = useState("");
  const [templateType, setTemplateType] = useState("default");
  const [clientTempType, setClientTempType] = useState("default");

  const [dealName, setDealName] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const fuseRef = useRef<Fuse<Party> | null>(null);
  const [suggestionFor, setSuggestionFor] = useState<number | null>(null);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [clientSearchResults, setClientSearchResults] = useState<Party[]>([]);
  const [activeField, setActiveField] = useState<"name" | "email" | null>(null);
  const searchRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [, startTransition] = useTransition();

  const [realtorProfile, setRealtorProfile] = useState<Profile | null>(null);
  const [validationError, setValidationError] = useState<string>("");

  const [clients, setClients] = useState<
    {
      party: { id?: string; full_name: string; email: string };
      role:
        | "seller"
        | "buyer"
        | "landlord"
        | "tenant"
        | "seller_agent"
        | "buyer_agent"
        | "tenant_agent"
        | "landlord_agent";
      partyNumber: number;
      isExisting: boolean;
      isEditing?: boolean;
    }[]
  >([]);

  const getDefaultClientRole = (ds: string) =>
    ds === "sell"
      ? "seller"
      : ds === "buy"
      ? "buyer"
      : ds === "lease"
      ? "landlord"
      : "tenant";

  const roleOptions: string[] = (() => {
    switch (deal.dealSide) {
      case "sell":
        return ["seller", "buyer", "buyer_agent"];
      case "buy":
        return ["buyer"];
      case "lease":
        return ["landlord", "tenant", "tenant_agent"];
      case "rent":
        return ["tenant"];
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
        setShowClientSuggestions(false);
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
          setClientSearchResults(results);
          setShowClientSuggestions(true);
        } else {
          setClientSearchResults([]);
          setShowClientSuggestions(false);
        }
      });
    }, 200),
    []
  );

  useEffect(() => {
    performSearch(searchTerm);
  }, [searchTerm, performSearch]);

  const handleClientSelect = (client: Party, index: number) => {
    updateClientAdding(index, "full_name", client.full_name);
    updateClientAdding(index, "email", client.email);
    setClients((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, party: { ...c.party, id: client.id } } : c
      )
    );
    setShowClientSuggestions(false);
    setSuggestionFor(null);
    setActiveField(null);
    setSearchTerm("");
  };

  const calculateClientNumbers = (cs: typeof clients) => {
    const roleCounts: Record<string, number> = {};
    return cs.map((c) => {
      roleCounts[c.role] = (roleCounts[c.role] || 0) + 1;
      return { ...c, partyNumber: roleCounts[c.role] };
    });
  };

  const updateClientAdding = (
    index: number,
    field: "role" | "full_name" | "email",
    value: string
  ) => {
    setClients((prev) => {
      const next = prev.map((c, i) =>
        i !== index
          ? c
          : field === "role"
          ? {
              ...c,
              role: value as
                | "seller"
                | "buyer"
                | "landlord"
                | "tenant"
                | "seller_agent"
                | "buyer_agent"
                | "tenant_agent"
                | "landlord_agent",
            }
          : { ...c, party: { ...c.party, [field]: value } }
      );
      return calculateClientNumbers(next);
    });
  };

  const addClient = () =>
    setClients((prev) =>
      calculateClientNumbers([
        ...prev,
        {
          party: { full_name: "", email: "" },
          role: getDefaultClientRole(deal.dealSide) as
            | "seller"
            | "buyer"
            | "landlord"
            | "tenant"
            | "seller_agent"
            | "buyer_agent"
            | "tenant_agent"
            | "landlord_agent",
          partyNumber: 0,
          isExisting: false,
        },
      ])
    );

  const removeClient = async (idx: number) => {
    const client = clients[idx];
    if (client.isExisting && client.party.id) {
      try {
        setLoading(true);
        await removeDealParty(dealId, client.party.id);
        toast.success("Client removed from deal");
      } catch (error) {
        console.error("Error removing client from deal:", error);
        toast.error("Failed to remove client from deal");
        return;
      } finally {
        setLoading(false);
      }
    }
    setClients((prev) =>
      calculateClientNumbers(prev.filter((_, i) => i !== idx))
    );
  };

  const toggleEditClient = (idx: number) => {
    setClients((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, isEditing: !c.isEditing } : c))
    );
  };

  const saveClientChanges = async (idx: number) => {
    const client = clients[idx];
    if (client.isExisting && client.party.id) {
      try {
        setLoading(true);
        await updatePartyApiCall(
          {
            id: client.party.id!,
            full_name: client.party.full_name,
            email: client.party.email,
            current_transaction_status: "searching",
            phone_number: "", // Default empty
            form_information: null as any, // Default empty
            notes: "", // Default empty
            realtor_id: "", // Default empty
            created_at: new Date(), // Default current date
          },
          client.party.id
        );
        toast.success("Client updated successfully");
        toggleEditClient(idx);
      } catch (error) {
        console.error("Error updating client:", error);
        toast.error("Failed to update client");
      } finally {
        setLoading(false);
      }
    } else {
      toggleEditClient(idx);
    }
  };

  const loadDealData = useCallback(async () => {
    setInitialLoading(true);
    try {
      setDealName(deal.dealName);

      // Fetch realtor profile
      const profile = await getProfile("realtor");
      setRealtorProfile(profile);

      const templateParts = deal.template.split("-");
      if (templateParts.length >= 3) {
        setPropertyType(templateParts[1]);
        setTemplateType(templateParts[2]);
        setUseFormTemplate(templateParts[2] !== "blank");
      }

      const clientTemplateParts = deal.partyIntakeTemplate.split("-");
      if (clientTemplateParts.length >= 3) {
        setClientTempType(clientTemplateParts[2]);
        setUseClientTemplate(clientTemplateParts[2] !== "blank");
      }

      const dealClients = await getDealClients(deal.id);
      const allParties = await getAllParties();
      const partiesMap = new Map(allParties.map((p) => [p.id, p]));

      const clientParties = (dealClients || [])
        .filter((dc) => dc?.party_role && dc.realtorIsRepresenting)
        .map((dc) => {
          const party = partiesMap.get(dc.party_id) as Party | undefined;
          return {
            role: dc.party_role as
              | "seller"
              | "buyer"
              | "landlord"
              | "tenant"
              | "seller_agent"
              | "buyer_agent"
              | "tenant_agent"
              | "landlord_agent",
            partyNumber: dc.partyNumber || 1,
            party: {
              id: dc.party_id,
              full_name: party?.full_name || dc.party_email || "",
              email: party?.email || dc.party_email || "",
            },
            isExisting: true,
            isEditing: false,
          };
        });

      setClients(calculateClientNumbers(clientParties));

      fuseRef.current = new Fuse(allParties, {
        keys: ["full_name", "email"],
        threshold: 0.3,
      });
    } catch (error) {
      console.error("Error loading deal data:", error);
      toast.error("Failed to load deal data");
    } finally {
      setInitialLoading(false);
    }
  }, [deal.dealName, deal.template, deal.partyIntakeTemplate, deal.id]);

  useEffect(() => {
    loadDealData();
  }, [loadDealData]);

  useEffect(() => {
    setLoadingTemplates(true);
    getAllTemplateNames()
      .then(setAllFormTemplates)
      .catch(console.error)
      .finally(() => {
        getAllPartyIntakeTemplateNamesByDealSide(deal.dealSide)
          .then(setAllClientTemplates)
          .catch(console.error)
          .finally(() => setLoadingTemplates(false));
      });
  }, [deal.dealSide]);

  const handlePropertyTypeChange = (value: string) => {
    setPropertyType(value);
  };

  const suffixesForFormTemplates = (prop: string) =>
    allFormTemplates
      .filter((t) => t.startsWith(`${deal.dealSide}-${prop}-`))
      .map((t) => t.split("-")[2])
      .filter((v, i, a) => a.indexOf(v) === i);

  const formSuffixes = suffixesForFormTemplates(propertyType);

  const suffixesForClientTemplates = (prop: string) =>
    allClientTemplates
      .filter((t) => t.startsWith(`${deal.dealSide}-${prop}-`))
      .map((t) => t.split("-")[2])
      .filter((v, i, a) => a.indexOf(v) === i);

  const clientSuffixes = suffixesForClientTemplates(propertyType);

  useEffect(() => {
    setTemplateType((prev) =>
      useFormTemplate && !formSuffixes.includes(prev) ? "" : prev
    );
  }, [formSuffixes, useFormTemplate]);

  useEffect(() => {
    setClientTempType((prev) =>
      useClientTemplate && !clientSuffixes.includes(prev) ? "" : prev
    );
  }, [clientSuffixes, useClientTemplate]);

  // Email validation - check for duplicates and conflicts with realtor
  const emailValidation = () => {
    // Check if any client has the same email as realtor
    if (realtorProfile) {
      const realtorEmail = realtorProfile.email.toLowerCase();
      const clientEmails = clients
        .map((c) => c.party.email.trim().toLowerCase())
        .filter((email) => email);

      if (clientEmails.includes(realtorEmail)) {
        return {
          valid: false,
          message: "No clients can have the same email as the realtor",
        };
      }
    }

    const emails = clients
      .map((c) => c.party.email.trim().toLowerCase())
      .filter((email) => email);
    const uniqueEmails = new Set(emails);

    // Check for duplicate emails
    if (emails.length !== uniqueEmails.size) {
      return { valid: false, message: "Duplicate email addresses found" };
    }

    return { valid: true, message: "" };
  };

  const emailCheck = emailValidation();

  const allClientsValid = clients.every(
    (c) => c.party.full_name.trim() && c.party.email.trim() && c.role.trim()
  );

  const valid = dealName.trim() && allClientsValid && emailCheck.valid;

  const saveDealSettings = async () => {
    setLoading(true);
    try {
      // Only update deal name (templates are read-only after deal creation)
      await updateDeal(deal.id, {
        dealName,
      });

      const newClients = clients.filter((c) => !c.isExisting);
      if (newClients.length > 0) {
        await createDealPartyRow(
          deal.id,
          newClients.map((c) => ({
            role: c.role,
            realtorIsRepresenting: true,
            party: {
              ...c.party,
              current_transaction_status: "searching",
            },
            partyNumber: c.partyNumber,
          }))
        );
      }

      // Reload deal data to refresh client list and mark new clients as existing
      await loadDealData();

      toast.success("Deal settings updated successfully");
      router.refresh();
    } catch (error) {
      console.error("Error updating deal:", error);
      toast.error("Failed to update deal settings");
    } finally {
      setLoading(false);
    }
  };

  // Update validation error when email validation changes
  useEffect(() => {
    if (!emailCheck.valid) {
      setValidationError(emailCheck.message);
    } else {
      setValidationError("");
    }
  }, [emailCheck.valid, emailCheck.message]);

  if (initialLoading) {
    return <DealSettingsSectionSkeleton />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-gray-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Deal Settings
              </h1>
              <p className="text-sm text-gray-500">
                Manage deal information and clients
              </p>
            </div>
          </div>
          <Button
            disabled={!valid || loading}
            onClick={saveDealSettings}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} /> Saving…
              </>
            ) : (
              <>
                <Save className="mr-2" size={16} />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {/* Validation Error Message */}
        {validationError && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{validationError}</p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Deal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Deal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dealName">Deal Name</Label>
                <Input
                  id="dealName"
                  placeholder="Unique deal name"
                  value={dealName}
                  onChange={(e) => setDealName(e.target.value)}
                />
              </div>
              <div>
                <Label>Deal Side</Label>
                <div className="flex h-10 w-full rounded-md border bg-gray-100 px-3 py-2 text-sm items-center capitalize">
                  {deal.dealSide}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deal Clients */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <CardTitle>Deal Parties</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addClient}
                className="flex items-center gap-1"
              >
                <Plus size={14} /> Add Deal Parties
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No parties added to this deal yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {clients.map((party, idx) => (
                  <Card key={idx} className="relative border-gray-200">
                    <CardContent className="p-4">
                      {/* Client Actions */}
                      <div className="absolute top-2 right-2 flex gap-1">
                        {party.isExisting && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              party.isEditing
                                ? saveClientChanges(idx)
                                : toggleEditClient(idx)
                            }
                            className="h-6 w-6 p-0"
                          >
                            {party.isEditing ? (
                              <Save size={12} />
                            ) : (
                              <Edit size={12} />
                            )}
                          </Button>
                        )}
                        {party.isExisting && party.isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleEditClient(idx)}
                            className="h-6 w-6 p-0"
                          >
                            <X size={12} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeClient(idx)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>

                      {/* Client Header */}
                      <div className="mb-3">
                        <h5 className="text-sm font-semibold capitalize">
                          {party.role.replace("_", " ")} {party.partyNumber}
                          {party.isExisting && (
                            <span className="text-xs text-green-600 ml-2">
                              (Existing)
                            </span>
                          )}
                        </h5>
                      </div>

                      {/* Role Select */}
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">Role</Label>
                          <Select
                            value={party.role}
                            onValueChange={(v) =>
                              updateClientAdding(idx, "role", v)
                            }
                            disabled={party.isExisting && !party.isEditing}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              {roleOptions.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt.replace("_", " ")}
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
                              if (activeField === "name")
                                searchRefs.current[idx] = el;
                            }}
                          >
                            <Input
                              placeholder="John Doe"
                              value={party.party.full_name}
                              onChange={(e) => {
                                updateClientAdding(
                                  idx,
                                  "full_name",
                                  e.target.value
                                );
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
                                    setShowClientSuggestions(true);
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
                              showClientSuggestions &&
                              clientSearchResults.length > 0 && (
                                <div className="absolute left-0 right-0 top-full z-50 mt-1 bg-background border rounded-md shadow-sm max-h-48 overflow-y-auto">
                                  {clientSearchResults.map((result, rIdx) => (
                                    <div
                                      key={rIdx}
                                      className="px-3 py-1.5 hover:bg-accent/50 cursor-pointer text-sm"
                                      onClick={() =>
                                        handleClientSelect(result, idx)
                                      }
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
                              if (activeField === "email")
                                searchRefs.current[idx] = el;
                            }}
                          >
                            <Input
                              placeholder="client@example.com"
                              value={party.party.email}
                              onChange={(e) => {
                                updateClientAdding(
                                  idx,
                                  "email",
                                  e.target.value
                                );
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
                                  if (party.party.email)
                                    setShowClientSuggestions(true);
                                }
                              }}
                              disabled={party.isExisting && !party.isEditing}
                              autoComplete="off"
                              autoCorrect="off"
                              className={`${
                                party.party.email.trim() &&
                                (realtorProfile?.email.toLowerCase() ===
                                  party.party.email.trim().toLowerCase() ||
                                  clients.some(
                                    (c, cIdx) =>
                                      cIdx !== idx &&
                                      c.party.email.trim().toLowerCase() ===
                                        party.party.email.trim().toLowerCase()
                                  ))
                                  ? "border-red-500 focus:border-red-500"
                                  : ""
                              }`}
                            />

                            {/* Individual Email Validation Error */}
                            {party.party.email.trim() &&
                              realtorProfile?.email.toLowerCase() ===
                                party.party.email.trim().toLowerCase() && (
                                <div className="absolute left-0 right-0 top-full z-50 mt-1 bg-red-50 border border-red-200 rounded-md p-2">
                                  <p className="text-xs text-red-600">
                                    Cannot use the same email as the realtor
                                  </p>
                                </div>
                              )}

                            {party.party.email.trim() &&
                              clients.some(
                                (c, cIdx) =>
                                  cIdx !== idx &&
                                  c.party.email.trim().toLowerCase() ===
                                    party.party.email.trim().toLowerCase()
                              ) && (
                                <div className="absolute left-0 right-0 top-full z-50 mt-1 bg-red-50 border border-red-200 rounded-md p-2">
                                  <p className="text-xs text-red-600">
                                    Duplicate email address
                                  </p>
                                </div>
                              )}

                            {/* Email Search Suggestions */}
                            {!party.isExisting &&
                              activeField === "email" &&
                              suggestionFor === idx &&
                              showClientSuggestions &&
                              clientSearchResults.length > 0 && (
                                <div className="absolute left-0 right-0 top-full z-50 mt-1 bg-background border rounded-md shadow-sm max-h-48 overflow-y-auto">
                                  {clientSearchResults.map((result, rIdx) => (
                                    <div
                                      key={rIdx}
                                      className="px-3 py-1.5 hover:bg-accent/50 cursor-pointer text-sm"
                                      onClick={() =>
                                        handleClientSelect(result, idx)
                                      }
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
          </CardContent>
        </Card>

        {/* Templates */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Templates</CardTitle>
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Read-only: Templates cannot be changed after deal creation
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <TemplateBlock
              title="Form Template"
              dealSide={deal.dealSide}
              propertyType={propertyType}
              onPropertyTypeChange={handlePropertyTypeChange}
              templateType={useFormTemplate ? templateType : "blank"}
              onTemplateTypeChange={setTemplateType}
              suffixes={formSuffixes}
              loading={loadingTemplates}
              useTemplate={useFormTemplate}
              onToggleUse={setUseFormTemplate}
              disabled={true}
            />

            <TemplateBlock
              title="Client Template"
              dealSide={deal.dealSide}
              propertyType={propertyType}
              onPropertyTypeChange={handlePropertyTypeChange}
              templateType={useClientTemplate ? clientTempType : "blank"}
              onTemplateTypeChange={setClientTempType}
              suffixes={clientSuffixes}
              loading={loadingTemplates}
              useTemplate={useClientTemplate}
              onToggleUse={setUseClientTemplate}
              disabled={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface BlockProps {
  title: string;
  dealSide: string;
  propertyType: string;
  onPropertyTypeChange: (v: string) => void;
  templateType: string;
  onTemplateTypeChange: (v: string) => void;
  suffixes: string[];
  loading: boolean;
  useTemplate: boolean;
  onToggleUse: (v: boolean) => void;
  disabled?: boolean;
}

function TemplateBlock({
  title,
  dealSide,
  propertyType,
  onPropertyTypeChange,
  templateType,
  onTemplateTypeChange,
  suffixes,
  loading,
  useTemplate,
  onToggleUse,
  disabled = false,
}: BlockProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4
          className={`text-sm font-semibold ${
            disabled ? "text-gray-400" : "text-gray-700"
          }`}
        >
          {title}
        </h4>
        <div className="flex items-center gap-2">
          <Label
            htmlFor={`${title}-switch`}
            className={`text-sm ${disabled ? "text-gray-400" : ""}`}
          >
            Use template?
          </Label>
          <Switch
            id={`${title}-switch`}
            checked={useTemplate}
            onCheckedChange={onToggleUse}
            disabled={disabled}
          />
        </div>
      </div>

      <div
        className={`grid grid-cols-3 gap-4 w-full ${
          disabled ? "opacity-60" : ""
        }`}
      >
        <div
          className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm items-center justify-center capitalize ${
            disabled ? "bg-gray-50 text-gray-400" : "bg-gray-100"
          }`}
        >
          {dealSide}
        </div>

        <Select
          value={propertyType}
          onValueChange={onPropertyTypeChange}
          disabled={disabled}
        >
          <SelectTrigger className="flex items-center justify-center w-full">
            <SelectValue placeholder="Property Type" />
          </SelectTrigger>
          <SelectContent>
            {[
              "residential",
              "commercial",
              "improved_land",
              "unimproved_land",
            ].map((p) => (
              <SelectItem key={p} value={p}>
                {p
                  .replace(/_/g, " ")
                  .split(" ")
                  .map((w) => w[0].toUpperCase() + w.slice(1))
                  .join(" ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={useTemplate ? templateType : "blank"}
          onValueChange={onTemplateTypeChange}
          disabled={disabled || !useTemplate || !propertyType || loading}
        >
          <SelectTrigger
            className={`w-full ${!useTemplate || disabled ? "opacity-50" : ""}`}
          >
            <SelectValue
              placeholder={useTemplate ? "Template Type" : "Default"}
            />
          </SelectTrigger>
          <SelectContent>
            {!useTemplate ? (
              <SelectItem value="blank">Default</SelectItem>
            ) : loading ? (
              <div className="text-center text-sm text-muted-foreground p-2">
                Loading…
              </div>
            ) : !suffixes.length ? (
              <div className="text-center text-sm text-muted-foreground p-2">
                No template types available
              </div>
            ) : (
              suffixes.map((s) => (
                <SelectItem key={s} value={s}>
                  {s[0].toUpperCase() + s.slice(1).replace(/_/g, " ")}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {propertyType && (
        <p className="text-xs text-gray-500 text-center">
          {`${dealSide}-${propertyType}-${
            useTemplate ? templateType : "default"
          }`}
        </p>
      )}
    </div>
  );
}
