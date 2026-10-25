"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Globe,
  Shield,
  FileText,
  PenTool,
  Loader2,
  Send,
  Users,
  Copy,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { getDealClients } from "@/app/actions/realtor/deal-actions";
import { getAllDealOptionsWithParties } from "@/app/actions/realtor/dealClient-actions";
import { sendPortalInvitation } from "@/app/actions/realtor/invitation-actions";

interface ExistingClient {
  id: string;
  email: string;
  full_name: string;
  phone_number: string;
  current_transaction_status: string;
  created_at: string;
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

interface PortalSectionProps {
  dealId: string;
}

const PortalSection: React.FC<PortalSectionProps> = ({ dealId }) => {
  const [existingClients, setExistingClients] = useState<ExistingClient[]>([]);
  const [dealOptionParties, setDealOptionParties] = useState<
    DealOptionWithParties[]
  >([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [sendingInvitation, setSendingInvitation] = useState<string | null>(
    null
  );
  const [sentPortals, setSentPortals] = useState<Set<string>>(new Set());
  const [copiedLinks, setCopiedLinks] = useState<Set<string>>(new Set());
  const [portalUrls, setPortalUrls] = useState<Map<string, string>>(new Map());

  const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL;

  const loadExistingClients = useCallback(async () => {
    setLoadingClients(true);
    try {
      const [clients, dealOptionsWithParties] = await Promise.all([
        getDealClients(dealId),
        getAllDealOptionsWithParties(dealId),
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
  }, [dealId]);

  useEffect(() => {
    loadExistingClients();
  }, [loadExistingClients]);

  const handleSendPortalInvitation = async (client: ExistingClient) => {
    setSendingInvitation(client.id);

    try {
      const result = await sendPortalInvitation({
        dealId: dealId,
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

        // Try to use the modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(result.portalUrl);
        } else {
          // Fallback for older browsers or non-secure contexts
          const textArea = document.createElement("textarea");
          textArea.value = result.portalUrl;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand("copy");
          textArea.remove();
        }

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

  const sendDealOptionPartyInvitation = async (
    party: DealOptionWithParties["parties"][0],
    dealOptionId: string
  ) => {
    setSendingInvitation(party.id);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("No access token available");
      }

      const response = await fetch(
        `${API_BASE_URL}/realtor/deals/${dealId}/invite-client`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clientEmail: party.email,
            clientName: party.full_name,
            clientRole: party.party_role,
            isExistingClient: true,
            clientId: party.id,
            dealOptionId: dealOptionId,
            realtorName: "Your OnRoad Realtor",
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send invitation");
      }

      const result = await response.json();

      toast.success(`Portal invitation sent to ${party.email}`);
      setSentPortals((prev) => new Set(prev).add(party.id));

      // Copy portal URL to clipboard
      if (result.portalUrl) {
        // Try to use the modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(result.portalUrl);
        } else {
          // Fallback for older browsers or non-secure contexts
          const textArea = document.createElement("textarea");
          textArea.value = result.portalUrl;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand("copy");
          textArea.remove();
        }

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
    const url = portalUrls.get(clientId);
    if (url) {
      try {
        // Try to use the modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(url);
        } else {
          // Fallback for older browsers or non-secure contexts
          const textArea = document.createElement("textarea");
          textArea.value = url;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand("copy");
          textArea.remove();
        }

        setCopiedLinks((prev) => new Set([...prev, clientId]));
        toast.success("Portal URL copied to clipboard!");
        setTimeout(() => {
          setCopiedLinks((prev) => {
            const newSet = new Set(prev);
            newSet.delete(clientId);
            return newSet;
          });
        }, 2000);
      } catch (error) {
        console.error("Error copying portal URL:", error);
        toast.error("Failed to copy URL. Please try again.");
      }
    }
  };

  return (
    <div className="space-y-6 p-6 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Client Portal Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage client portal access and invitations for this deal
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default">Active</Badge>
        </div>
      </div>

      {/* Client Portal Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            What is the Client Portal?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            The Client Portal provides your clients with secure, 24-hour access
            to view deal information, complete forms, and digitally sign
            documents. Perfect for busy schedules and remote collaboration.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">View Deal Options</h4>
                <p className="text-sm text-muted-foreground">
                  Clients can browse all property options with detailed
                  information
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <PenTool className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium">Complete Forms</h4>
                <p className="text-sm text-muted-foreground">
                  Fill out intake forms and required documentation online
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <PenTool className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium">Digital Signatures</h4>
                <p className="text-sm text-muted-foreground">
                  Sign documents electronically with full legal compliance
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Shield className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-medium">Secure Access</h4>
                <p className="text-sm text-muted-foreground">
                  OTP verification and secure JWT tokens protect client data
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Portal Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Client Portal Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Manage portal access for your clients. Send secure invitations
              that allow them to view deal options, complete forms, and sign
              documents online.
            </p>

            {/* Existing Clients List */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Deal Clients</h4>

              {loadingClients ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Loading clients...
                  </span>
                </div>
              ) : existingClients.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No clients added to this deal yet.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Clients must be added through the deal management system.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {existingClients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium">{client.full_name}</h5>
                          {sentPortals.has(client.id) && (
                            <Badge variant="secondary" className="text-xs">
                              Portal Sent
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
                        <Button
                          onClick={() => handleSendPortalInvitation(client)}
                          disabled={sendingInvitation === client.id}
                          size="sm"
                          variant={
                            sentPortals.has(client.id) ? "outline" : "default"
                          }
                        >
                          {sendingInvitation === client.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              {sentPortals.has(client.id)
                                ? "Resend Portal"
                                : "Send Portal"}
                            </>
                          )}
                        </Button>
                        {portalUrls.has(client.id) && (
                          <Button
                            onClick={() => copyPortalUrl(client.id)}
                            size="sm"
                            variant="outline"
                            disabled={copiedLinks.has(client.id)}
                            className={
                              copiedLinks.has(client.id)
                                ? "bg-green-50 border-green-200 text-green-700"
                                : ""
                            }
                            title="Copy portal link"
                          >
                            {copiedLinks.has(client.id) ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-1" />
                                Copy Link
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* How it works info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                How the portal works:
              </h4>
              <ol className="text-xs text-blue-800 space-y-1 ml-4 list-decimal">
                <li>
                  Client receives invitation email with secure portal link
                </li>
                <li>Client enters their email address on the portal page</li>
                <li>System sends OTP verification code to their email</li>
                <li>Client enters code and gains 24-hour access to portal</li>
                <li>
                  Client can view properties, complete forms, and sign documents
                </li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deal Option Parties Portal Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Deal Option Parties Portal Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Send portal invitations to parties associated with specific
              properties. These parties will only see information relevant to
              their assigned property.
            </p>

            {/* Deal Option Parties List */}
            <div className="space-y-6">
              {loadingClients ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Loading deal option parties...
                  </span>
                </div>
              ) : dealOptionParties.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No deal option parties found.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Add parties to specific properties through the deal
                    management system.
                  </p>
                </div>
              ) : (
                dealOptionParties.map((dealOption) => (
                  <div key={dealOption.id} className="border rounded-lg p-4">
                    <h4 className="font-medium text-lg mb-3 text-gray-900">
                      {dealOption.address}
                    </h4>

                    {dealOption.parties.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No parties assigned to this property.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {dealOption.parties.map((party) => (
                          <div
                            key={party.id}
                            className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h5 className="font-medium">
                                  {party.full_name}
                                </h5>
                                <Badge
                                  variant="outline"
                                  className="text-xs capitalize"
                                >
                                  {party.party_role.replace("_", " ")}
                                </Badge>
                                {sentPortals.has(party.id) && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Portal Sent
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
                              <Button
                                onClick={() =>
                                  sendDealOptionPartyInvitation(
                                    party,
                                    dealOption.id
                                  )
                                }
                                disabled={sendingInvitation === party.id}
                                size="sm"
                                variant={
                                  sentPortals.has(party.id)
                                    ? "outline"
                                    : "default"
                                }
                              >
                                {sendingInvitation === party.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <Send className="h-4 w-4 mr-2" />
                                    {sentPortals.has(party.id)
                                      ? "Resend Portal"
                                      : "Send Portal"}
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
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

      {/* Portal Security Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">Security Features</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Email-based OTP verification</li>
                <li>• 24-hour session timeouts</li>
                <li>• Encrypted data transmission</li>
                <li>• Secure document storage</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Compliance</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• ESIGN Act compliant signatures</li>
                <li>• Audit trail for all actions</li>
                <li>• Document integrity verification</li>
                <li>• Legal admissibility standards</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortalSection;
