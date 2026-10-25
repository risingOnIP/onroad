"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeftRight, Loader2, Plus, Trash2 } from "lucide-react";
import { Party, Deal } from "@/components/files/types/realtor";
import { getAllTemplateNames } from "@/app/actions/realtor/template-actions";
import Fuse from "fuse.js";
import { getAllParties } from "@/app/actions/realtor/client-actions";
import { debounce } from "lodash";
import { getAllPartyIntakeTemplateNamesByDealSide } from "@/app/actions/realtor/client-intake-template-actions";
import { getProfile } from "@/app/actions/realtor/profile-actions";
import { Profile } from "@/components/files/types/realtor";

/* ---------- props / helpers ---------- */

interface ColorStyles {
  bg: string;
  text: string;
  action: string;
  hover: string;
  hoverBg: string;
}

interface AddDealProps {
  label: string;
  dealSide: "sell" | "buy" | "lease" | "rent";
  colorStyles: ColorStyles;
  onDealAdded: (payload: {
    deal: Omit<
      Deal,
      "id" | "user_id" | "created_at" | "isActive" | "client_form" | "dealSide"
    >;
    parties: {
      partyRole:
        | "seller"
        | "buyer"
        | "landlord"
        | "tenant"
        | "seller_agent"
        | "buyer_agent"
        | "tenant_agent"
        | "landlord_agent";
      realtorIsRepresenting: boolean;
      party: Omit<
        Party,
        | "id"
        | "created_at"
        | "current_transaction_status"
        | "form_information"
        | "notes"
        | "phone_number"
        | "realtor_id"
      >;
      partyNumber: number;
    }[];
  }) => Promise<void>;
}

/* ===================================== */
/*              COMPONENT                */
/* ===================================== */

