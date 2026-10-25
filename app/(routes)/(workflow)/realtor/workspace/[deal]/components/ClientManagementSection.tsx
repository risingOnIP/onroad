"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserPlus,
  Send,
  CheckCircle,
  Copy,
  FileText,
  Eye,
  EyeOff,
  Edit,
  Users,
  FormInput,
  Database,
  Loader2,
  Shield,
  PenTool,
  Plus,
  Trash2,
  Save,
  MoreVertical,
  Ban,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PartyIntakeSchemaItem,
  Party,
  Profile,
  DealParty,
  AvailableForms,
} from "@/components/files/types/realtor";
import { toast } from "sonner";
import Fuse from "fuse.js";
import { debounce } from "lodash";

// Import client intake actions
import {
  getClientIntakesByDealId,
  saveClientIntakeSchema,
  generateClientIntakeLink,
  revokeClientIntakeLink,
  pushPartyIntakeAnswersToForms,
} from "@/app/actions/realtor/client-intake-actions";

// Import portal actions
import { sendPortalInvitation } from "@/app/actions/realtor/invitation-actions";
import { getDealClients } from "@/app/actions/realtor/deal-actions";
import {
  createDealPartyRow,
  getAllDealOptionsWithParties,
  createDealOptionPartyRow,
  getDealPartiesByDealId,
} from "@/app/actions/realtor/dealClient-actions";
import { getAllParties } from "@/app/actions/realtor/client-actions";
import { getProfile } from "@/app/actions/realtor/profile-actions";

// Import IntakeFormBuilder if it exists
import { ClientIntakeEditor } from "../../templates/modify/client-intake/[clientIntakeTemplateId]/components";
import ClientIntakeResponseViewer from "@/components/files/realtor/ClientIntakeResponseViewer";
import ClientIntakeFormPreview from "@/components/files/realtor/ClientIntakeFormPreview";
import ClientIntakePreview from "./ClientIntakePreview";
import PublishIntakeDialog from "./PublishIntakeDialog";
import { getAvailableFormsFromDealId } from "@/app/actions/realtor/form-actions";
import { getSchemaByFormType } from "@/app/actions/realtor/schema";

// Types from ClientIntakeSection
interface PartyIntake {
  id: string;
  email: string;
  deal_id: string;
  party_response: Record<string, any>;
  realtor_id: string;
  party_intake_form_schema: PartyIntakeSchemaItem[];
  form_visible: boolean;
  created_at: string;
  party_id: string;
  partyrole_partynumber: string;
}

// Types from PortalSection
interface ExistingClient {
  id: string;
  email: string;
  full_name: string;
  phone_number: string;
  current_transaction_status: string;
  created_at: string;
}

// Extended client type with additional fields
interface ExtendedClient extends ExistingClient {
  intake?: PartyIntake;
  portalinvitesent: boolean;
  partyrole_partynumber?: string;
  realtorIsRepresenting?: boolean;
}

interface DealOptionWithParties {
  id: string;
  address: string;
  deal_id: string;
  parties: {
    id: string;
    full_name: string;
    email: string;
    phone_number: string;
    party_role: string;
    current_transaction_status: string;
  }[];
}

interface Deal {
  id: string;
  dealname: string;
  dealSide?: string;
}

interface ClientManagementSectionProps {
  deal: Deal;
  // URL state props
  editingIntake?: string;
  viewingResponses?: string;
  previewingIntake?: string;
  activeTab?: "all" | "yours" | "properties";
  // Navigation functions
  onEditIntake: (intakeId: string) => void;
  onViewResponses: (intakeId: string) => void;
  onPreviewIntake: (intakeId: string) => void;
  onSetActiveTab: (tab: "all" | "yours" | "properties") => void;
  onBackToList: () => void;
}

