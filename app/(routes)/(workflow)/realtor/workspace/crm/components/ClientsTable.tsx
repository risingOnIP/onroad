import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type {
  Party,
  Deal,
  Deals_Parties,
} from "@/components/files/types/realtor";
import ClientForm from "./ClientForm";
import EmailForm from "./EmailForm";
import PhoneForm from "./PhoneForm";
import NotesForm from "./NotesForm";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import Fuse from "fuse.js";
import Link from "next/link";
import { sendDealsToClients } from "@/app/actions/realtor/deal-actions";

interface ClientsTableProps {
  clients: Party[];
  dealClients: Deals_Parties[];
  deals: Deal[];
  loading: boolean;
  realtorName: string;
  onAdd: (client: Omit<Party, "id" | "realtor_id" | "created_at">) => void;
  onEditFormSaved: (client: Party) => void;
}

export default function ClientsTable({
  clients,
  dealClients,
  deals,
  loading,
  realtorName,
  onAdd,
  onEditFormSaved,
}: ClientsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<
    "full" | "phone" | "notes" | "email"
  >("full");
  const [editingClient, setEditingClient] = useState<Party | null>(null);

  // Send Deal Modal state
  const [sendDealModalOpen, setSendDealModalOpen] = useState(false);
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [sendingDeals, setSendingDeals] = useState(false);

  // Setup Fuse instance for fuzzy search
  const fuse = useMemo(
    () =>
      new Fuse(clients, {
        keys: ["full_name", "email", "phone_number", "notes"],
        threshold: 0.3,
      }),
    [clients]
  );

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;
    return fuse.search(searchQuery).map((result) => result.item);
  }, [clients, searchQuery, fuse]);

  // NOTE: prospective flag removed from Party. We now treat all clients equally in the Send Deal modal.

  // Get selling and leasing deals for the Send Deal modal
  const sellingAndLeasingDeals = useMemo(
    () =>
      deals.filter(
        (deal) => deal.dealSide === "sell" || deal.dealSide === "lease"
      ),
    [deals]
  );

  /** Dialog helpers **/
  const openAddClient = () => {
    setEditingClient(null);
    setDialogType("full");
    setDialogOpen(true);
  };

  const openFullForm = (client: Party | null = null) => {
    setEditingClient(client);
    setDialogType("full");
    setDialogOpen(true);
  };
  const openPhoneForm = (client: Party) => {
    setEditingClient(client);
    setDialogType("phone");
    setDialogOpen(true);
  };
  const openNotesForm = (client: Party) => {
    setEditingClient(client);
    setDialogType("notes");
    setDialogOpen(true);
  };
  const openEmailForm = (client: Party) => {
    setEditingClient(client);
    setDialogType("email");
    setDialogOpen(true);
  };

  const handleSubmit = (data: Partial<Party>) => {
    if (!editingClient) return;
    const updated = { ...editingClient, ...data };
    onEditFormSaved(updated);
    setDialogOpen(false);
    setEditingClient(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEditingClient(null);
    }
    setDialogOpen(open);
  };

  const handleSendDealModalClose = (open: boolean) => {
    if (!open) {
      // Reset state when modal closes
      setSelectedDeals([]);
      setSelectedClients([]);
      setSendingDeals(false);
    }
    setSendDealModalOpen(open);
  };

  const handleClientSave = (
    data: Omit<Party, "id" | "realtor_id" | "created_at">
  ) => {
    if (!editingClient) {
      onAdd(data);
    } else {
      onEditFormSaved({ ...editingClient, ...data });
    }
    setDialogOpen(false);
    setEditingClient(null);
  };

  // Map each status to appropriate background/text color classes
  const statusColors: Record<Party["current_transaction_status"], string> = {
    lead: "bg-blue-100 text-blue-800",
    searching: "bg-yellow-100 text-yellow-800",
    under_contract: "bg-orange-100 text-orange-800",
    closed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  // Handler for when the status dropdown changes
  const handleStatusChange = (
    client: Party,
    status: Party["current_transaction_status"]
  ) => {
    onEditFormSaved({ ...client, current_transaction_status: status });
  };

  // Send Deal Modal helpers
  const handleDealSelection = (dealId: string, checked: boolean) => {
    setSelectedDeals((prev) =>
      checked ? [...prev, dealId] : prev.filter((id) => id !== dealId)
    );
  };

  const handleClientSelection = (clientId: string, checked: boolean) => {
    setSelectedClients((prev) =>
      checked ? [...prev, clientId] : prev.filter((id) => id !== clientId)
    );
  };

  const handleSendDeals = async () => {
    if (selectedDeals.length === 0 || selectedClients.length === 0) return;

    setSendingDeals(true);
    try {
      // Get email addresses from selected clients
      const selectedClientObjects = clients.filter((client) =>
        selectedClients.includes(client.id)
      );
      const emailAddresses = selectedClientObjects
        .map((client) => client.email)
        .filter((email) => email && email.trim() !== ""); // Filter out empty emails

      if (emailAddresses.length === 0) {
        alert("No valid email addresses found for selected clients.");
        return;
      }

      // Send deals to clients
      await sendDealsToClients(selectedDeals, emailAddresses, realtorName);

      // Success feedback
      alert(
        `Successfully sent ${selectedDeals.length} deal(s) to ${emailAddresses.length} client(s)!`
      );

      // Reset selections and close modal
      setSelectedDeals([]);
      setSelectedClients([]);
      setSendDealModalOpen(false);
    } catch (error) {
      console.error("Error sending deals:", error);
      alert("Failed to send deals. Please try again.");
    } finally {
      setSendingDeals(false);
    }
  };

  /** Render a single skeleton row **/
  const renderSkeletonRow = (key: number) => (
    <TableRow key={key} className={key % 2 === 0 ? "bg-white" : "bg-gray-50"}>
      <TableCell>
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
      </TableCell>
      <TableCell>
        <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
      </TableCell>
      <TableCell>
        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
      </TableCell>
      <TableCell>
        <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
      </TableCell>
      <TableCell className="py-4">
        <div className="h-6 bg-gray-200 rounded w-full animate-pulse" />
      </TableCell>
      <TableCell>
        <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
      </TableCell>
      <TableCell>
        <div className="flex flex-row gap-2">
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
      </TableCell>
      <TableCell>
        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
      </TableCell>
    </TableRow>
  );

  return (
    <div>
      {/* Search and Add Client Section */}
      <div className="flex justify-between items-center mb-4">
        <div className="w-1/3">
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={openAddClient}>
            + Add Client
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // Default to selecting all clients
              setSelectedClients(clients.map((client) => client.id));
              setSendDealModalOpen(true);
            }}
          >
            Send Deal
          </Button>
        </div>
      </div>

      {/* Dialog for forms */}
      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {dialogType === "full"
                ? editingClient
                  ? "Edit Client"
                  : "New Client"
                : dialogType === "phone"
                ? "Add Phone"
                : dialogType === "notes"
                ? "Add Notes"
                : "Add Email"}
            </DialogTitle>
            <DialogDescription>
              {dialogType === "full"
                ? editingClient
                  ? "Update client info."
                  : "Fill out client details."
                : dialogType === "phone"
                ? "Enter phone number."
                : dialogType === "notes"
                ? "Enter notes."
                : "Enter email address."}
            </DialogDescription>
          </DialogHeader>

          {dialogType === "full" && (
            <ClientForm
              initial={editingClient ?? undefined}
              onSave={handleClientSave}
              onCancel={() => {
                setDialogOpen(false);
                setEditingClient(null);
              }}
            />
          )}

          {dialogType === "phone" && editingClient && (
            <PhoneForm
              initialPhone={editingClient.phone_number || ""}
              onSave={(phone: string) => handleSubmit({ phone_number: phone })}
              onCancel={() => setDialogOpen(false)}
            />
          )}

          {dialogType === "notes" && editingClient && (
            <NotesForm
              initialNotes={editingClient.notes || ""}
              onSave={(notes: string) => handleSubmit({ notes })}
              onCancel={() => setDialogOpen(false)}
            />
          )}

          {dialogType === "email" && editingClient && (
            <EmailForm
              initialEmail={editingClient.email || ""}
              onSave={(email: string) => handleSubmit({ email })}
              onCancel={() => setDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Send Deal Modal */}
      <Dialog open={sendDealModalOpen} onOpenChange={handleSendDealModalClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Deals to Prospective Clients</DialogTitle>
            <DialogDescription>
              Select deals and clients to send deal information to prospective
              clients.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Deals Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Available Deals</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-lg p-3">
                {sellingAndLeasingDeals.length > 0 ? (
                  sellingAndLeasingDeals.map((deal) => (
                    <div key={deal.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedDeals.includes(deal.id)}
                        onCheckedChange={(checked) =>
                          handleDealSelection(deal.id, checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <p className="font-medium">{deal.dealName}</p>
                        <p className="text-sm text-gray-500 capitalize">
                          {deal.dealSide} Deal
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">
                    No selling or leasing deals available.
                  </p>
                )}
              </div>
            </div>

            {/* Clients Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Clients</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-lg p-3">
                {clients.length > 0 ? (
                  clients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        checked={selectedClients.includes(client.id)}
                        onCheckedChange={(checked) =>
                          handleClientSelection(client.id, checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <p className="font-medium">{client.full_name}</p>
                        <p className="text-sm text-gray-500">{client.email}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No clients available.</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-600">
              {selectedDeals.length} deal(s) selected • {selectedClients.length}{" "}
              client(s) selected
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleSendDealModalClose(false)}
                disabled={sendingDeals}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendDeals}
                disabled={
                  selectedDeals.length === 0 ||
                  selectedClients.length === 0 ||
                  sendingDeals
                }
              >
                {sendingDeals && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {sendingDeals ? "Sending..." : "Send Deals"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table Card */}
      <Card className="border">
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-1/3">Notes</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Deals</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? // Render 5 skeleton rows as placeholders
                    Array.from({ length: 5 }).map((_, idx) =>
                      renderSkeletonRow(idx)
                    )
                  : // Render actual data rows
                    filteredClients.map((client, idx) => {
                      const relatedDeals = dealClients
                        .filter((dc) => dc.party_id === client.id)
                        .map((dc) => deals.find((d) => d.id === dc.deal_id))
                        .filter((d): d is Deal => Boolean(d));

                      // Determine the color classes for this client's status
                      const bgTextClasses = client.current_transaction_status
                        ? statusColors[client.current_transaction_status]
                        : "";

                      return (
                        <TableRow
                          key={client.id}
                          className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        >
                          {/* Full Name */}
                          <TableCell>
                            <div
                              className="hover:bg-gray-100 cursor-pointer px-2 py-1 rounded"
                              onClick={() => openFullForm(client)}
                            >
                              {client.full_name || "-"}
                            </div>
                          </TableCell>

                          {/* Email */}
                          <TableCell>
                            <div
                              className="hover:bg-gray-100 cursor-pointer px-2 py-1 rounded"
                              onClick={() => openEmailForm(client)}
                            >
                              {client.email || "-"}
                            </div>
                          </TableCell>

                          {/* Phone */}
                          <TableCell>
                            {client.phone_number ? (
                              <div
                                className="hover:bg-gray-100 cursor-pointer px-2 py-1 rounded"
                                onClick={() => openPhoneForm(client)}
                              >
                                {client.phone_number}
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openPhoneForm(client)}
                              >
                                + Add Phone
                              </Button>
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <div className="px-2 py-1">
                              <Select
                                value={client.current_transaction_status}
                                onValueChange={(value) =>
                                  handleStatusChange(
                                    client,
                                    value as Party["current_transaction_status"]
                                  )
                                }
                              >
                                <SelectTrigger
                                  className={`
                                    rounded-full
                                    px-3
                                    py-1
                                    text-sm
                                    font-medium
                                    ${bgTextClasses}
                                  `}
                                >
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem
                                    value="lead"
                                    className="flex items-center gap-2"
                                  >
                                    <span className="inline-block w-2 h-2 rounded-full bg-blue-600" />
                                    Lead
                                  </SelectItem>
                                  <SelectItem
                                    value="searching"
                                    className="flex items-center gap-2"
                                  >
                                    <span className="inline-block w-2 h-2 rounded-full bg-yellow-600" />
                                    Searching
                                  </SelectItem>
                                  <SelectItem
                                    value="under_contract"
                                    className="flex items-center gap-2"
                                  >
                                    <span className="inline-block w-2 h-2 rounded-full bg-orange-600" />
                                    Under Contract
                                  </SelectItem>
                                  <SelectItem
                                    value="closed"
                                    className="flex items-center gap-2"
                                  >
                                    <span className="inline-block w-2 h-2 rounded-full bg-green-600" />
                                    Closed
                                  </SelectItem>
                                  <SelectItem
                                    value="cancelled"
                                    className="flex items-center gap-2"
                                  >
                                    <span className="inline-block w-2 h-2 rounded-full bg-red-600" />
                                    Cancelled
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>

                          {/* Notes */}
                          <TableCell className="py-4">
                            {client.notes ? (
                              <pre
                                className="whitespace-pre-wrap px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
                                onClick={() => openNotesForm(client)}
                              >
                                {client.notes}
                              </pre>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openNotesForm(client)}
                              >
                                + Add Notes
                              </Button>
                            )}
                          </TableCell>

                          {/* Created */}
                          <TableCell>
                            {new Date(client.created_at).toLocaleDateString(
                              "en-US"
                            )}
                          </TableCell>

                          {/* Deals */}
                          <TableCell>
                            {relatedDeals.length ? (
                              <div className="flex flex-row gap-2 overflow-x-auto max-w-xs py-1">
                                {relatedDeals
                                  .sort(
                                    (a, b) =>
                                      new Date(b.created_at).getTime() -
                                      new Date(a.created_at).getTime()
                                  )
                                  .map((d) => {
                                    const dealClient = dealClients.find(
                                      (dc) =>
                                        dc.deal_id === d.id &&
                                        dc.party_id === client.id
                                    );
                                    return (
                                      <div
                                        key={`${client.id}-${d.id}`}
                                        className="min-w-[140px] border border-gray-200 rounded-lg p-2 hover:border-gray-300 transition"
                                      >
                                        <Link
                                          href={`/realtor/workspace/${d.id}`}
                                        >
                                          <Button
                                            size="sm"
                                            variant="link"
                                            className="truncate text-left w-full"
                                          >
                                            {d.dealName}
                                          </Button>
                                        </Link>

                                        {dealClient && (
                                          <span className="block text-xs text-gray-500 mt-1">
                                            {dealClient.party_role
                                              .charAt(0)
                                              .toUpperCase() +
                                              dealClient.party_role.slice(1) +
                                              " " +
                                              dealClient.partyNumber}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