export default function AddDealDialog({
  label,
  dealSide,
  colorStyles,
  onDealAdded,
}: AddDealProps) {
  /* ---------- dialog / loading ---------- */

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ---------- router ---------- */

  const router = useRouter();

  /* ---------- templates ---------- */

  const [allFormTemplates, setAllFormTemplates] = useState<string[]>([]);
  const [allClientTemplates, setAllClientTemplates] = useState<string[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const [useFormTemplate, setUseFormTemplate] = useState(false);
  const [useClientTemplate, setUseClientTemplate] = useState(false);
  const [propertyType, setPropertyType] = useState("residential");
  const [templateType, setTemplateType] = useState("default");
  const [clientTempType, setClientTempType] = useState("default");
  /* ---------- Ora AI toggle ---------- */
  // When true, Ora AI will automatically manage forms & client intake. When false, user can pick templates manually.
  const [useOraAI, setUseOraAI] = useState(true);

  /* ---------- realtor profile ---------- */

  const [realtorProfile, setRealtorProfile] = useState<Profile | null>(null);

  // Synced property type handlers
  const handlePropertyTypeChange = (value: string) => {
    setPropertyType(value);
  };

  const [dealName, setDealName] = useState("");
  const [dealTemplate, setDealTemplate] = useState("blank");
  const [clientTemplate, setClientTemplate] = useState("blank");

  /* ---------- mapbox address autocomplete ---------- */
  const [addressSuggestions, setAddressSuggestions] = useState<
    { place_name: string; full_address?: string; feature_name?: string }[]
  >([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const addressDropdownRef = useRef<HTMLDivElement>(null);

  const MAPBOX_ACCESS_TOKEN =
    "pk.eyJ1IjoibWNwMWx0IiwiYSI6ImNtY3Bydmt3OTA0N24yam9vZ2t5bTc5bzMifQ.wBMO_nsbyJy3ZA9IVXPulQ";

  /* ---------- address search function ---------- */
  const searchAddresses = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    setIsAddressLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${MAPBOX_ACCESS_TOKEN}&types=address&limit=5&country=US`
      );

      if (response.ok) {
        const data = await response.json();
        const suggestions = data.features.map((feature: any) => ({
          place_name: feature.place_name,
          full_address: feature.properties?.full_address || feature.place_name,
          feature_name: feature.properties?.feature_name,
        }));

        setAddressSuggestions(suggestions);
        setShowAddressSuggestions(true);
      }
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
    } finally {
      setIsAddressLoading(false);
    }
  };

  const handleAddressSelect = (suggestion: {
    place_name: string;
    full_address?: string;
  }) => {
    setDealName(suggestion.full_address || suggestion.place_name);
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);
  };

  /* ---------- client fuzzy-search ---------- */

  const [searchTerm, setSearchTerm] = useState("");
  const fuseRef = useRef<Fuse<Party> | null>(null);

  // index of the client card currently showing suggestions, or null
  const [suggestionFor, setSuggestionFor] = useState<number | null>(null);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [clientSearchResults, setClientSearchResults] = useState<Party[]>([]);

  // which field triggered suggestions ('name' | 'email')
  const [activeField, setActiveField] = useState<"name" | "email" | null>(null);

  // explicit type for refs array
  const searchRefs = useRef<Array<HTMLDivElement | null>>([]);

  const [, startTransition] = useTransition();

  /* ---------- click-outside to close suggestions ---------- */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      // Check for client suggestions
      const clickedInsideSomeCard = searchRefs.current.some(
        (ref) => ref && ref.contains(e.target as Node)
      );
      if (!clickedInsideSomeCard) {
        setShowClientSuggestions(false);
        setSuggestionFor(null);
        setActiveField(null);
      }

      // Check for address suggestions
      if (
        addressDropdownRef.current &&
        !addressDropdownRef.current.contains(e.target as Node)
      ) {
        setShowAddressSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ---------- fetch all clients once dialog opens ---------- */
  useEffect(() => {
    if (!isOpen) return;
    getAllParties()
      .then((data) => {
        fuseRef.current = new Fuse(data, {
          keys: ["full_name", "email"],
          threshold: 0.3,
        });
      })
      .catch(console.error);
  }, [isOpen]);

  /* ---------- fetch realtor profile once dialog opens ---------- */
  useEffect(() => {
    if (!isOpen) return;
    getProfile("realtor")
      .then((profile) => {
        setRealtorProfile(profile);
      })
      .catch(console.error);
  }, [isOpen]);

  /* ---------- debounced search ---------- */
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
    [startTransition]
  );

  /* ---------- respond to searchTerm changes ---------- */
  useEffect(() => {
    performSearch(searchTerm);
  }, [searchTerm, performSearch]);

  /* ---------- handle selecting a suggestion ---------- */
  const handleClientSelect = (client: Party, index: number) => {
    updateClientAdding(index, "full_name", client.full_name);
    updateClientAdding(index, "email", client.email);
    setShowClientSuggestions(false);
    setSuggestionFor(null);
    setActiveField(null);
    setSearchTerm("");
  };

  /* ---------- client list state ---------- */

  const getDefaultClientRole = (ds: string) =>
    ds === "sell"
      ? "seller"
      : ds === "buy"
      ? "buyer"
      : ds === "lease"
      ? "landlord"
      : "tenant";

  const getRealtorRole = (ds: string) =>
    ds === "sell"
      ? "seller_agent"
      : ds === "buy"
      ? "buyer_agent"
      : ds === "lease"
      ? "landlord_agent"
      : "tenant_agent";

  const [clients, setClients] = useState<
    {
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
      party: Omit<
        Party,
        | "current_transaction_status"
        | "id"
        | "realtor_id"
        | "created_at"
        | "form_information"
        | "notes"
        | "phone_number"
      >;
    }[]
  >([
    // Realtor as first client (auto-added)
    {
      party: { full_name: "", email: "" },
      partyNumber: 1,
      role: getRealtorRole(dealSide),
    },
    // Default client
    {
      party: { full_name: "", email: "" },
      partyNumber: 1, // This will be properly calculated
      role: getDefaultClientRole(dealSide),
    },
  ]);

  type ClientType = (typeof clients)[0];
  type ClientRole = ClientType["role"];

  const calculateClientNumbers = (cs: ClientType[]) => {
    const roleCounts: Record<ClientRole, number> = {} as Record<
      ClientRole,
      number
    >;
    return cs.map((c) => {
      roleCounts[c.role] = (roleCounts[c.role] || 0) + 1;
      return { ...c, partyNumber: roleCounts[c.role] };
    });
  };

  // Update realtor client info when profile loads
  useEffect(() => {
    if (realtorProfile) {
      setClients((prev) => {
        const updated = prev.map((c, i) =>
          i === 0 // First client is always the realtor
            ? {
                ...c,
                party: {
                  full_name: `${realtorProfile.firstName} ${realtorProfile.lastName}`,
                  email: realtorProfile.email,
                },
              }
            : c
        );
        return calculateClientNumbers(updated);
      });
    }
  }, [realtorProfile]);

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
          ? { ...c, role: value as ClientRole }
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
          role: getDefaultClientRole(dealSide),
          partyNumber: 0, // Will be calculated by calculateClientNumbers
        },
      ])
    );

  const removeClient = (idx: number) =>
    setClients((prev) =>
      calculateClientNumbers(prev.filter((_, i) => i !== idx))
    );

  /* ---------- validation ---------- */

  const allClientsValid = clients.every(
    (c) => c.party.full_name.trim() && c.party.email.trim() && c.role.trim()
  );

  // Email validation - check for duplicates and conflicts with realtor
  const emailValidation = () => {
    // Check if any additional client has the same email as realtor
    if (realtorProfile) {
      const realtorEmail = realtorProfile.email.toLowerCase();
      const additionalClientEmails = clients
        .slice(1)
        .map((c) => c.party.email.trim().toLowerCase());
      if (additionalClientEmails.includes(realtorEmail)) {
        return {
          valid: false,
          message:
            "No additional clients can have the same email as the realtor",
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
  const valid =
    dealName.trim() &&
    allClientsValid &&
    emailCheck.valid &&
    propertyType &&
    (!useFormTemplate || templateType) &&
    propertyType &&
    (!useClientTemplate || clientTempType);

  /* ---------- submit ---------- */

  const submit = async () => {
    setLoading(true);
    try {
      // Check if there are any agent roles (other realtors) in the deal
      const hasOtherRealtors = clients.some((c) => c.role.includes("_agent"));

      // Determine which roles the current realtor represents based on deal side
      const getCurrentRealtorSideRoles = () => {
        switch (dealSide) {
          case "sell":
            return ["seller"];
          case "buy":
            return ["buyer"];
          case "lease":
            return ["landlord"];
          case "rent":
            return ["tenant"];
          default:
            return [];
        }
      };

      const currentRealtorSideRoles = getCurrentRealtorSideRoles();

      await onDealAdded({
        deal: {
          dealName,
          template: dealTemplate,
          partyIntakeTemplate: clientTemplate,
          steps_statuses: [],
        },
        parties: clients.map((c) => {
          let realtorIsRepresenting = false;

          // Never represent agents
          if (c.role.includes("_agent")) {
            realtorIsRepresenting = false;
          }
          // If no other realtors present, represent all parties
          else if (!hasOtherRealtors) {
            realtorIsRepresenting = true;
          }
          // If other realtors present, only represent your side's people
          else {
            realtorIsRepresenting = currentRealtorSideRoles.includes(c.role);
          }

          return {
            partyRole: c.role as
              | "seller"
              | "buyer"
              | "landlord"
              | "tenant"
              | "seller_agent"
              | "buyer_agent"
              | "tenant_agent"
              | "landlord_agent",
            realtorIsRepresenting,
            party: c.party,
            partyNumber: c.partyNumber,
          };
        }),
      });
      router.refresh();
      resetForm();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- helpers ---------- */

  const resetForm = () => {
    setIsOpen(false);
    setDealName("");
    setPropertyType("");
    setTemplateType("default");
    setUseFormTemplate(true);
    setClientTempType("default");
    setUseClientTemplate(true);
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
    setClients(
      calculateClientNumbers([
        // Realtor as first client (auto-added)
        {
          party: { full_name: "", email: "" },
          role: getRealtorRole(dealSide),
          partyNumber: 0,
        },
        // Default client
        {
          party: { full_name: "", email: "" },
          role: getDefaultClientRole(dealSide),
          partyNumber: 0,
        },
      ])
    );
  };


  const roleOptions: string[] = (() => {
    switch (dealSide) {
      case "sell":
        return ["seller", "buyer", "buyer_agent"];
      case "buy":
        return ["buyer"];
      case "lease":
        return ["landlord", "tenant", "tenant_agent"];
      case "rent":
        return ["tenant"];
    }
  })();

  /* ---------- template helpers ---------- */

  const suffixesForFormTemplates = (prop: string) =>
    allFormTemplates
      .filter((t) => t.startsWith(`${dealSide}-${prop}-`))
      .map((t) => t.split("-")[2])
      .filter((v, i, a) => a.indexOf(v) === i);

  const formSuffixes = suffixesForFormTemplates(propertyType);

  const suffixesForClientTemplates = (prop: string) =>
    allClientTemplates
      .filter((t) => t.startsWith(`${dealSide}-${prop}-`))
      .map((t) => t.split("-")[2])
      .filter((v, i, a) => a.indexOf(v) === i);

  const clientSuffixes = suffixesForClientTemplates(propertyType);

  /* ---------- template fetch ---------- */

  useEffect(() => {
    setLoadingTemplates(true);
    getAllTemplateNames()
      .then(setAllFormTemplates)
      .catch(console.error)
      .finally(() => {
        getAllPartyIntakeTemplateNamesByDealSide(dealSide)
          .then(setAllClientTemplates)
          .catch(console.error)
          .finally(() => setLoadingTemplates(false));
      });
  }, [dealSide]);

  /* ---------- keep templates in sync ---------- */

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

  useEffect(() => {
    setDealTemplate(
      propertyType
        ? `${dealSide}-${propertyType}-${
            useFormTemplate ? templateType : "blank"
          }`
        : "blank"
    );
  }, [propertyType, templateType, useFormTemplate, dealSide]);

  useEffect(() => {
    setClientTemplate(
      propertyType
        ? `${dealSide}-${propertyType}-${
            useClientTemplate ? clientTempType : "blank"
          }`
        : "blank"
    );
  }, [propertyType, clientTempType, useClientTemplate, dealSide]);

  /* ---------- render ---------- */

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* trigger */}
      <DialogTrigger asChild>
        <div
          className={`cursor-pointer my-2 ${colorStyles.action} ${colorStyles.hover} inline-flex items-center gap-1`}
        >
          <Plus size={16} /> <span className="sr-only">Add deal</span>
        </div>
      </DialogTrigger>

      {/* content */}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className={colorStyles.text}>Add New Deal</DialogTitle>
          <DialogDescription className={colorStyles.text}>
            Create a new deal in the {label} category.
          </DialogDescription>
        </DialogHeader>

        {/* body */}
        <div className="space-y-6 pb-4 max-h-[60vh] overflow-y-auto">
          {/* deal name */}
          <div className="grid grid-cols-4 items-center gap-4 py-1">
            <Label htmlFor="dealName" className="text-right">
              Deal Name
            </Label>
            <div className="col-span-3 relative" ref={addressDropdownRef}>
              <Input
                ref={addressInputRef}
                id="dealName"
                placeholder={
                  dealSide === "buy" || dealSide === "rent"
                    ? "Unique deal name"
                    : "Property address"
                }
                value={dealName}
                onChange={(e) => {
                  setDealName(e.target.value);
                  if (dealSide === "sell" || dealSide === "lease") {
                    searchAddresses(e.target.value);
                  }
                }}
                className="w-full"
                autoComplete="off"
              />

              {/* Loading indicator */}
              {isAddressLoading &&
                (dealSide === "sell" || dealSide === "lease") && (
                  <div className="absolute right-2 top-2.5">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                  </div>
                )}

              {/* Address suggestions dropdown */}
              {showAddressSuggestions &&
                addressSuggestions.length > 0 &&
                (dealSide === "sell" || dealSide === "lease") && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-[60] max-h-48 overflow-y-auto mt-1">
                    {addressSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 text-sm text-gray-900"
                        onClick={() => handleAddressSelect(suggestion)}
                      >
                        <div className="font-medium">
                          {suggestion.place_name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>

          {/* Property Type dropdown */}
          <div className="grid grid-cols-4 items-center gap-4 py-1">
            <Label htmlFor="propertyType" className="text-right">
              Property Type
            </Label>
            <div className="col-span-3">
              <Select
                value={propertyType}
                onValueChange={handlePropertyTypeChange}
              >
                <SelectTrigger id="propertyType" className="w-full">
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="improved_land">Improved Land</SelectItem>
                  <SelectItem value="unimproved_land">
                    Unimproved Land
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Realtor (Auto-added) */}
          <div>
            <h4 className="text-sm font-medium text-gray-700">
              Your Role (Auto-added)
            </h4>
            <p className="text-xs text-gray-500 mb-2">
              You will be automatically added as the{" "}
              {getRealtorRole(dealSide).replace("_", " ")} for this deal.
            </p>

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3">
                {realtorProfile ? (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {realtorProfile.firstName.charAt(0)}
                      {realtorProfile.lastName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {realtorProfile.firstName} {realtorProfile.lastName}
                      </div>
                      <div className="text-xs text-gray-600">
                        {realtorProfile.email}
                      </div>
                      <div className="text-xs text-blue-600 font-medium capitalize">
                        {getRealtorRole(dealSide).replace("_", " ")} (Party #1)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <Loader2 className="animate-spin h-4 w-4 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse mb-1 w-3/4"></div>
                      <div className="h-3 bg-blue-200 rounded animate-pulse w-1/2"></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Parties */}
          <div>
            <h4 className="text-sm font-medium text-gray-700">
              Additional Parties
            </h4>
            <p className="text-xs text-gray-500 mb-2">
              Add additional parties to this deal. At least one additional party is required. 
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-64 overflow-y-auto pr-2">
              {clients.slice(1).map((party, idx) => {
                const actualIdx = idx + 1; // Adjust index since we're skipping the first client
                return (
                  <Card key={actualIdx} className="relative">
                    <CardContent className="p-2">
                      {/* remove */}
                      {clients.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeClient(actualIdx)}
                          className="absolute top-2 right-2 text-gray-500 hover:text-red-600"
                          aria-label={`Remove client ${actualIdx + 1}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}

                      {/* header */}
                      <h5 className="text-sm font-semibold mb-1 capitalize">
                        {party.role.replace("_", " ")} {party.partyNumber}
                      </h5>

                      {/* role select */}
                      <div className="grid grid-cols-4 items-center gap-2">
                        <Label
                          htmlFor={`clientRole-${actualIdx}`}
                          className="text-right"
                        >
                          Role
                        </Label>
                        <Select
                          value={party.role}
                          onValueChange={(v) =>
                            updateClientAdding(actualIdx, "role", v)
                          }
                        >
                          <SelectTrigger className="col-span-3 w-full">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            {roleOptions.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt.replace("_", " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* name input with search */}
                      <div className="grid grid-cols-4 items-center gap-2 mt-1">
                        <Label
                          htmlFor={`clientName-${actualIdx}`}
                          className="text-right"
                        >
                          Name
                        </Label>
                        <div
                          className="col-span-3 relative"
                          ref={(el) => {
                            if (activeField === "name")
                              searchRefs.current[actualIdx] = el;
                          }}
                        >
                          <Input
                            id={`clientName-${actualIdx}`}
                            placeholder="John Doe"
                            value={party.party.full_name}
                            onChange={(e) => {
                              updateClientAdding(
                                actualIdx,
                                "full_name",
                                e.target.value
                              );
                              setSuggestionFor(actualIdx);
                              setActiveField("name");
                              setSearchTerm(e.target.value);
                            }}
                            onFocus={(e) => {
                              searchRefs.current[actualIdx] = e.currentTarget
                                .parentElement as HTMLDivElement;
                              setSuggestionFor(actualIdx);
                              setActiveField("name");
                              if (party.party.full_name) {
                                setShowClientSuggestions(true);
                              }
                            }}
                            className="w-full"
                            autoComplete="off"
                            autoCorrect="off"
                          />

                          {/* suggestions: only for NAME field and not for realtor */}
                          {activeField === "name" &&
                          suggestionFor === actualIdx &&
                          showClientSuggestions &&
                          clientSearchResults.length ? (
                            <div className="absolute left-0 right-0 top-full z-50 mt-1 bg-background border rounded-md shadow-sm max-h-48 overflow-y-auto">
                              {clientSearchResults.map((result, rIdx) => (
                                <div
                                  key={rIdx}
                                  className="px-3 py-1.5 hover:bg-accent/50 cursor-pointer text-sm"
                                  onClick={() =>
                                    handleClientSelect(result, actualIdx)
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
                          ) : null}
                        </div>
                      </div>

                      {/* email input */}
                      <div className="grid grid-cols-4 items-center gap-2 mt-1">
                        <Label
                          htmlFor={`clientEmail-${actualIdx}`}
                          className="text-right"
                        >
                          Email
                        </Label>
                        <div
                          className="col-span-3 relative"
                          ref={(el) => {
                            if (activeField === "email")
                              searchRefs.current[actualIdx] = el;
                          }}
                        >
                          <Input
                            id={`clientEmail-${actualIdx}`}
                            placeholder="client@example.com"
                            value={party.party.email}
                            onChange={(e) => {
                              updateClientAdding(
                                actualIdx,
                                "email",
                                e.target.value
                              );
                              setSuggestionFor(actualIdx);
                              setActiveField("email");
                              setSearchTerm(e.target.value);
                            }}
                            onFocus={(e) => {
                              searchRefs.current[actualIdx] = e.currentTarget
                                .parentElement as HTMLDivElement;
                              setSuggestionFor(actualIdx);
                              setActiveField("email");
                              if (party.party.email)
                                setShowClientSuggestions(true);
                            }}
                            className="w-full"
                            autoComplete="off"
                            autoCorrect="off"
                          />

                          {/* suggestions: only for EMAIL field and not for realtor */}
                          {activeField === "email" &&
                          suggestionFor === actualIdx &&
                          showClientSuggestions &&
                          clientSearchResults.length ? (
                            <div className="absolute left-0 right-0 top-full z-50 mt-1 bg-background border rounded-md shadow-sm max-h-48 overflow-y-auto">
                              {clientSearchResults.map((result, rIdx) => (
                                <div
                                  key={rIdx}
                                  className="px-3 py-1.5 hover:bg-accent/50 cursor-pointer text-sm"
                                  onClick={() =>
                                    handleClientSelect(result, actualIdx)
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
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* add client */}
            <Button
              variant="ghost"
              size="sm"
              onClick={addClient}
              className="mt-2 flex items-center gap-1 text-blue-600 hover:text-blue-800"
            >
              <Plus size={14} /> Add Client
            </Button>
          </div>

          {/* Ora AI vs Template Selection */}
          <div className="flex items-center gap-2 border border-green-200 bg-green-50 rounded px-3 py-2 my-2">
            <span className="text-xs text-green-900 font-medium flex-1">
              {useOraAI
                ? "Recommended: Using Ora AI to create forms and intake portals."
                : "Choose templates to proceed"}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 px-0 py-0 text-xs"
              onClick={() => {
                if (useOraAI) {
                  setUseOraAI(false);
                  setUseFormTemplate(true);
                  setUseClientTemplate(true);
                } else {
                  setUseOraAI(true);
                  setUseFormTemplate(false);
                  setUseClientTemplate(false);
                }
              }}
              title={useOraAI ? "Switch to Templates" : "Switch back to Ora AI"}
            >
              <span className="sr-only">Change</span>
              <ArrowLeftRight size={16} />
            </Button>
          </div>
          {!useOraAI && (
            <>
              {/* template blocks */}
              <TemplateBlock
                title="Form Template"
                dealSide={dealSide}
                propertyType={propertyType}
                onPropertyTypeChange={handlePropertyTypeChange}
                templateType={useFormTemplate ? templateType : "blank"}
                onTemplateTypeChange={setTemplateType}
                suffixes={formSuffixes}
                loading={loadingTemplates}
                useTemplate={useFormTemplate}
                onToggleUse={setUseFormTemplate}
              />

              <TemplateBlock
                title="Client Template"
                dealSide={dealSide}
                propertyType={propertyType}
                onPropertyTypeChange={handlePropertyTypeChange}
                templateType={useClientTemplate ? clientTempType : "blank"}
                onTemplateTypeChange={setClientTempType}
                suffixes={clientSuffixes}
                loading={loadingTemplates}
                useTemplate={useClientTemplate}
                onToggleUse={setUseClientTemplate}
              />
            </>
          )}
        </div>

        {/* footer */}
        <DialogFooter className="p-4 flex justify-end space-x-2">
          {!emailCheck.valid && (
            <div className="flex-1 text-sm text-red-600 mr-4">
              {emailCheck.message}
            </div>
          )}
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!valid || loading}
            onClick={submit}
            className={`${valid ? colorStyles.text : "text-gray-500"}`}
            style={{
              background: valid ? colorStyles.bg : "lightgray",
              opacity: valid ? 1 : 0.5,
              border: `1px solid ${valid ? colorStyles.bg : "gray"}`,
            }}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} /> Creating…
              </>
            ) : (
              "Create"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- template block sub-component ---------- */

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
}: BlockProps) {
  return (
    <div className="my-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground">{title}</h4>
        <div className="flex items-center gap-2">
          <Label htmlFor={`${title}-switch`} className="text-xs">
            Select templates?
          </Label>
          <Switch
            id={`${title}-switch`}
            checked={useTemplate}
            onCheckedChange={onToggleUse}
          />
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        {/* deal side (static) */}
        <div className="flex flex-1 min-w-[100px] h-10 rounded-md border bg-gray-100 px-3 py-2 text-sm items-center justify-center capitalize">
          {dealSide}
        </div>

        {/* property select */}
        <Select value={propertyType} onValueChange={onPropertyTypeChange}>
          <SelectTrigger className="flex-1 min-w-[100px] text-center">
            <SelectValue placeholder="Property" />
          </SelectTrigger>
          <SelectContent position="popper">
            {[
              "residential",
              "commercial",
              "improved_land",
              "unimproved_land",
            ].map((p) => (
              <SelectItem key={p} value={p} className="text-center">
                {p
                  .replace(/_/g, " ")
                  .split(" ")
                  .map((w) => w[0].toUpperCase() + w.slice(1))
                  .join(" ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* template type select */}
        <Select
          value={useTemplate ? templateType : "blank"}
          onValueChange={onTemplateTypeChange}
          disabled={!useTemplate || !propertyType || loading}
        >
          <SelectTrigger
            className={`flex-1 min-w-[100px] text-center ${
              !useTemplate ? "opacity-50" : ""
            }`}
          >
            <SelectValue placeholder={useTemplate ? "Type" : "Default"} />
          </SelectTrigger>
          <SelectContent position="popper">
            {!useTemplate ? (
              <SelectItem value="blank" className="text-center">
                Ora designed
              </SelectItem>
            ) : loading ? (
              <div className="text-center text-sm text-muted-foreground p-2">
                Loading…
              </div>
            ) : !suffixes.length ? (
              <div className="text-center text-sm text-muted-foreground p-2">
                No types
              </div>
            ) : (
              suffixes.map((s) => (
                <SelectItem key={s} value={s} className="text-center">
                  {s[0].toUpperCase() + s.slice(1).replace(/_/g, " ")}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {propertyType && (
        <p className="text-xs text-gray-500 mt-1 text-center">
          {`${dealSide}-${propertyType}-${
            useTemplate ? templateType : "ora-designed"
          }`}
        </p>
      )}
      <Separator className="my-2" />
    </div>
  );
}