export default function ClientManagementSection({
  deal,
  editingIntake,
  viewingResponses,
  previewingIntake,
  activeTab = "all",
  onEditIntake,
  onViewResponses,
  onPreviewIntake,
  onSetActiveTab,
  onBackToList,
}: ClientManagementSectionProps) {
  // All hooks must be declared at the top before any early returns
  const [sendingPortals, setSendingPortals] = useState<Set<string>>(new Set());
  const [copiedPortals, setCopiedPortals] = useState<Set<string>>(new Set());
  const [partyIntakes, setPartyIntakes] = useState<PartyIntake[]>([]);
  const [loadingIntakes, setLoadingIntakes] = useState(true);
  // These are now controlled by URL parameters
  // Derive the selected intake objects from the IDs and partyIntakes array
  const selectedIntake = editingIntake
    ? partyIntakes.find((intake) => intake.id === editingIntake) || null
    : null;
  const viewingResponsesIntake = viewingResponses
    ? partyIntakes.find((intake) => intake.id === viewingResponses) || null
    : null;
  const previewingIntakeData = previewingIntake
    ? partyIntakes.find((intake) => intake.id === previewingIntake) || null
    : null;
  const [publishingIntake, setPublishingIntake] = useState<string | null>(null);
  const [pushingToForms, setPushingToForms] = useState<string | null>(null);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [intakeToPublish, setIntakeToPublish] = useState<PartyIntake | null>(null);

  // Portal state from PortalSection
  const [existingClients, setExistingClients] = useState<ExistingClient[]>([]);
  const [dealOptionParties, setDealOptionParties] = useState<
    DealOptionWithParties[]
  >([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [sentPortals, setSentPortals] = useState<Set<string>>(new Set());
  const [portalUrls, setPortalUrls] = useState<Map<string, string>>(new Map());
  const [sendingInvitation, setSendingInvitation] = useState<string | null>(
    null
  );

  // Client management state from ClientIntakeSection
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);
  const [newClients, setNewClients] = useState<
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
  const [isSavingClients, setIsSavingClients] = useState(false);
  // activeTab is now controlled by URL parameters via props
  // const [activeTab, setActiveTab] = useState<string>("all");

  // Property-specific party management state
  const [showPropertyPartyDialog, setShowPropertyPartyDialog] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    null
  );
  const [propertyParties, setPropertyParties] = useState<
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
  const [propertySearchTerm, setPropertySearchTerm] = useState("");
  const propertyFuseRef = useRef<Fuse<Party> | null>(null);
  const [propertySuggestionFor, setPropertySuggestionFor] = useState<
    number | null
  >(null);
  const [showPropertySuggestions, setShowPropertySuggestions] = useState(false);
  const [propertySearchResults, setPropertySearchResults] = useState<Party[]>(
    []
  );
  const [propertyActiveField, setPropertyActiveField] = useState<
    "name" | "email" | null
  >(null);
  const propertySearchRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [propertyValidationError, setPropertyValidationError] =
    useState<string>("");
  const [isSavingPropertyParties, setIsSavingPropertyParties] = useState(false);

  const router = useRouter();


  

  // Load data for both tabs
  useEffect(() => {
    // Only load data if deal.id exists
    if (!deal?.id) {
      console.warn("Deal ID not available, skipping data load");
      return;
    }

    loadPartyIntakes();
    loadExistingClients();
    loadRealtorProfile();
    loadAllParties();
  }, [editingIntake, viewingResponses, previewingIntake, deal.id]);

  // Refetch intakes when returning to list view (when all editing/viewing states are cleared)
  useEffect(() => {
    // Only refetch if we're in the main list view (no editing, viewing, or previewing)
    if (!editingIntake && !viewingResponses && !previewingIntake && deal?.id) {
      loadPartyIntakes();
    }
  }, [editingIntake, viewingResponses, previewingIntake, deal?.id]);

  const loadPartyIntakes = async () => {
    try {
      setLoadingIntakes(true);

      // Double-check deal.id exists before API call
      if (!deal?.id) {
        throw new Error("Deal ID is required to load client intakes");
      }

      const intakes = await getClientIntakesByDealId(deal.id);
      setPartyIntakes(intakes || []);
    } catch (error: any) {
      console.error("Error loading party intakes:", error);

      // Provide more specific error messages
      if (error?.message?.includes("Route not found")) {
        toast.error("Unable to load client intakes. Please refresh the page.");
      } else if (error?.message?.includes("Deal ID is required")) {
        toast.error("Deal information not available. Please try again.");
      } else {
        toast.error("Failed to load client intake forms");
      }
    } finally {
      setLoadingIntakes(false);
    }
  };

  const loadExistingClients = async () => {
    setLoadingClients(true);
    try {
      // Check deal.id exists before API calls
      if (!deal?.id) {
        throw new Error("Deal ID is required to load clients");
      }

      const [clients, dealOptionsWithParties] = await Promise.all([
        getDealClients(deal.id),
        getAllDealOptionsWithParties(deal.id),
      ]);

      // Transform DealParty[] to ExistingClient[]
      const transformedClients: ExistingClient[] = clients.map(
        (client: any) => ({
          id: client.party_id,
          email: client.party_email || "",
          full_name: client.party_name || client.full_name || "",
          phone_number: client.party_phone || client.phone_number || "",
          current_transaction_status:
            client.party_status || client.current_transaction_status || "lead",
          created_at: client.created_at || new Date().toISOString(),
        })
      );

      setExistingClients(transformedClients);
      setDealOptionParties(dealOptionsWithParties);
    } catch (error) {
      console.error("Error loading clients:", error);
      toast.error("Failed to load existing clients");
    } finally {
      setLoadingClients(false);
    }
  };

  const loadRealtorProfile = async () => {
    try {
      const profile = await getProfile("realtor");
      setRealtorProfile(profile);
    } catch (error) {
      console.error("Error loading realtor profile:", error);
    }
  };

  const loadAllParties = async () => {
    try {
      const allParties = await getAllParties();
      fuseRef.current = new Fuse(allParties, {
        keys: ["full_name", "email"],
        threshold: 0.3,
      });
    } catch (error) {
      console.error("Error loading parties:", error);
    }
  };

  // Portal Functions from PortalSection
  const handleSendPortalInvitation = async (client: ExistingClient) => {
    setSendingPortals((prev) => new Set(prev).add(client.id));

    try {
      const result = await sendPortalInvitation({
        dealId: deal.id,
        clientEmail: client.email,
        clientName: client.full_name,
        clientId: client.id,
      });

      toast.success(`Portal invitation sent to ${client.email}`);
      setSentPortals((prev) => new Set(prev).add(client.id));

      // Store the portal URL for copying later
      if (result.portalUrl) {
        setPortalUrls(
          (prev) => new Map([...prev, [client.id, result.portalUrl]])
        );
        await navigator.clipboard.writeText(result.portalUrl);
        toast.info("Portal link copied to clipboard!");
      }

      router.refresh();
    } catch (error) {
      console.error("Error sending portal:", error);
      toast.error("Failed to send portal invitation");
    } finally {
      setSendingPortals((prev) => {
        const next = new Set(prev);
        next.delete(client.id);
        return next;
      });
    }
  };

  const sendDealOptionPartyInvitation = async (
    party: DealOptionWithParties["parties"][0]
  ) => {
    setSendingInvitation(party.id);

    try {
      const result = await sendPortalInvitation({
        dealId: deal.id,
        clientEmail: party.email,
        clientName: party.full_name,
        clientId: party.id,
      });

      toast.success(`Portal invitation sent to ${party.email}`);
      setSentPortals((prev) => new Set(prev).add(party.id));

      // Store the portal URL for copying later
      if (result.portalUrl) {
        setPortalUrls(
          (prev) => new Map([...prev, [party.id, result.portalUrl]])
        );
        await navigator.clipboard.writeText(result.portalUrl);
        toast.info("Portal link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send invitation"
      );
    } finally {
      setSendingInvitation(null);
    }
  };

  const copyPortalUrl = async (clientId: string) => {
    const url =
      portalUrls.get(clientId) ||
      `${window.location.origin}/client-portal/${deal.id}/${clientId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedPortals((prev) => new Set([...prev, clientId]));
      toast.success("Portal URL copied to clipboard!");
      setTimeout(() => {
        setCopiedPortals((prev) => {
          const newSet = new Set(prev);
          newSet.delete(clientId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error("Error copying portal URL:", error);
      toast.error("Failed to copy URL. Please try again.");
    }
  };

  // Client management functions from ClientIntakeSection
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

  const calculateClientNumbers = (cs: typeof newClients) => {
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
    setNewClients((prev) => {
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

  const handleGetAvailableFormTypes = async () => {
    const formTypes : AvailableForms = await getAvailableFormsFromDealId(deal.id);
    const allFormTypes = formTypes.deal_wide.concat(formTypes.property_specific || []);
    const availableFormTypes = allFormTypes.map(ft => ft.formType);
    //making uniique
    const uniqueFormTypes = [...new Set(availableFormTypes)];
    return uniqueFormTypes;
  };

  const addClient = () =>
    setNewClients((prev) =>
      calculateClientNumbers([
        ...prev,
        {
          party: { full_name: "", email: "" },
          role: getDefaultClientRole(deal.dealSide || "") as
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

  const removeClient = (idx: number) => {
    setNewClients((prev) =>
      calculateClientNumbers(prev.filter((_, i) => i !== idx))
    );
  };

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

  useEffect(() => {
    performSearch(searchTerm);
  }, [searchTerm, performSearch]);

  const handleClientSelect = (client: Party, index: number) => {
    updateClientAdding(index, "full_name", client.full_name);
    updateClientAdding(index, "email", client.email);
    setNewClients((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, party: { ...c.party, id: client.id } } : c
      )
    );
    setShowClientSuggestions(false);
    setSuggestionFor(null);
    setActiveField(null);
    setSearchTerm("");
  };

  // Email validation
  const emailValidation = () => {
    if (realtorProfile) {
      const realtorEmail = realtorProfile.email.toLowerCase();
      const clientEmails = newClients
        .map((c) => c.party.email.trim().toLowerCase())
        .filter((email) => email);

      if (clientEmails.includes(realtorEmail)) {
        return {
          valid: false,
          message: "No clients can have the same email as the realtor",
        };
      }
    }

    const emails = newClients
      .map((c) => c.party.email.trim().toLowerCase())
      .filter((email) => email);
    const uniqueEmails = new Set(emails);

    if (emails.length !== uniqueEmails.size) {
      return { valid: false, message: "Duplicate email addresses found" };
    }

    return { valid: true, message: "" };
  };

  const emailCheck = emailValidation();

  const allClientsValid = newClients.every(
    (c) => c.party.full_name.trim() && c.party.email.trim() && c.role.trim()
  );

  const canSaveClients =
    allClientsValid && emailCheck.valid && newClients.length > 0;

  const saveNewClients = async () => {
    if (!canSaveClients) return;

    setIsSavingClients(true);
    try {
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

      toast.success("Clients added successfully");
      setShowAddClientDialog(false);
      setNewClients([]);
      loadExistingClients(); // Refresh the list
      loadPartyIntakes(); // Refresh intakes
    } catch (error) {
      console.error("Error adding clients:", error);
      toast.error("Failed to add clients");
    } finally {
      setIsSavingClients(false);
    }
  };

  const handleInviteClient = () => {
    setNewClients([]);
    setShowAddClientDialog(true);
    addClient();
  };

  // Click outside handler
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

  // Update validation error when email validation changes
  useEffect(() => {
    if (!emailCheck.valid) {
      setValidationError(emailCheck.message);
    } else {
      setValidationError("");
    }
  }, [emailCheck.valid, emailCheck.message]);

  // Property-specific party management functions
  const getDefaultPropertyPartyRole = (ds: string) =>
    ds === "buy" ? "seller" : "landlord";

  const propertyRoleOptions: string[] = (() => {
    switch (deal.dealSide) {
      case "buy":
        return ["seller", "seller_agent"];
      case "rent":
        return ["landlord", "landlord_agent"];
      default:
        return [];
    }
  })();

  const calculatePropertyPartyNumbers = (ps: typeof propertyParties) => {
    const roleCounts: Record<string, number> = {};
    return ps.map((p) => {
      roleCounts[p.role] = (roleCounts[p.role] || 0) + 1;
      return { ...p, partyNumber: roleCounts[p.role] };
    });
  };

  const updatePropertyParty = (
    index: number,
    field: "role" | "full_name" | "email",
    value: string
  ) => {
    setPropertyParties((prev) => {
      const next = prev.map((p, i) =>
        i !== index
          ? p
          : field === "role"
          ? {
              ...p,
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
          : { ...p, party: { ...p.party, [field]: value } }
      );
      return calculatePropertyPartyNumbers(next);
    });
  };

  const addPropertyParty = () =>
    setPropertyParties((prev) =>
      calculatePropertyPartyNumbers([
        ...prev,
        {
          party: { full_name: "", email: "" },
          role: getDefaultPropertyPartyRole(deal.dealSide || "") as
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

  const removePropertyParty = (idx: number) => {
    setPropertyParties((prev) =>
      calculatePropertyPartyNumbers(prev.filter((_, i) => i !== idx))
    );
  };

  const performPropertySearch = useCallback(
    debounce((value: string) => {
      startTransition(() => {
        if (propertyFuseRef.current && value.trim()) {
          const results = propertyFuseRef.current
            .search(value)
            .map((r) => r.item);
          setPropertySearchResults(results);
          setShowPropertySuggestions(true);
        } else {
          setPropertySearchResults([]);
          setShowPropertySuggestions(false);
        }
      });
    }, 200),
    [startTransition]
  );

  useEffect(() => {
    performPropertySearch(propertySearchTerm);
  }, [propertySearchTerm, performPropertySearch]);

  const handlePropertyPartySelect = (party: Party, index: number) => {
    updatePropertyParty(index, "full_name", party.full_name);
    updatePropertyParty(index, "email", party.email);
    setPropertyParties((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, party: { ...p.party, id: party.id } } : p
      )
    );
    setShowPropertySuggestions(false);
    setPropertySuggestionFor(null);
    setPropertyActiveField(null);
    setPropertySearchTerm("");
  };

  // Property party email validation
  const propertyEmailValidation = () => {
    if (realtorProfile) {
      const realtorEmail = realtorProfile.email.toLowerCase();
      const partyEmails = propertyParties
        .map((p) => p.party.email.trim().toLowerCase())
        .filter((email) => email);

      if (partyEmails.includes(realtorEmail)) {
        return {
          valid: false,
          message: "No parties can have the same email as the realtor",
        };
      }
    }

    const emails = propertyParties
      .map((p) => p.party.email.trim().toLowerCase())
      .filter((email) => email);
    const uniqueEmails = new Set(emails);

    if (emails.length !== uniqueEmails.size) {
      return { valid: false, message: "Duplicate email addresses found" };
    }

    return { valid: true, message: "" };
  };

  const propertyEmailCheck = propertyEmailValidation();

  const allPropertyPartiesValid = propertyParties.every(
    (p) => p.party.full_name.trim() && p.party.email.trim() && p.role.trim()
  );

  const canSavePropertyParties =
    allPropertyPartiesValid &&
    propertyEmailCheck.valid &&
    propertyParties.length > 0;

  const savePropertyParties = async () => {
    if (!canSavePropertyParties || !selectedPropertyId) return;

    setIsSavingPropertyParties(true);
    try {
      await createDealOptionPartyRow(
        selectedPropertyId,
        propertyParties.map((p) => ({
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

      toast.success("Property parties added successfully");
      setShowPropertyPartyDialog(false);
      setPropertyParties([]);
      setSelectedPropertyId(null);
      loadExistingClients(); // Refresh to get the new parties
      loadPartyIntakes(); // Refresh intakes
    } catch (error) {
      console.error("Error adding property parties:", error);
      toast.error("Failed to add property parties");
    } finally {
      setIsSavingPropertyParties(false);
    }
  };

  const handleAddPropertyParty = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setPropertyParties([]);
    setShowPropertyPartyDialog(true);
    // Initialize fuse search if not already done
    if (!propertyFuseRef.current && fuseRef.current) {
      propertyFuseRef.current = fuseRef.current;
    }
    addPropertyParty();
  };

  // Property party click outside handler
  useEffect(() => {
    function handlePropertyClickOutside(e: MouseEvent) {
      const clickedInsideSomeCard = propertySearchRefs.current.some(
        (ref) => ref && ref.contains(e.target as Node)
      );
      if (!clickedInsideSomeCard) {
        setShowPropertySuggestions(false);
        setPropertySuggestionFor(null);
        setPropertyActiveField(null);
      }
    }
    document.addEventListener("mousedown", handlePropertyClickOutside);
    return () =>
      document.removeEventListener("mousedown", handlePropertyClickOutside);
  }, []);

  // Update property validation error when email validation changes
  useEffect(() => {
    if (!propertyEmailCheck.valid) {
      setPropertyValidationError(propertyEmailCheck.message);
    } else {
      setPropertyValidationError("");
    }
  }, [propertyEmailCheck.valid, propertyEmailCheck.message]);

  // Intake Functions - removed since intakes are created automatically with clients

  const handleSaveSchema = async (schema: PartyIntakeSchemaItem[]) => {
    if (!selectedIntake) return;

    try {
      await saveClientIntakeSchema(schema, selectedIntake.id);

      toast.success("Intake form schema has been saved");
    } catch (error) {
      console.error("Error saving schema:", error);
      toast.error("Failed to save form schema");
    }
  };

  const handleTogglePublish = async (
    intakeId: string,
    currentState: boolean
  ) => {
    // If the form is not published, show publish dialog
    if (!currentState) {
      const intake = partyIntakes.find((i) => i.id === intakeId);
      if (intake) {
        setIntakeToPublish(intake);
        setShowPublishDialog(true);
      }
      return;
    }

    // If already published, unpublish directly
    setPublishingIntake(intakeId);
    try {
      await revokeClientIntakeLink(intakeId);

      setPartyIntakes((prev) =>
        prev.map((intake) =>
          intake.id === intakeId
            ? { ...intake, form_visible: false }
            : intake
        )
      );
    } catch (error) {
      console.error("Error unpublishing form:", error);
      toast.error("Failed to unpublish form");
    } finally {
      setPublishingIntake(null);
    }
  };

  const handleConfirmPublish = async () => {
    if (!intakeToPublish) return;
    
    setPublishingIntake(intakeToPublish.id);
    try {
      await generateClientIntakeLink(intakeToPublish.id);

      setPartyIntakes((prev) =>
        prev.map((intake) =>
          intake.id === intakeToPublish.id
            ? { ...intake, form_visible: true }
            : intake
        )
      );

      toast.success("Form Published");
      setShowPublishDialog(false);
      setIntakeToPublish(null);
    } catch (error) {
      console.error("Error publishing form:", error);
      toast.error("Failed to publish form");
    } finally {
      setPublishingIntake(null);
    }
  };

  const handleClosePublishDialog = () => {
    setShowPublishDialog(false);
    setIntakeToPublish(null);
  };

  const handlePushToForms = async (intakeId: string) => {
    setPushingToForms(intakeId);
    try {
      const result = await pushPartyIntakeAnswersToForms(intakeId);

      if (result.success) {
        toast.success(result.message || "Successfully pushed answers to forms");
      } else {
        toast.error(result.message || "Failed to push answers to forms");
      }
    } catch (error) {
      console.error("Error pushing to forms:", error);
      toast.error("Failed to push responses to forms");
    } finally {
      setPushingToForms(null);
    }
  };

  // State to store deal parties data
  const [dealParties, setDealParties] = useState<DealParty[]>([]);

  // Fetch deal parties data once
  useEffect(() => {
    const fetchDealParties = async () => {
      if (deal?.id) {
        try {
          const parties = await getDealPartiesByDealId(deal.id);
          setDealParties(parties);
        } catch (error) {
          console.error("Error fetching deal parties:", error);
        }
      }
    };
    fetchDealParties();
  }, [deal?.id]);

  // Get all unique clients from existing clients data
  const allClients = useMemo((): ExtendedClient[] => {
    // Start with existing deal-level clients
    const dealClients = existingClients.map((client) => {
      const intake = partyIntakes.find((i) => i.party_id === client.id);
      const dealParty = dealParties.find((dp) => dp.party_id === client.id);

      // Generate partyrole_partynumber from deals_parties data
      const partyrole_partynumber = dealParty
        ? `${dealParty.party_role} ${dealParty.partyNumber}`
        : undefined;

      return {
        ...client,
        intake,
        portalinvitesent: sentPortals.has(client.id),
        partyrole_partynumber,
        realtorIsRepresenting: dealParty?.realtorIsRepresenting || false,
      };
    });

    // Add property-specific parties that aren't already in dealClients
    const propertyPartyIds = new Set<string>();
    const propertyClients: ExtendedClient[] = [];

    dealOptionParties.forEach((property) => {
      if (property.address !== "deal-wide") {
        property.parties.forEach((party) => {
          // Check if this party is not already in dealClients
          if (
            !dealClients.find((client) => client.id === party.id) &&
            !propertyPartyIds.has(party.id)
          ) {
            propertyPartyIds.add(party.id);
            const intake = partyIntakes.find((i) => i.party_id === party.id);
            const dealParty = dealParties.find(
              (dp) => dp.party_id === party.id
            );

            // Generate partyrole_partynumber from deals_parties data
            // If not in deals_parties yet, generate from party data
            const partyrole_partynumber = dealParty
              ? `${dealParty.party_role} ${dealParty.partyNumber}`
              : party.party_role
              ? `${party.party_role} 1`
              : undefined;

            propertyClients.push({
              id: party.id,
              email: party.email,
              full_name: party.full_name,
              phone_number: party.phone_number,
              current_transaction_status: party.current_transaction_status,
              created_at: new Date().toISOString(),
              intake,
              portalinvitesent: sentPortals.has(party.id),
              partyrole_partynumber,
              realtorIsRepresenting: dealParty?.realtorIsRepresenting || false,
            });
          }
        });
      }
    });

    // Combine deal clients and property-specific clients
    const allClientsArray = [...dealClients, ...propertyClients];
    return allClientsArray;
  }, [
    existingClients,
    dealOptionParties,
    partyIntakes,
    sentPortals,
    dealParties,
  ]);

  // Filter clients for "Your Clients" tab (realtorIsRepresenting = true)
  const yourClients = useMemo(() => {
    return allClients.filter((client) => client.realtorIsRepresenting);
  }, [allClients]);

  // Get property-specific parties
  const propertyPartiesData = useMemo(() => {
    return dealOptionParties
      .filter((property) => {
        return property.address !== "deal-wide";
      })
      .map((property) => {
        const partiesWithIntakes = property.parties.map((party) => {
          const intake = partyIntakes.find((i) => i.party_id === party.id);
          return {
            ...party,
            intake,
            portalinvitesent: sentPortals.has(party.id),
          };
        });
        return {
          ...property,
          parties: partiesWithIntakes,
        };
      });
  }, [dealOptionParties, partyIntakes, sentPortals]);

  // If viewing responses for a specific intake
  if (viewingResponsesIntake) {
    return (
      <ClientIntakeResponseViewer
        intake={viewingResponsesIntake}
        onBack={onBackToList}
      />
    );
  }

  // If previewing a specific intake, show the preview view
  if (previewingIntakeData) {
    return (
      <ClientIntakeFormPreview
        intake={previewingIntakeData}
        onBack={onBackToList}
      />
    );
  }

  // If editing a specific intake, show the editor view
  if (selectedIntake) {
    return (
      <div className="h-full overflow-y-auto space-y-4 p-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBackToList}>
            ← Back to list
          </Button>
          <div className="flex items-center gap-2">
            {Object.keys(selectedIntake.party_response || {}).length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePushToForms(selectedIntake.id)}
                disabled={pushingToForms === selectedIntake.id}
              >
                <Database className="h-4 w-4 mr-2" />
                Push to Forms
              </Button>
            )}
          </div>
        </div>

        <Card className="p-4">
          <div className="space-y-2">
            <h4 className="font-medium">{selectedIntake.email}</h4>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {selectedIntake.partyrole_partynumber}
              </Badge>
              {selectedIntake.form_visible && (
                <Badge variant="secondary">Published</Badge>
              )}
            </div>
          </div>
        </Card>

        {Object.keys(selectedIntake.party_response || {}).length > 0 ? (
          <div className="space-y-4">
            <h4 className="font-medium">Submitted Responses</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(selectedIntake.party_response, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <ClientIntakeEditor
            title="Client Intake"
            onLoadItems={async () => selectedIntake.party_intake_form_schema}
            onSaveItems={handleSaveSchema}
            onGetAvailableFormTypes={handleGetAvailableFormTypes}
            onGetSchemaByFormType={async (formType: string) => {
              const schema = await getSchemaByFormType(formType);
              return schema;
            }}
            disabled={selectedIntake.form_visible}
            disabledMessage="This form is published and cannot be edited. Please unpublish it first to make changes."
          />
        )}
      </div>
    );
  }

  // Main list view
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Client Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage client portals and intake forms in one place
          </p>
        </div>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deal Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {allClients.length}
                </div>
                <div className="text-sm text-blue-700">Total Clients</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {allClients.filter((c) => c.portalinvitesent).length}
                </div>
                <div className="text-sm text-green-700">
                  Portal Invites Sent
                </div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {allClients.filter((c) => c.intake?.form_visible).length}
                </div>
                <div className="text-sm text-purple-700">Published Intakes</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {
                    allClients.filter(
                      (c) =>
                        c.intake &&
                        Object.keys(c.intake.party_response || {}).length > 0
                    ).length
                  }
                </div>
                <div className="text-sm text-orange-700">Completed Intakes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Management Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            onSetActiveTab(value as "all" | "yours" | "properties")
          }
          className="w-full"
        >
          <TabsList
            className={`grid w-full ${
              deal.dealSide === "lease" || deal.dealSide === "sell"
                ? "grid-cols-2"
                : "grid-cols-3"
            }`}
          >
            <TabsTrigger value="all">All Parties</TabsTrigger>
            <TabsTrigger value="yours">Your Clients</TabsTrigger>
            {deal.dealSide !== "lease" && deal.dealSide !== "sell" && (
              <TabsTrigger value="properties">
                Property Specific Parties
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {/* All Parties Tab */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    All Parties ({allClients.length})
                  </CardTitle>
                  <Button onClick={handleInviteClient} size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Parties
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingClients || loadingIntakes ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">
                      Loading clients...
                    </span>
                  </div>
                ) : allClients.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Clients Added Yet
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add clients to this deal to manage their portal access and
                      intake forms.
                    </p>
                    <Button onClick={handleInviteClient}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add First Party
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allClients.map((client) => (
                      <Card key={client.id} className="border relative">
                        <CardContent className="p-4">
                          {/* Dropdown Menu */}
                          <div className="absolute top-2 right-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleSendPortalInvitation(client)
                                  }
                                  disabled={sendingPortals.has(client.id)}
                                >
                                  {sendingPortals.has(client.id) ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Sending...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="h-4 w-4 mr-2" />
                                      {client.portalinvitesent
                                        ? "Resend"
                                        : "Send"}{" "}
                                      Portal
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => copyPortalUrl(client.id)}
                                  disabled={copiedPortals.has(client.id)}
                                >
                                  {copiedPortals.has(client.id) ? (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-4 w-4 mr-2" />
                                      Copy Portal Link
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="space-y-4">
                            {/* Client Info */}
                            <div className="flex items-start justify-between pr-10">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">
                                    {client.full_name || client.email}
                                  </h4>
                                  {client.partyrole_partynumber && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {client.partyrole_partynumber}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {client.email}
                                </p>
                                {client.phone_number && (
                                  <p className="text-xs text-muted-foreground">
                                    {client.phone_number}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {client.portalinvitesent && (
                                  <Badge variant="secondary" className="gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Portal Sent
                                  </Badge>
                                )}
                                {client.intake?.form_visible && (
                                  <Badge variant="secondary">
                                    Intake Published
                                  </Badge>
                                )}
                                {client.intake &&
                                  Object.keys(
                                    client.intake.party_response || {}
                                  ).length > 0 && (
                                    <Badge variant="default">
                                      Intake Completed
                                    </Badge>
                                  )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                              {/* Client Intake Form Management Card */}
                              {client.intake && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <FormInput className="h-4 w-4 text-blue-600" />
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-medium text-gray-900">
                                          Client Intake Form
                                        </h4>
                                        <p className="text-xs text-gray-600">
                                          {Object.keys(
                                            client.intake.party_response || {}
                                          ).length > 0
                                            ? "Form completed - view responses"
                                            : "Customize intake questions"}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 justify-end">
                                      {/* Action Button */}
                                      {Object.keys(
                                        client.intake.party_response || {}
                                      ).length > 0 ? (
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() =>
                                            client.intake &&
                                            onViewResponses(client.intake.id)
                                          }
                                        >
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          View Responses
                                        </Button>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() =>
                                            client.intake &&
                                            onEditIntake(client.intake.id)
                                          }
                                        >
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit Intake Form
                                        </Button>
                                      )}

                                      {/* Preview Button */}
                                      {client.intake && (
                                        <ClientIntakePreview
                                          intakeId={client.intake.id}
                                          onPreview={onPreviewIntake}
                                        />
                                      )}

                                      {/* Publish/Unpublish Button */}
                                      {client.intake?.form_visible ? (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            client.intake &&
                                            handleTogglePublish(
                                              client.intake.id,
                                              true
                                            )
                                          }
                                          disabled={
                                            !client.intake ||
                                            publishingIntake ===
                                              client.intake.id
                                          }
                                        >
                                          <Ban className="h-4 w-4 mr-2" />
                                          Unpublish
                                        </Button>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() =>
                                            client.intake &&
                                            handleTogglePublish(
                                              client.intake.id,
                                              false
                                            )
                                          }
                                          disabled={
                                            !client.intake ||
                                            publishingIntake ===
                                              client.intake.id
                                          }
                                        >
                                          <Send className="h-4 w-4 mr-2" />
                                          Publish
                                        </Button>
                                      )}

                                      {/* Push to Forms Button - only show when responses exist */}
                                      {Object.keys(
                                        client.intake.party_response || {}
                                      ).length > 0 && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            client.intake &&
                                            handlePushToForms(client.intake.id)
                                          }
                                          disabled={
                                            pushingToForms === client.intake.id
                                          }
                                        >
                                          {pushingToForms ===
                                          client.intake.id ? (
                                            <>
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                              Pushing...
                                            </>
                                          ) : (
                                            <>
                                              <Database className="h-4 w-4 mr-2" />
                                              Push to Forms
                                            </>
                                          )}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="yours" className="space-y-4">
            {/* Your Clients Tab */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Your Clients ({yourClients.length})
                  </CardTitle>
                  <Button onClick={handleInviteClient} size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Clients
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingClients || loadingIntakes ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">
                      Loading clients...
                    </span>
                  </div>
                ) : yourClients.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Clients Added Yet
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add clients to this deal to manage their portal access and
                      intake forms.
                    </p>
                    <Button onClick={handleInviteClient}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add First Client
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {yourClients.map((client) => (
                      <Card key={client.id} className="border relative">
                        <CardContent className="p-4">
                          {/* Dropdown Menu */}
                          <div className="absolute top-2 right-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleSendPortalInvitation(client)
                                  }
                                  disabled={sendingPortals.has(client.id)}
                                >
                                  {sendingPortals.has(client.id) ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Sending...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="h-4 w-4 mr-2" />
                                      {client.portalinvitesent
                                        ? "Resend"
                                        : "Send"}{" "}
                                      Portal
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => copyPortalUrl(client.id)}
                                  disabled={copiedPortals.has(client.id)}
                                >
                                  {copiedPortals.has(client.id) ? (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-4 w-4 mr-2" />
                                      Copy Portal Link
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="space-y-4">
                            {/* Client Info */}
                            <div className="flex items-start justify-between pr-10">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">
                                    {client.full_name || client.email}
                                  </h4>
                                  {client.partyrole_partynumber && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {client.partyrole_partynumber}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {client.email}
                                </p>
                                {client.phone_number && (
                                  <p className="text-xs text-muted-foreground">
                                    {client.phone_number}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {client.portalinvitesent && (
                                  <Badge variant="secondary" className="gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Portal Sent
                                  </Badge>
                                )}
                                {client.intake?.form_visible && (
                                  <Badge variant="secondary">
                                    Intake Published
                                  </Badge>
                                )}
                                {client.intake &&
                                  Object.keys(
                                    client.intake.party_response || {}
                                  ).length > 0 && (
                                    <Badge variant="default">
                                      Intake Completed
                                    </Badge>
                                  )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                              {/* Client Intake Form Management Card */}
                              {client.intake && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="h-8 w-8 b                                           g-blue-100 rounded-full flex items-center justify-center">
                                        <FormInput className="h-4 w-4 text-blue-600" />
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-medium text-gray-900">
                                          Client Intake Form
                                        </h4>
                                        <p className="text-xs text-gray-600">
                                          {Object.keys(
                                            client.intake.party_response || {}
                                          ).length > 0
                                            ? "Form completed - view responses"
                                            : "Customize intake questions"}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {/* Action Button */}
                                      {Object.keys(
                                        client.intake.party_response || {}
                                      ).length > 0 ? (
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() =>
                                            client.intake &&
                                            onViewResponses(client.intake.id)
                                          }
                                        >
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          View Responses
                                        </Button>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() =>
                                            client.intake &&
                                            onEditIntake(client.intake.id)
                                          }
                                        >
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit Intake Form
                                        </Button>
                                      )}

                                      {/* Preview Button */}
                                      {client.intake && (
                                        <ClientIntakePreview
                                          intakeId={client.intake.id}
                                          onPreview={onPreviewIntake}
                                        />
                                      )}

                                      {/* Publish/Unpublish Button */}
                                      {client.intake?.form_visible ? (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            client.intake &&
                                            handleTogglePublish(
                                              client.intake.id,
                                              true
                                            )
                                          }
                                          disabled={
                                            !client.intake ||
                                            publishingIntake ===
                                              client.intake.id
                                          }
                                        >
                                          <Ban className="h-4 w-4 mr-2" />
                                          Unpublish
                                        </Button>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() =>
                                            client.intake &&
                                            handleTogglePublish(
                                              client.intake.id,
                                              false
                                            )
                                          }
                                          disabled={
                                            !client.intake ||
                                            publishingIntake ===
                                              client.intake.id
                                          }
                                        >
                                          <Send className="h-4 w-4 mr-2" />
                                          Publish
                                        </Button>
                                      )}

                                      {/* Push to Forms Button - only show when responses exist */}
                                      {Object.keys(
                                        client.intake.party_response || {}
                                      ).length > 0 && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            client.intake &&
                                            handlePushToForms(client.intake.id)
                                          }
                                          disabled={
                                            pushingToForms === client.intake.id
                                          }
                                        >
                                          {pushingToForms ===
                                          client.intake.id ? (
                                            <>
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                              Pushing...
                                            </>
                                          ) : (
                                            <>
                                              <Database className="h-4 w-4 mr-2" />
                                              Push to Forms
                                            </>
                                          )}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {deal.dealSide !== "lease" && deal.dealSide !== "sell" && (
            <TabsContent value="properties" className="space-y-4">
              {/* Property Specific Parties Tab */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Property Specific Parties
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Send portal invitations to parties associated with
                      specific properties. These parties will only see
                      information relevant to their assigned property.
                    </p>

                    {/* Property Parties List */}
                    <div className="space-y-6">
                      {loadingClients ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          <span className="ml-2 text-sm text-muted-foreground">
                            Loading property parties...
                          </span>
                        </div>
                      ) : propertyPartiesData.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg">
                          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                          <p className="text-sm text-muted-foreground mb-4">
                            No property parties found.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Add parties to specific properties through the deal
                            management system.
                          </p>
                        </div>
                      ) : (
                        propertyPartiesData.map((property) => (
                          <div
                            key={property.id}
                            className="border rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-lg text-gray-900">
                                {property.address}
                              </h4>
                              <Button
                                onClick={() =>
                                  handleAddPropertyParty(property.id)
                                }
                                size="sm"
                                variant="outline"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Party
                              </Button>
                            </div>

                            {property.parties.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                No parties assigned to this property.
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {property.parties.map((party) => (
                                  <Card key={party.id} className="border">
                                    <CardContent className="p-4">
                                      <div className="space-y-4">
                                        {/* Party Info */}
                                        <div className="flex items-start justify-between">
                                          <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                              <h5 className="font-medium">
                                                {party.full_name}
                                              </h5>
                                              <Badge
                                                variant="outline"
                                                className="text-xs capitalize"
                                              >
                                                {party.party_role.replace(
                                                  "_",
                                                  " "
                                                )}
                                              </Badge>
                                              {party.intake
                                                ?.partyrole_partynumber && (
                                                <Badge
                                                  variant="outline"
                                                  className="text-xs"
                                                >
                                                  {
                                                    party.intake
                                                      ?.partyrole_partynumber
                                                  }
                                                </Badge>
                                              )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                              {party.email}
                                            </p>
                                            {party.phone_number && (
                                              <p className="text-xs text-muted-foreground">
                                                {party.phone_number}
                                              </p>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            {party.portalinvitesent && (
                                              <Badge
                                                variant="secondary"
                                                className="gap-1"
                                              >
                                                <CheckCircle className="h-3 w-3" />
                                                Portal Sent
                                              </Badge>
                                            )}
                                            {party.intake?.form_visible && (
                                              <Badge variant="secondary">
                                                Intake Published
                                              </Badge>
                                            )}
                                            {party.intake &&
                                              Object.keys(
                                                party.intake.party_response ||
                                                  {}
                                              ).length > 0 && (
                                                <Badge variant="default">
                                                  Intake Completed
                                                </Badge>
                                              )}
                                          </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="space-y-3">
                                          {/* Portal Actions Row */}
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-medium text-gray-700 min-w-fit">
                                              Portal:
                                            </span>
                                            <Button
                                              size="sm"
                                              variant={
                                                party.portalinvitesent
                                                  ? "outline"
                                                  : "default"
                                              }
                                              onClick={() =>
                                                sendDealOptionPartyInvitation(
                                                  party
                                                )
                                              }
                                              disabled={
                                                sendingInvitation === party.id
                                              }
                                            >
                                              {sendingInvitation ===
                                              party.id ? (
                                                <>
                                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                  Sending...
                                                </>
                                              ) : (
                                                <>
                                                  <Send className="h-4 w-4 mr-2" />
                                                  {party.portalinvitesent
                                                    ? "Resend"
                                                    : "Send"}{" "}
                                                  Portal
                                                </>
                                              )}
                                            </Button>

                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() =>
                                                copyPortalUrl(party.id)
                                              }
                                              disabled={copiedPortals.has(
                                                party.id
                                              )}
                                            >
                                              {copiedPortals.has(party.id) ? (
                                                <>
                                                  <CheckCircle className="h-4 w-4 mr-2" />
                                                  Copied
                                                </>
                                              ) : (
                                                <>
                                                  <Copy className="h-4 w-4 mr-2" />
                                                  Copy Link
                                                </>
                                              )}
                                            </Button>
                                          </div>

                                          {/* Client Intake Form Management Card */}
                                          {party.intake && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <FormInput className="h-4 w-4 text-blue-600" />
                                                  </div>
                                                  <div>
                                                    <h4 className="text-sm font-medium text-gray-900">
                                                      Client Intake Form
                                                    </h4>
                                                    <p className="text-xs text-gray-600">
                                                      {Object.keys(
                                                        party.intake.party_response ||
                                                          {}
                                                      ).length > 0
                                                        ? "Form completed - view responses"
                                                        : "Customize intake questions"}
                                                    </p>
                                                  </div>
                                                </div>

                                                <div className="flex items-center gap-2 justify-end">
                                                  {/* Action Button */}
                                                  {Object.keys(
                                                    party.intake.party_response ||
                                                      {}
                                                  ).length > 0 ? (
                                                    <Button
                                                      size="sm"
                                                      variant="default"
                                                      onClick={() =>
                                                        party.intake &&
                                                        onViewResponses(
                                                          party.intake.id
                                                        )
                                                      }
                                                    >
                                                      <CheckCircle className="h-4 w-4 mr-2" />
                                                      View Responses
                                                    </Button>
                                                  ) : (
                                                    <Button
                                                      size="sm"
                                                      variant="default"
                                                      onClick={() =>
                                                        party.intake &&
                                                        onEditIntake(
                                                          party.intake.id
                                                        )
                                                      }
                                                    >
                                                      <Edit className="h-4 w-4 mr-2" />
                                                      Edit Intake Form
                                                    </Button>
                                                  )}

                                                  {/* Preview Button */}
                                                  {party.intake && (
                                                    <ClientIntakePreview
                                                      intakeId={party.intake.id}
                                                      onPreview={onPreviewIntake}
                                                    />
                                                  )}

                                                  {/* Publish/Unpublish Button */}
                                                  {party.intake?.form_visible ? (
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() =>
                                                        party.intake &&
                                                        handleTogglePublish(
                                                          party.intake.id,
                                                          true
                                                        )
                                                      }
                                                      disabled={
                                                        !party.intake ||
                                                        publishingIntake ===
                                                          party.intake.id
                                                      }
                                                    >
                                                      <EyeOff className="h-4 w-4 mr-2" />
                                                      Unpublish
                                                    </Button>
                                                  ) : (
                                                    <Button
                                                      size="sm"
                                                      variant="default"
                                                      onClick={() =>
                                                        party.intake &&
                                                        handleTogglePublish(
                                                          party.intake.id,
                                                          false
                                                        )
                                                      }
                                                      disabled={
                                                        !party.intake ||
                                                        publishingIntake ===
                                                          party.intake.id
                                                      }
                                                    >
                                                      <Eye className="h-4 w-4 mr-2" />
                                                      Publish
                                                    </Button>
                                                  )}

                                                  {/* Push to Forms Button - only show when responses exist */}
                                                  {Object.keys(
                                                    party.intake.party_response ||
                                                      {}
                                                  ).length > 0 && (
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() =>
                                                        party.intake &&
                                                        handlePushToForms(
                                                          party.intake.id
                                                        )
                                                      }
                                                      disabled={
                                                        pushingToForms ===
                                                        party.intake.id
                                                      }
                                                    >
                                                      {pushingToForms ===
                                                      party.intake.id ? (
                                                        <>
                                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                          Pushing...
                                                        </>
                                                      ) : (
                                                        <>
                                                          <Database className="h-4 w-4 mr-2" />
                                                          Push to Forms
                                                        </>
                                                      )}
                                                    </Button>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Quick Start Guide */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Client Portal Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Centralized hub for clients to manage documents, sign papers, and complete forms.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">📥


                      
                    </span>
                  </div>
                  <p className="text-sm">
                    View and download completed documents
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-green-600">
                      ✍️
                    </span>
                  </div>
                  <p className="text-sm">
                    Sign documents electronically
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-purple-600">
                      📝
                    </span>
                  </div>
                  <p className="text-sm">Complete intake forms</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FormInput className="h-5 w-5" />
                Client Intake Forms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Forms that help realtors understand clients and auto-fill transaction documents.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">🤝</span>
                  </div>
                  <p className="text-sm">
                    Learn client needs and preferences
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-green-600">
                      ⚡
                    </span>
                  </div>
                  <p className="text-sm">
                    Auto-fill transaction forms
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-purple-600">
                      📋
                    </span>
                  </div>
                  <p className="text-sm">
                    Reduce manual data entry
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security & Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <h4 className="font-medium text-sm">Property Viewing</h4>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <PenTool className="h-5 w-5 text-green-600" />
                </div>
                <h4 className="font-medium text-sm">Digital Signatures</h4>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <h4 className="font-medium text-sm">OTP Security</h4>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="h-5 w-5 text-orange-600" />
                </div>
                <h4 className="font-medium text-sm">ESIGN Compliant</h4>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Client Dialog */}
        <Dialog
          open={showAddClientDialog}
          onOpenChange={setShowAddClientDialog}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Add Clients to Deal
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Validation Error Message */}
              {validationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{validationError}</p>
                </div>
              )}

              {/* Clients List */}
              <div className="space-y-4">
                {newClients.map((party, idx) => (
                  <Card key={idx} className="relative border-gray-200">
                    <CardContent className="p-4">
                      {/* Remove Button */}
                      <div className="absolute top-2 right-2">
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
                        </h5>
                      </div>

                      {/* Client Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Role Select */}
                        <div>
                          <Label className="text-xs">Role</Label>
                          <Select
                            value={party.role}
                            onValueChange={(v) =>
                              updateClientAdding(idx, "role", v)
                            }
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
                                setSuggestionFor(idx);
                                setActiveField("name");
                                setSearchTerm(e.target.value);
                              }}
                              onFocus={(e) => {
                                searchRefs.current[idx] = e.currentTarget
                                  .parentElement as HTMLDivElement;
                                setSuggestionFor(idx);
                                setActiveField("name");
                                if (party.party.full_name) {
                                  setShowClientSuggestions(true);
                                }
                              }}
                              autoComplete="off"
                              autoCorrect="off"
                            />

                            {/* Search Suggestions */}
                            {activeField === "name" &&
                              suggestionFor === idx &&
                              showClientSuggestions &&
                              clientSearchResults.length > 0 && (
                                <div className="absolute left-0 right-0 top-full z-50 mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                  {clientSearchResults.map((result, rIdx) => (
                                    <div
                                      key={rIdx}
                                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                                      onClick={() =>
                                        handleClientSelect(result, idx)
                                      }
                                    >
                                      <div className="font-medium">
                                        {result.full_name}
                                      </div>
                                      <div className="text-xs text-gray-500">
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
                                setSuggestionFor(idx);
                                setActiveField("email");
                                setSearchTerm(e.target.value);
                              }}
                              onFocus={(e) => {
                                searchRefs.current[idx] = e.currentTarget
                                  .parentElement as HTMLDivElement;
                                setSuggestionFor(idx);
                                setActiveField("email");
                                if (party.party.email)
                                  setShowClientSuggestions(true);
                              }}
                              autoComplete="off"
                              autoCorrect="off"
                              className={`${
                                party.party.email.trim() &&
                                (realtorProfile?.email.toLowerCase() ===
                                  party.party.email.trim().toLowerCase() ||
                                  newClients.some(
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
                              newClients.some(
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
                            {activeField === "email" &&
                              suggestionFor === idx &&
                              showClientSuggestions &&
                              clientSearchResults.length > 0 && (
                                <div className="absolute left-0 right-0 top-full z-50 mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                  {clientSearchResults.map((result, rIdx) => (
                                    <div
                                      key={rIdx}
                                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                                      onClick={() =>
                                        handleClientSelect(result, idx)
                                      }
                                    >
                                      <div className="font-medium">
                                        {result.full_name}
                                      </div>
                                      <div className="text-xs text-gray-500">
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

              {/* Add Another Client Button */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={addClient}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Another Client
                </Button>
              </div>

              {/* Dialog Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowAddClientDialog(false)}
                  disabled={isSavingClients}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveNewClients}
                  disabled={!canSaveClients || isSavingClients}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSavingClients ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2" size={16} />
                      Save Clients
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Property-Specific Add Party Dialog */}
        <Dialog
          open={showPropertyPartyDialog}
          onOpenChange={setShowPropertyPartyDialog}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Add Parties to Property
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Property Role Info */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-600">
                  <strong>Deal Type:</strong>{" "}
                  {deal.dealSide === "buy"
                    ? "Buy Deal"
                    : deal.dealSide === "rent"
                    ? "Rent Deal"
                    : deal.dealSide}
                  <br />
                  <strong>Available Roles:</strong>{" "}
                  {propertyRoleOptions
                    .map((role) => role.replace("_", " "))
                    .join(", ")}
                </p>
              </div>

              {/* Validation Error Message */}
              {propertyValidationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">
                    {propertyValidationError}
                  </p>
                </div>
              )}

              {/* Parties List */}
              <div className="space-y-4">
                {propertyParties.map((party, idx) => (
                  <Card key={idx} className="relative border-gray-200">
                    <CardContent className="p-4">
                      {/* Remove Button */}
                      <div className="absolute top-2 right-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePropertyParty(idx)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>

                      {/* Party Header */}
                      <div className="mb-3">
                        <h5 className="text-sm font-semibold capitalize">
                          {party.role.replace("_", " ")} {party.partyNumber}
                        </h5>
                      </div>

                      {/* Party Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Role Select */}
                        <div>
                          <Label className="text-xs">Role</Label>
                          <Select
                            value={party.role}
                            onValueChange={(v) =>
                              updatePropertyParty(idx, "role", v)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              {propertyRoleOptions.map((opt) => (
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
                              if (propertyActiveField === "name")
                                propertySearchRefs.current[idx] = el;
                            }}
                          >
                            <Input
                              placeholder="John Doe"
                              value={party.party.full_name}
                              onChange={(e) => {
                                updatePropertyParty(
                                  idx,
                                  "full_name",
                                  e.target.value
                                );
                                setPropertySuggestionFor(idx);
                                setPropertyActiveField("name");
                                setPropertySearchTerm(e.target.value);
                              }}
                              onFocus={(e) => {
                                propertySearchRefs.current[idx] = e
                                  .currentTarget
                                  .parentElement as HTMLDivElement;
                                setPropertySuggestionFor(idx);
                                setPropertyActiveField("name");
                                if (party.party.full_name) {
                                  setShowPropertySuggestions(true);
                                }
                              }}
                              autoComplete="off"
                              autoCorrect="off"
                            />

                            {/* Search Suggestions */}
                            {propertyActiveField === "name" &&
                              propertySuggestionFor === idx &&
                              showPropertySuggestions &&
                              propertySearchResults.length > 0 && (
                                <div className="absolute left-0 right-0 top-full z-50 mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                  {propertySearchResults.map((result, rIdx) => (
                                    <div
                                      key={rIdx}
                                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                                      onClick={() =>
                                        handlePropertyPartySelect(result, idx)
                                      }
                                    >
                                      <div className="font-medium">
                                        {result.full_name}
                                      </div>
                                      <div className="text-xs text-gray-500">
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
                              if (propertyActiveField === "email")
                                propertySearchRefs.current[idx] = el;
                            }}
                          >
                            <Input
                              placeholder="party@example.com"
                              value={party.party.email}
                              onChange={(e) => {
                                updatePropertyParty(
                                  idx,
                                  "email",
                                  e.target.value
                                );
                                setPropertySuggestionFor(idx);
                                setPropertyActiveField("email");
                                setPropertySearchTerm(e.target.value);
                              }}
                              onFocus={(e) => {
                                propertySearchRefs.current[idx] = e
                                  .currentTarget
                                  .parentElement as HTMLDivElement;
                                setPropertySuggestionFor(idx);
                                setPropertyActiveField("email");
                                if (party.party.email)
                                  setShowPropertySuggestions(true);
                              }}
                              autoComplete="off"
                              autoCorrect="off"
                              className={`${
                                party.party.email.trim() &&
                                (realtorProfile?.email.toLowerCase() ===
                                  party.party.email.trim().toLowerCase() ||
                                  propertyParties.some(
                                    (p, pIdx) =>
                                      pIdx !== idx &&
                                      p.party.email.trim().toLowerCase() ===
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
                              propertyParties.some(
                                (p, pIdx) =>
                                  pIdx !== idx &&
                                  p.party.email.trim().toLowerCase() ===
                                    party.party.email.trim().toLowerCase()
                              ) && (
                                <div className="absolute left-0 right-0 top-full z-50 mt-1 bg-red-50 border border-red-200 rounded-md p-2">
                                  <p className="text-xs text-red-600">
                                    Duplicate email address
                                  </p>
                                </div>
                              )}

                            {/* Email Search Suggestions */}
                            {propertyActiveField === "email" &&
                              propertySuggestionFor === idx &&
                              showPropertySuggestions &&
                              propertySearchResults.length > 0 && (
                                <div className="absolute left-0 right-0 top-full z-50 mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                  {propertySearchResults.map((result, rIdx) => (
                                    <div
                                      key={rIdx}
                                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                                      onClick={() =>
                                        handlePropertyPartySelect(result, idx)
                                      }
                                    >
                                      <div className="font-medium">
                                        {result.full_name}
                                      </div>
                                      <div className="text-xs text-gray-500">
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

              {/* Add Another Party Button */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={addPropertyParty}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Another Party
                </Button>
              </div>

              {/* Dialog Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowPropertyPartyDialog(false)}
                  disabled={isSavingPropertyParties}
                >
                  Cancel
                </Button>
                <Button
                  onClick={savePropertyParties}
                  disabled={!canSavePropertyParties || isSavingPropertyParties}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSavingPropertyParties ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2" size={16} />
                      Save Parties
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Publish Intake Dialog */}
        <PublishIntakeDialog
          isOpen={showPublishDialog}
          onClose={handleClosePublishDialog}
          intake={intakeToPublish}
          onConfirmPublish={handleConfirmPublish}
          isPublishing={publishingIntake === intakeToPublish?.id}
        />
      </div>
    </div>
  );
}
