"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useTransition,
} from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  ArrowLeft,
  Users,
  Mail,
  Plus,
  Edit,
  FileText,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  CheckCircle,
  Trash2,
  Save,
  Info,
  Send,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Fuse from "fuse.js";
import { debounce } from "lodash";
import { Party, Profile } from "@/components/files/types/realtor";
import { getAllParties } from "@/app/actions/realtor/client-actions";
import { createDealPartyRow } from "@/app/actions/realtor/dealClient-actions";
import { getProfile } from "@/app/actions/realtor/profile-actions";

import {
  getClientIntakesByDealId,
  getClientIntakeById,
  saveClientIntakeSchema,
  generateClientIntakeLink,
  revokeClientIntakeLink,
  pushPartyIntakeAnswersToForms,
} from "@/app/actions/realtor/client-intake-actions";
import { getSchemaByFormType } from "@/app/actions/realtor/schema";
import { getAvailableFormsFromDealId } from "@/app/actions/realtor/form-actions";

import {
  PartyIntake,
  PartyIntakeSchemaItem,
  SchemaItem,
} from "@/components/files/types/realtor";
import { ClientIntakeEditor } from "../../templates/modify/client-intake/[clientIntakeTemplateId]/components";
import ClientIntakeResponseViewer from "@/components/files/realtor/ClientIntakeResponseViewer";

interface ClientIntakeSectionProps {
  dealId: string;
  selectedClientIntakeId?: string;
  onEditClientIntake: (clientIntakeId: string) => void;
  onBack?: () => void;
  dealSide: string;
}

