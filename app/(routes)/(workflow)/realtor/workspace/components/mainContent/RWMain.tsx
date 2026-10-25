"use client";

import React, { useState, useEffect } from "react";
import { Deal, RealtorPageNavigation } from "@/components/files/types/realtor";
import DealGroupings from "./DealGroupings";
import { Button } from "@/components/ui/button";
import { FileText, Users, Link as LinkIcon, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { ChatInterface } from "@/components/ai/chat-interface";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  getAcceptedBrokerRealtorTethers,
  getAllBrokerRealtorTethers,
  createBrokerRealtorTetherByBrokerLicense,
  deleteBrokerRealtorTether,
  cancelPendingBrokerRealtorTether,
  acceptBrokerRequest,
  denyBrokerRequest
} from "@/app/actions/realtor/broker-tether-actions";
import { Trash2, Edit2, Clock, X, Check } from "lucide-react";

const RWMainContent = ({ deals }: { deals: Deal[] }) => {
  const [dealsView, setDealsView] = useState<"active" | "closed">("active");
  const [showBrokerDialog, setShowBrokerDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [brokerLicense, setBrokerLicense] = useState("");
  const [isRequestingTether, setIsRequestingTether] = useState(false);
  const [isCheckingBroker, setIsCheckingBroker] = useState(false);
  const [currentBroker, setCurrentBroker] = useState<any>(null);
  const [currentTetherId, setCurrentTetherId] = useState<string | null>(null);
  const [pendingBroker, setPendingBroker] = useState<any>(null);
  const [pendingTethers, setPendingTethers] = useState<any[]>([]);
  const [loadingBroker, setLoadingBroker] = useState(true);
  const [showChangeBrokerForm, setShowChangeBrokerForm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'delete' | 'change' | null>(null);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);

  const itemsPerPage = 8;

  // Check for existing broker tether on mount
  useEffect(() => {
    const checkBrokerTether = async () => {
      try {
        // Get all tethers first
        const allTethers = await getAllBrokerRealtorTethers();
        
        // Filter for accepted and pending
        const acceptedTethers = allTethers.filter((t: any) => t.status === 'accepted');
        const pendingTethersList = allTethers.filter((t: any) => t.status === 'pending');
        
        if (acceptedTethers && acceptedTethers.length > 0) {
          // Get the first accepted tether (most recent)
          const activeTether = acceptedTethers[0];
          const fullName = activeTether.broker_full_name || '';
          const [firstname = '', lastname = ''] = fullName.split(' ');
          
          setCurrentBroker({
            broker_license: activeTether.broker_license,
            firstname: firstname,
            lastname: lastname,
            email: activeTether.broker_email || ''
          });
          setCurrentTetherId(activeTether.id);
        }
        
        // Set pending tethers
        setPendingTethers(pendingTethersList);
        
      } catch (error) {
        console.error("Error checking broker tether:", error);
      } finally {
        setLoadingBroker(false);
      }
    };

    checkBrokerTether();
  }, []);

  const handleCheckBroker = async () => {
    if (!brokerLicense.trim()) {
      toast.error("Please enter a broker license number");
      return;
    }

    // Only show confirmation if changing an existing broker
    if (currentBroker && showChangeBrokerForm) {
      setConfirmAction('change');
      setShowFinalConfirm(true);
    } else {
      // No existing broker, proceed directly
      await handleConfirmChange();
    }
  };

  const handleConfirmChange = async () => {
    setIsCheckingBroker(true);
    setShowFinalConfirm(false);
    try {
      // Pass true for deleteExisting if we're changing from an existing broker
      const deleteExisting = currentBroker !== null && showChangeBrokerForm;
      await createBrokerRealtorTetherByBrokerLicense(brokerLicense, deleteExisting);
      
      toast.success(deleteExisting ? "Broker changed successfully!" : "Tether request sent successfully!");
      setShowBrokerDialog(false);
      setBrokerLicense("");
      setShowChangeBrokerForm(false);
      
      // Refresh all tethers
      const allTethers = await getAllBrokerRealtorTethers();
      const acceptedTethers = allTethers.filter((t: any) => t.status === 'accepted');
      const pendingTethersList = allTethers.filter((t: any) => t.status === 'pending');
      
      if (acceptedTethers && acceptedTethers.length > 0) {
        const activeTether = acceptedTethers[0];
        const fullName = activeTether.broker_full_name || '';
        const [firstname = '', lastname = ''] = fullName.split(' ');
        
        setCurrentBroker({
          broker_license: activeTether.broker_license,
          firstname: firstname,
          lastname: lastname,
          email: activeTether.broker_email || ''
        });
        setCurrentTetherId(activeTether.id);
      } else {
        // If no accepted tethers, clear current broker
        setCurrentBroker(null);
        setCurrentTetherId(null);
      }
      
      setPendingTethers(pendingTethersList);
    } catch (error: any) {
      console.error("Error creating tether request:", error);
      toast.error(error.message || "Failed to send tether request");
    } finally {
      setIsCheckingBroker(false);
      setConfirmAction(null);
    }
  };

  const handleConfirmTether = async () => {
    setIsRequestingTether(true);
    try {
      // TODO: Implement createRealtorTetherByLicense
      toast.error("Tether request not yet implemented");
      setShowConfirmDialog(false);
      setBrokerLicense("");
      setPendingBroker(null);
      
    } catch (error: any) {
      console.error("Error requesting tether:", error);
      toast.error(error.message || "Failed to send tether request");
    } finally {
      setIsRequestingTether(false);
    }
  };

  const handleChangeBroker = () => {
    setShowChangeBrokerForm(true);
    setBrokerLicense("");
  };

  const handleDeleteBroker = () => {
    setConfirmAction('delete');
    setShowFinalConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentTetherId) {
      toast.error("No broker connection to delete");
      return;
    }
    
    setShowFinalConfirm(false);
    setLoadingBroker(true);
    try {
      await deleteBrokerRealtorTether(currentTetherId);
      toast.success("Broker connection removed successfully");
      setCurrentBroker(null);
      setCurrentTetherId(null);
      setShowBrokerDialog(false);
    } catch (error: any) {
      console.error("Error deleting broker connection:", error);
      toast.error(error.message || "Failed to remove broker connection");
    } finally {
      setLoadingBroker(false);
      setConfirmAction(null);
    }
  };

  const handleCancelPendingTether = async (tetherId: string) => {
    try {
      await cancelPendingBrokerRealtorTether(tetherId);
      toast.success("Pending request canceled");
      
      // Refresh the tethers list
      const allTethers = await getAllBrokerRealtorTethers();
      const pendingTethersList = allTethers.filter((t: any) => t.status === 'pending');
      setPendingTethers(pendingTethersList);
    } catch (error: any) {
      console.error("Error canceling pending tether:", error);
      toast.error(error.message || "Failed to cancel pending request");
    }
  };

  const handleAcceptTether = async (tetherId: string) => {
    try {
      await acceptBrokerRequest(tetherId);
      toast.success("Broker invitation accepted!");
      
      // Refresh broker data and tethers
      const allTethers = await getAllBrokerRealtorTethers();
      const acceptedTethers = allTethers.filter((t: any) => t.status === 'accepted');
      const pendingTethersList = allTethers.filter((t: any) => t.status === 'pending');
      
      if (acceptedTethers.length > 0) {
        setCurrentBroker(acceptedTethers[0]);
      }
      setPendingTethers(pendingTethersList);
    } catch (error: any) {
      console.error("Error accepting tether:", error);
      toast.error(error.message || "Failed to accept broker invitation");
    }
  };

  const handleRejectTether = async (tetherId: string) => {
    try {
      await denyBrokerRequest(tetherId);
      toast.success("Broker invitation rejected");
      
      // Refresh the tethers list
      const allTethers = await getAllBrokerRealtorTethers();
      const pendingTethersList = allTethers.filter((t: any) => t.status === 'pending');
      setPendingTethers(pendingTethersList);
    } catch (error: any) {
      console.error("Error rejecting tether:", error);
      toast.error(error.message || "Failed to reject broker invitation");
    }
  };

  // Filter deals based on view and type
  const activeDeals = deals.filter((deal) => deal.isActive === true);
  const closedDeals = deals.filter((deal) => deal.isActive === false);

  const currentDeals = dealsView === "active" ? activeDeals : closedDeals;

  const sellDeals = currentDeals.filter((deal) => deal.dealSide === "sell");
  const buyDeals = currentDeals.filter((deal) => deal.dealSide === "buy");
  const rentDeals = currentDeals.filter((deal) => deal.dealSide === "rent");
  const leaseDeals = currentDeals.filter((deal) => deal.dealSide === "lease");
  
  const currentNavigation : RealtorPageNavigation = {
    area: "workspace",
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Section: Templates & CRM */}
      <section className="max-w-7xl mx-auto px-4 pt-8 pb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            Workspace Shortcuts
          </h1>
          
          {/* Broker Details Button */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowBrokerDialog(true)}
              disabled={loadingBroker}
            >
              {loadingBroker ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>Your Broker Details</>
              )}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          {/* Templates Card */}
          <Link
            href="/realtor/workspace/templates"
            className="group transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex flex-col items-start gap-2 p-4 border border-slate-100 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 group-hover:from-slate-100 group-hover:to-slate-200 transition-all duration-300 h-full">
              <FileText className="w-8 h-8 text-blue-500 mb-2 group-hover:text-blue-600 transition-colors" />
              <h2 className="text-lg font-semibold text-slate-800">
                Templates
              </h2>
              <p className="text-slate-600 text-sm mb-2">
                Manage and customize your workspace templates.
              </p>
              <Button
                size="sm"
                className="mt-auto bg-slate-800 text-white hover:bg-slate-700 transition-colors"
                variant="secondary"
              >
                Go to Templates
              </Button>
            </div>
          </Link>
          {/* CRM Card */}
          <Link
            href="/realtor/workspace/crm"
            className="group transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex flex-col items-start gap-2 p-4 border border-slate-100 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 group-hover:from-slate-100 group-hover:to-slate-200 transition-all duration-300 h-full">
              <Users className="w-8 h-8 text-orange-500 mb-2 group-hover:text-orange-600 transition-colors" />
              <h2 className="text-lg font-semibold text-slate-800">CRM</h2>
              <p className="text-slate-600 text-sm mb-2">
                Access and manage your client relationships and contacts.
              </p>
              <Button
                size="sm"
                className="mt-auto bg-slate-800 text-white hover:bg-slate-700 transition-colors"
                variant="secondary"
              >
                Go to CRM
              </Button>
            </div>
          </Link>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4">
        <hr className="border-slate-200 my-2" />
      </div>

      {/* Deals Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">Your Deals</h2>
          {/* Small Toggle */}
          <div className="inline-flex bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
            <button
              className={`px-4 py-1.5 text-sm font-medium transition-colors focus:outline-none ${
                dealsView === "active"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setDealsView("active")}
            >
              Active
            </button>
            <button
              className={`px-4 py-1.5 text-sm font-medium transition-colors focus:outline-none ${
                dealsView === "closed"
                  ? "bg-orange-50 text-orange-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setDealsView("closed")}
            >
              Closed
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          <DealGroupings
            itemsPerPage={itemsPerPage}
            categoryDeals={sellDeals}
            dealSide="sell"
            initialExpanded={sellDeals.length > 0}
          />
          <DealGroupings
            itemsPerPage={itemsPerPage}
            categoryDeals={buyDeals}
            dealSide="buy"
            initialExpanded={buyDeals.length > 0}
          />
          <DealGroupings
            itemsPerPage={itemsPerPage}
            categoryDeals={rentDeals}
            dealSide="rent"
            initialExpanded={rentDeals.length > 0}
          />
          <DealGroupings
            itemsPerPage={itemsPerPage}
            categoryDeals={leaseDeals}
            dealSide="lease"
            initialExpanded={leaseDeals.length > 0}
          />
        </div>
      </section>
      
      {/* AI Chat Interface */}
      <ChatInterface 
        userRole="realtor"
        pageNavigation={currentNavigation}
      />

      {/* Broker License Input Dialog */}
      <Dialog open={showBrokerDialog} onOpenChange={(open) => {
        setShowBrokerDialog(open);
        if (!open) {
          setShowChangeBrokerForm(false);
          setBrokerLicense("");
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Your Broker Details</DialogTitle>
            <DialogDescription>
              {currentBroker 
                ? "View your current broker information or manage your brokerage affiliation."
                : "Enter your broker's license number to send a tether request."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Show pending tethers if no current broker */}
            {!currentBroker && pendingTethers.length > 0 && !showChangeBrokerForm && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Pending Tether Requests</p>
                {pendingTethers.map((tether: any) => (
                  <div key={tether.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-900">
                          Broker License: {tether.broker_license}
                        </p>
                        {tether.broker_full_name && (
                          <p className="text-xs text-yellow-800 mt-1">
                            Broker: {tether.broker_full_name}
                          </p>
                        )}
                        <p className="text-xs text-yellow-700 mt-1">
                          {tether.realtor_id ? 'You requested' : 'Broker invited you'} • {new Date(tether.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        {tether.realtor_id ? (
                          // Realtor-initiated: can cancel
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelPendingTether(tether.id)}
                            className="h-7 w-7 p-0 hover:bg-yellow-100"
                          >
                            <X className="h-4 w-4 text-yellow-700" />
                          </Button>
                        ) : (
                          // Broker-initiated: can accept or reject
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAcceptTether(tether.id)}
                              className="h-7 px-2 hover:bg-green-100"
                            >
                              <Check className="h-4 w-4 text-green-700" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRejectTether(tether.id)}
                              className="h-7 w-7 p-0 hover:bg-red-100"
                            >
                              <X className="h-4 w-4 text-red-700" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-gray-500 mt-2">
                  Waiting for broker to accept the connection request
                </p>
              </div>
            )}
            
            {currentBroker ? (
              <>
                <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Broker Name</p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        {currentBroker.firstname} {currentBroker.lastname}
                      </p>
                    </div>
                    {currentBroker.email && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Email</p>
                        <p className="text-sm text-gray-700 mt-1">{currentBroker.email}</p>
                      </div>
                    )}
                    {currentBroker.broker_license && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Broker License</p>
                        <p className="text-sm text-gray-700 mt-1">{currentBroker.broker_license}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {showChangeBrokerForm ? (
                  <div className="space-y-2">
                    <label htmlFor="license" className="text-sm font-medium">
                      New Broker License
                    </label>
                    <Input
                      id="license"
                      placeholder="Enter new broker license"
                      value={brokerLicense}
                      onChange={(e) => setBrokerLicense(e.target.value)}
                      disabled={isCheckingBroker}
                    />
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleChangeBroker}
                      className="flex-1"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Change Broker
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDeleteBroker}
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Broker
                    </Button>
                  </div>
                )}
              </>
            ) : (
              (!pendingTethers.length || showChangeBrokerForm) && (
                <div className="space-y-2">
                  <label htmlFor="license" className="text-sm font-medium">
                    Broker License
                  </label>
                  <Input
                    id="license"
                    placeholder="Enter broker license"
                    value={brokerLicense}
                    onChange={(e) => setBrokerLicense(e.target.value)}
                    disabled={isCheckingBroker}
                  />
                </div>
              )
            )}
          </div>
          <DialogFooter>
            {showChangeBrokerForm ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowChangeBrokerForm(false);
                    setBrokerLicense("");
                  }}
                  disabled={isCheckingBroker}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCheckBroker}
                  disabled={isCheckingBroker || !brokerLicense}
                >
                  {isCheckingBroker ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBrokerDialog(false);
                    setBrokerLicense("");
                    setShowChangeBrokerForm(false);
                  }}
                  disabled={isCheckingBroker}
                >
                  Close
                </Button>
                {!currentBroker && !pendingTethers.length && (
                  <Button
                    onClick={handleCheckBroker}
                    disabled={isCheckingBroker || !brokerLicense}
                  >
                    {isCheckingBroker ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Submit"
                    )}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final Confirmation Dialog */}
      <Dialog open={showFinalConfirm} onOpenChange={setShowFinalConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'delete' ? 'Remove Broker Connection' : 'Change Broker'}
            </DialogTitle>
            <DialogDescription>
              <Alert className="mt-4 border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-800">Warning</AlertTitle>
                <AlertDescription className="text-orange-700 mt-2">
                  {confirmAction === 'delete' 
                    ? 'Removing your broker connection is irreversible. You will need to request a new connection to work with a broker again.'
                    : 'Changing your broker is irreversible. Your current broker connection will be replaced with the new one.'}
                </AlertDescription>
              </Alert>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowFinalConfirm(false);
                setConfirmAction(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAction === 'delete' ? handleConfirmDelete : handleConfirmChange}
              className="bg-red-600 hover:bg-red-700"
            >
              {confirmAction === 'delete' ? 'Remove Broker' : 'Change Broker'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Legacy Broker Confirmation Dialog - Keep for compatibility */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Broker Tether Request</DialogTitle>
            <DialogDescription>
              Please confirm that you want to send a tether request to this broker:
            </DialogDescription>
          </DialogHeader>
          
          {pendingBroker && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Broker Details</AlertTitle>
              <AlertDescription className="mt-2 space-y-1">
                <div>
                  <strong>Name:</strong> {pendingBroker.firstname} {pendingBroker.lastname}
                </div>
                <div>
                  <strong>Email:</strong> {pendingBroker.email}
                </div>
                <div>
                  <strong>License:</strong> {pendingBroker.broker_license}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setPendingBroker(null);
                setBrokerLicense("");
              }}
              disabled={isRequestingTether}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmTether}
              disabled={isRequestingTether}
              className="bg-green-600 hover:bg-green-700"
            >
              {isRequestingTether ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending Request...
                </>
              ) : (
                "Send Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RWMainContent;