// Loading skeleton component
const ClientIntakeEditorSkeleton = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Header skeleton */}
      <div className="border-b bg-white p-4">
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
          <div className="flex items-center gap-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 p-6">
        <Card className="w-full max-w-7xl">
          <CardHeader className="text-center">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-96 mx-auto"></div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-12 gap-6">
              {/* Left sidebar skeleton */}
              <div className="col-span-3">
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-32 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-28 mb-6"></div>

                  {/* Form elements skeleton */}
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="bg-white rounded-lg p-3 border border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main canvas skeleton */}
              <div className="col-span-9">
                <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300 min-h-[600px]">
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-40 mb-4"></div>

                  {/* Form section skeleton */}
                  <div className="bg-blue-50 rounded-lg border-2 border-dashed border-blue-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-200 rounded animate-pulse"></div>
                        <div className="h-5 bg-blue-200 rounded animate-pulse w-32"></div>
                        <div className="h-4 bg-blue-200 rounded animate-pulse w-16 px-2 py-1"></div>
                      </div>
                      <div className="h-4 bg-blue-200 rounded animate-pulse w-16"></div>
                    </div>

                    <div className="space-y-6">
                      {/* Text field skeleton */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="h-5 bg-gray-200 rounded animate-pulse w-24"></div>
                          <div className="flex gap-2">
                            <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                            <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                            <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        </div>
                        <div className="h-10 bg-gray-100 rounded border animate-pulse"></div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ClientIntakeSection: React.FC<ClientIntakeSectionProps> = ({
  dealId,
  selectedClientIntakeId,
  onEditClientIntake,
  onBack,
  dealSide,
}) => {
  const [clientIntakes, setClientIntakes] = useState<PartyIntake[]>([]);
  const [selectedIntake, setSelectedIntake] = useState<PartyIntake | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEditor, setIsLoadingEditor] = useState(false);
  const [viewingResponsesIntake, setViewingResponsesIntake] =
    useState<PartyIntake | null>(null);

  // Client management state
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
  const [copiedIntakeId, setCopiedIntakeId] = useState<string | null>(null);
  const [pushingIntakeId, setPushingIntakeId] = useState<string | null>(null);

  useEffect(() => {
    loadClientIntakes();
    loadRealtorProfile();
    loadAllParties();
  }, [dealId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedClientIntakeId) {
      loadSelectedIntake(selectedClientIntakeId);
    }
  }, [selectedClientIntakeId]);

  const loadClientIntakes = async () => {
    setIsLoading(true);
    try {
      const intakes = await getClientIntakesByDealId(dealId);
      setClientIntakes(intakes);
    } catch (error) {
      console.error("Error loading client intakes:", error);
      toast.error("Failed to load client intakes");
    } finally {
      setIsLoading(false);
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

  const loadSelectedIntake = async (intakeId: string) => {
    setIsLoadingEditor(true);
    try {
      const intake = await getClientIntakeById(intakeId);
      setSelectedIntake(intake);
    } catch (error) {
      console.error("Error loading client intake:", error);
      toast.error("Failed to load client intake");
    } finally {
      setIsLoadingEditor(false);
    }
  };

  // Client intake editor functions
  const getInitialSchema = async (): Promise<PartyIntakeSchemaItem[]> => {
    if (!selectedIntake) return [];
    return selectedIntake.party_intake_form_schema;
  };

  const handleSaveSchema = async (
    clientIntakeSchema: PartyIntakeSchemaItem[]
  ): Promise<void> => {
    if (!selectedIntake) return;
    await saveClientIntakeSchema(clientIntakeSchema, selectedIntake.id);
  };

  const handleGetSchemaByFormType = async (
    formType: string
  ): Promise<SchemaItem[]> => {
    const schema = await getSchemaByFormType(formType);
    return schema;
  };

  const handleGetAvailableFormTypes = async (): Promise<string[]> => {
    const formTypes = await getAvailableFormsFromDealId(dealId);
    // Convert both deal_wide and property_specific results to plain string arrays before concatenation
    const availableFormTypes = [
      ...formTypes.deal_wide.map((f) => f.formType),
      ...(formTypes.property_specific?.map((f) => f.formType) || []),
    ];
    // Remove duplicates using Set
    return [...new Set(availableFormTypes)];
  };

  // Form publishing handlers
  const handlePublishForm = async (intakeId: string) => {
    try {
      await generateClientIntakeLink(intakeId);
      toast.success("Form published successfully");
      loadClientIntakes(); // Refresh the list
    } catch (error) {
      console.error("Error publishing form:", error);
      toast.error("Failed to publish form");
    }
  };

  const handleUnpublishForm = async (intakeId: string) => {
    try {
      await revokeClientIntakeLink(intakeId);
      toast.success("Form unpublished successfully");
      loadClientIntakes(); // Refresh the list
    } catch (error) {
      console.error("Error unpublishing form:", error);
      toast.error("Failed to unpublish form");
    }
  };

  const handlePushToForms = async (intakeId: string) => {
     //forpush

    // Find the intake being pushed
    const intake = clientIntakes.find((i: PartyIntake) => i.id === intakeId);

    if (intake?.party_response) {
    }

    if (intake?.party_intake_form_schema) {
      const mappings = intake.party_intake_form_schema.filter(
        (item) => item.mapping?.length && item.mapping.length > 0
      );
    }

    setPushingIntakeId(intakeId);
    try {
      const result = await pushPartyIntakeAnswersToForms(intakeId);

      // Handle the new response format
      if (result.success) {
        toast.success(result.message || "Successfully pushed answers to forms");
      } else {
        toast.error(result.message || "Failed to push answers to forms");
      }
    } catch (error) {
      console.error("[PUSH BUTTON] Error pushing to forms:", error);
      toast.error("Failed to push answers to forms");
    } finally {
      setPushingIntakeId(null);
    }
  };

  const generatePortalLink = (intake: PartyIntake) => {

    // Ensure party_id is a string, not an object
    const clientId: string = intake.party_id;

    // Final validation of the extracted clientId
    if (
      !clientId ||
      clientId.trim() === "" ||
      clientId === "undefined" ||
      clientId === "null"
    ) {
      console.error("Final clientId validation failed:", clientId);
      throw new Error(
        "Empty or invalid clientId - cannot generate portal link"
      );
    }

    return `${window.location.origin}/client-portal/${dealId}/${clientId}`;
  };

  const copyPortalLink = async (intake: PartyIntake) => {
    try {
      const link = generatePortalLink(intake);

      // Try to use the modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = link;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }

      // Set the copied state for visual feedback
      setCopiedIntakeId(intake.id);

      // Show success toast
      toast.success("Portal link copied to clipboard");

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedIntakeId(null);
      }, 2000);
    } catch (error) {
      console.error("Error copying portal link:", error);
      toast.error("Failed to copy portal link. Please try again.");
    }
  };

  // Client management functions
  const getDefaultClientRole = (ds: string) =>
    ds === "sell"
      ? "seller"
      : ds === "buy"
      ? "buyer"
      : ds === "lease"
      ? "landlord"
      : "tenant";

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

  const addClient = () =>
    setNewClients((prev) =>
      calculateClientNumbers([
        ...prev,
        {
          party: { full_name: "", email: "" },
          role: getDefaultClientRole(dealSide) as
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
        dealId,
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
      loadClientIntakes(); // Refresh the list
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

  // If viewing responses for a specific intake
  if (viewingResponsesIntake) {
    return (
      <ClientIntakeResponseViewer
        intake={viewingResponsesIntake}
        onBack={() => setViewingResponsesIntake(null)}
      />
    );
  }

  // If loading selected intake for editing
  if (selectedClientIntakeId && isLoadingEditor) {
    return <ClientIntakeEditorSkeleton />;
  }

  // If editing a specific client intake
  if (selectedClientIntakeId && selectedIntake) {
    return (
      <div className="space-y-6 h-full">
        {/* Header with back button */}
        <div className="border-b bg-white p-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button variant="outline" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold">Edit Client Intake</h1>
              <p className="text-gray-600">
                Editing intake for {selectedIntake.email}
              </p>
            </div>
          </div>
        </div>

        {/* Client Intake Editor */}
        <ClientIntakeEditor
          title="Client Intake"
          onLoadItems={getInitialSchema}
          onSaveItems={handleSaveSchema}
          onGetAvailableFormTypes={handleGetAvailableFormTypes}
          onGetSchemaByFormType={handleGetSchemaByFormType}
          disabled={selectedIntake?.form_visible}
          disabledMessage="This form is published and cannot be edited. Please unpublish it first to make changes."
        />
      </div>
    );
  }

  // Default view: Client Intakes List
  return (
    <div className="space-y-6 p-6 h-full overflow-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Intakes</h1>
          <p className="text-gray-600 mt-1">
            Manage client intake forms and collect client information
          </p>
        </div>

        {/* Inline invite client functionality */}
        <div className="flex items-center gap-3">
          <Button onClick={handleInviteClient}>
            <Plus className="h-4 w-4 mr-2" />
            Invite Client
          </Button>
        </div>
      </div>

      {/* Client Intakes Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Client Intakes Overview</h2>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : clientIntakes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Client Intakes Yet
              </h3>
              <p className="text-gray-500 mb-6">
                Create client intake forms to collect information from your
                clients.
              </p>
              <Button onClick={handleInviteClient}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Client Intake
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {clientIntakes.map((intake) => (
                <Card key={intake.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {intake.email}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Role: {intake.partyrole_partynumber} • Created{" "}
                            {new Date(
                              intake.created_at || ""
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Completion Status */}
                        {intake.party_response &&
                        Object.keys(intake.party_response).length > 0 ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            Completed
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                            Pending
                          </span>
                        )}

                        {/* Publication Status */}
                        {intake.form_visible ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            Published
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                            Not Published
                          </span>
                        )}

                        {/* View Responses Button */}
                        {intake.party_response &&
                          Object.keys(intake.party_response).length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingResponsesIntake(intake)}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              View Responses
                            </Button>
                          )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditClientIntake(intake.id)}
                          disabled={intake.form_visible}
                          title={
                            intake.form_visible
                              ? "Cannot edit published forms"
                              : "Edit intake form"
                          }
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>

                    {/* Warning message for published forms */}
                    {intake.form_visible && (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-xs text-yellow-800 flex items-center">
                          <Info className="w-3 h-3 mr-1" />
                          Published forms cannot be edited. Unpublish the form
                          to make changes.
                        </p>
                      </div>
                    )}

                    {/* Publication Controls */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {intake.form_visible ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnpublishForm(intake.id)}
                              >
                                <EyeOff className="w-4 h-4 mr-2" />
                                Unpublish
                              </Button>
                              {intake.party_response &&
                                Object.keys(intake.party_response).length >
                                  0 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePushToForms(intake.id)}
                                    disabled={pushingIntakeId === intake.id}
                                    className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                  >
                                    {pushingIntakeId === intake.id ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Pushing...
                                      </>
                                    ) : (
                                      <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Push to Forms
                                      </>
                                    )}
                                  </Button>
                                )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyPortalLink(intake)}
                                disabled={copiedIntakeId === intake.id}
                                className={
                                  copiedIntakeId === intake.id
                                    ? "bg-green-50 border-green-200 text-green-700"
                                    : ""
                                }
                              >
                                {copiedIntakeId === intake.id ? (
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                ) : (
                                  <Copy className="w-4 h-4 mr-2" />
                                )}
                                {copiedIntakeId === intake.id
                                  ? "Copied!"
                                  : "Copy Portal Link"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  try {
                                    const link = generatePortalLink(intake);
                                    window.open(link, "_blank");
                                  } catch (error) {
                                    console.error(
                                      "Error generating portal link:",
                                      error
                                    );
                                    toast.error(
                                      "Failed to generate portal link. Please check the console for details."
                                    );
                                  }
                                }}
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Open Portal
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handlePublishForm(intake.id)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Publish Form
                            </Button>
                          )}
                        </div>

                        {intake.form_visible && (
                          <p className="text-xs text-gray-500">
                            Client can access at: /client-portal/{dealId}/
                            {intake.party_id}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Preview of form schema */}
                    {intake.party_intake_form_schema &&
                      intake.party_intake_form_schema.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-sm text-gray-600 mb-2">
                            Form contains{" "}
                            {intake.party_intake_form_schema.length} sections:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {intake.party_intake_form_schema
                              .slice(0, 3)
                              .map((section, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                >
                                  {section.display_attributes.display_name ||
                                    `Section ${index + 1}`}
                                </span>
                              ))}
                            {intake.party_intake_form_schema.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                +{intake.party_intake_form_schema.length - 3}{" "}
                                more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How Client Intakes Work */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">How Client Intakes Work</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-medium mb-2">1. Create Intake</h4>
              <p className="text-sm text-gray-600">
                Set up custom intake forms with the information you need from
                clients
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-medium mb-2">2. Publish & Share</h4>
              <p className="text-sm text-gray-600">
                Publish forms and share client portal links for secure access
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-medium mb-2">3. Collect Responses</h4>
              <p className="text-sm text-gray-600">
                Review completed responses and use the data for your deal
                workflow
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Client Dialog */}
      <Dialog open={showAddClientDialog} onOpenChange={setShowAddClientDialog}>
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
                              updateClientAdding(idx, "email", e.target.value);
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
    </div>
  );
};

export default ClientIntakeSection;
