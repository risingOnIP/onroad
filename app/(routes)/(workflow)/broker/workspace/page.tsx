'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bell, 
  Check, 
  X, 
  Users, 
  Clock, 
  Trash2,
  UserPlus,
  Loader2,
  AlertCircle,
  FileText,
  Search,
  Filter,
  BarChart3,
  Grid3X3,
  List,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { 
  getAllRealtorTethers, 
  acceptRealtorRequest, 
  denyRealtorRequest,
  createRealtorTetherByEmail,
  deleteRealtorTether,
  cancelPendingRealtorTether
} from '@/app/actions/broker/realtor-tether-actions';
import { BrokerRealtorTether } from '@/components/files/types/tethers';
import { RealtorReviewCard } from '@/components/files/broker/RealtorReviewCard';
import { getFormsForReview, FormForReview } from '@/app/actions/broker/form-review-actions';
import { BrokerFormsManager } from '@/components/files/broker/BrokerFormsManager';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function BrokerWorkspacePage() {
  const router = useRouter();
  const [pendingTetherRequests, setPendingTetherRequests] = useState<BrokerRealtorTether[]>([]);
  const [acceptedRealtors, setAcceptedRealtors] = useState<BrokerRealtorTether[]>([]);
  const [isLoadingTethers, setIsLoadingTethers] = useState(true);
  const [realtorEmail, setRealtorEmail] = useState("");
  const [isCreatingTether, setIsCreatingTether] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTether, setSelectedTether] = useState<BrokerRealtorTether | null>(null);
  
  // Review Forms States
  const [forms, setForms] = useState<FormForReview[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'name' | 'pending' | 'completion'>('pending');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchAllTethers = async () => {
    try {
      const allTetherRequests = await getAllRealtorTethers();
      
      // Filter for pending and accepted requests
      const pendingOnly = allTetherRequests.filter((tether: BrokerRealtorTether) => tether.status === 'pending');
      const acceptedOnly = allTetherRequests.filter((tether: BrokerRealtorTether) => tether.status === 'accepted');
      
      setPendingTetherRequests(pendingOnly);
      setAcceptedRealtors(acceptedOnly);
    } catch (error) {
      console.error('Error fetching tether requests:', error);
      toast.error('Failed to load tether requests');
    } finally {
      setIsLoadingTethers(false);
    }
  };

  const fetchForms = async () => {
    try {
      const data = await getFormsForReview();
      setForms(data);
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error('Failed to load forms for review');
    } finally {
      setIsLoadingForms(false);
    }
  };

  useEffect(() => {
    fetchAllTethers();
    fetchForms();
  }, []);

  // Process realtor data with form counts
  const realtorFormData = useMemo(() => {
    const realtorMap = new Map<string, {
      realtor: any;
      formCounts: {
        reviewing: number;
        approved: number;
        not_sent: number;
        total: number;
      };
      lastActivityDate?: string;
    }>();

    // Initialize with accepted realtors
    acceptedRealtors.forEach(tether => {
      if (tether.realtor_id) {
        realtorMap.set(tether.realtor_id, {
          realtor: {
            id: tether.realtor_id,
            full_name: tether.realtor_full_name || 'Unknown Realtor',
            email: tether.realtor_email || '',
          },
          formCounts: {
            reviewing: 0,
            approved: 0,
            not_sent: 0,
            total: 0
          }
        });
      }
    });

    // Count forms per realtor
    forms.forEach(form => {
      const realtorId = form.deal_option?.deal?.realtor?.id;
      const realtorName = form.deal_option?.deal?.realtor?.full_name;
      const realtorEmail = form.deal_option?.deal?.realtor?.email;
      
      if (realtorId) {
        let realtorData = realtorMap.get(realtorId);

        if (!realtorData) {
          return;
        }

        // Update counts
        realtorData.formCounts.total++;
        if (form.review_stage === 'reviewing') {
          realtorData.formCounts.reviewing++;
        } else if (form.review_stage === 'approved') {
          realtorData.formCounts.approved++;
        } else if (form.review_stage === 'not_sent') {
          realtorData.formCounts.not_sent++;
        }

        // Update last activity
        if (!realtorData.lastActivityDate || new Date(form.created_at) > new Date(realtorData.lastActivityDate)) {
          realtorData.lastActivityDate = form.created_at;
        }
      }
    });

    return Array.from(realtorMap.values());
  }, [acceptedRealtors, forms]);

  // Filter and sort realtors
  const filteredAndSortedRealtors = useMemo(() => {
    let filtered = realtorFormData;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(data =>
        data.realtor.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        data.realtor.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.realtor.full_name.localeCompare(b.realtor.full_name);
        case 'pending':
          return b.formCounts.reviewing - a.formCounts.reviewing;
        case 'completion':
          const aCompletion = a.formCounts.total > 0 ? (a.formCounts.approved / a.formCounts.total) : 0;
          const bCompletion = b.formCounts.total > 0 ? (b.formCounts.approved / b.formCounts.total) : 0;
          return bCompletion - aCompletion;
        default:
          return 0;
      }
    });
  }, [realtorFormData, searchQuery, sortBy]);

  const handleAcceptTether = async (tetherId: string) => {
    try {
      await acceptRealtorRequest(tetherId);
      toast.success('Realtor tether request accepted');
      await fetchAllTethers();
    } catch (error) {
      console.error('Error accepting tether request:', error);
      toast.error('Failed to accept tether request');
    }
  };

  const handleRejectTether = async (tetherId: string) => {
    try {
      await denyRealtorRequest(tetherId);
      toast.success('Realtor tether request rejected');
      await fetchAllTethers();
    } catch (error) {
      console.error('Error rejecting tether request:', error);
      toast.error('Failed to reject tether request');
    }
  };

  const handleCreateTether = async () => {
    if (!realtorEmail.trim()) {
      toast.error("Please enter a realtor email");
      return;
    }

    setIsCreatingTether(true);
    try {
      await createRealtorTetherByEmail(realtorEmail, false);
      toast.success("Tether request sent successfully!");
      setRealtorEmail("");
      await fetchAllTethers();
    } catch (error: any) {
      console.error("Error creating tether request:", error);
      toast.error(error.message || "Failed to send tether request");
    } finally {
      setIsCreatingTether(false);
    }
  };

  const handleDeleteRealtor = (tether: BrokerRealtorTether) => {
    setSelectedTether(tether);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteRealtor = async () => {
    if (!selectedTether) return;
    
    try {
      await deleteRealtorTether(selectedTether.id);
      toast.success("Realtor connection removed");
      setShowDeleteConfirm(false);
      setSelectedTether(null);
      await fetchAllTethers();
    } catch (error: any) {
      console.error("Error deleting realtor connection:", error);
      toast.error(error.message || "Failed to remove realtor connection");
    }
  };

  const handleCancelPending = async (tetherId: string) => {
    try {
      await cancelPendingRealtorTether(tetherId);
      toast.success("Pending request canceled");
      await fetchAllTethers();
    } catch (error: any) {
      console.error("Error canceling pending tether:", error);
      toast.error(error.message || "Failed to cancel pending request");
    }
  };

  const handleRealtorClick = (realtorId: string) => {
    router.push(`/broker/review-forms?realtorId=${encodeURIComponent(realtorId)}`);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Broker Workspace</h1>
        
        <div className="flex items-center gap-2">
          {/* Notification Dropdown */}
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {pendingTetherRequests.filter(t => !t.broker_id).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                  {pendingTetherRequests.filter(t => !t.broker_id).length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end">
            <DropdownMenuLabel>Pending Realtor Requests</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isLoadingTethers ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : pendingTetherRequests.filter(t => !t.broker_id).length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No pending requests
              </div>
            ) : (
              pendingTetherRequests.filter(t => !t.broker_id).map((request) => (
                <div key={request.id} className="p-3 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {request.realtor_full_name || 'Unknown Realtor'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {request.realtor_email || 'No email'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleAcceptTether(request.id)}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleRejectTether(request.id)}
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>


      {/* Forms Management Section */}
      <BrokerFormsManager />

      {/* Realtor Management & Form Reviews Section */}
      <Card className="mb-6 mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Realtor Management
                </CardTitle>
                <CardDescription>
                  Manage your realtors and review their submitted forms
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {pendingTetherRequests.filter(t => !t.broker_id).length > 0 && (
                  <Badge variant="destructive" className="px-3 py-1">
                    <Bell className="w-4 h-4 mr-1" />
                    {pendingTetherRequests.filter(t => !t.broker_id).length} Requests
                  </Badge>
                )}
                <Badge variant="outline" className="px-3 py-1">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  {forms.filter(f => f.review_stage === 'reviewing').length} Pending Forms
                </Badge>
                <Badge variant="outline" className="px-3 py-1 text-green-700 border-green-200">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  {acceptedRealtors.length} Realtors
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
          <Tabs defaultValue="forms" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="forms" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Form Reviews
                {forms.filter(f => f.review_stage === 'reviewing').length > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-5">
                    {forms.filter(f => f.review_stage === 'reviewing').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Requests
                {pendingTetherRequests.length > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-5">
                    {pendingTetherRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="add" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Add Realtor
              </TabsTrigger>
            </TabsList>

            {/* Form Reviews Tab */}
            <TabsContent value="forms" className="mt-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search realtors by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Most Pending</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="completion">Completion Rate</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex rounded-lg border">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Realtor Cards or List */}
          {isLoadingForms ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredAndSortedRealtors.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No forms to review</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery ? 'No realtors match your search' : 'Forms submitted by realtors will appear here'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAndSortedRealtors.map((data) => (
                <RealtorReviewCard
                  key={data.realtor.id}
                  realtor={data.realtor}
                  formCounts={data.formCounts}
                  lastActivityDate={data.lastActivityDate}
                  onClick={() => handleRealtorClick(data.realtor.id)}
                  onRemove={() => {
                    const tether = acceptedRealtors.find(t => t.realtor_id === data.realtor.id);
                    if (tether) handleDeleteRealtor(tether);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAndSortedRealtors.map((data) => (
                <div
                  key={data.realtor.id}
                  onClick={() => handleRealtorClick(data.realtor.id)}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-semibold">
                      {data.realtor.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium">{data.realtor.full_name}</p>
                      <p className="text-sm text-gray-500">{data.realtor.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      {data.formCounts.reviewing > 0 && (
                        <Badge className="bg-orange-100 text-orange-800">
                          {data.formCounts.reviewing} pending
                        </Badge>
                      )}
                      {data.formCounts.approved > 0 && (
                        <Badge className="bg-green-100 text-green-800">
                          {data.formCounts.approved} approved
                        </Badge>
                      )}
                      {data.formCounts.not_sent > 0 && (
                        <Badge className="bg-red-100 text-red-800">
                          {data.formCounts.not_sent} revision
                        </Badge>
                      )}
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination hint for large lists */}
          {filteredAndSortedRealtors.length > 20 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Showing {filteredAndSortedRealtors.length} realtors with forms
              </p>
            </div>
          )}
            </TabsContent>

            {/* Pending Requests Tab */}
            <TabsContent value="pending" className="mt-6">
              <div className="space-y-4">
                {/* Incoming Requests */}
                {pendingTetherRequests.filter(t => !t.broker_id).length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-3">Incoming Requests</h3>
                    <div className="grid gap-3">
                      {pendingTetherRequests.filter(t => !t.broker_id).map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 border-blue-200">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-semibold">
                              {(request.realtor_full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium">
                                {request.realtor_full_name || 'Unknown Realtor'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {request.realtor_email || 'No email'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Requested: {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAcceptTether(request.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectTether(request.id)}
                              className="border-red-200 text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Outgoing Requests */}
                {pendingTetherRequests.filter(t => t.broker_id).length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-3">Outgoing Requests</h3>
                    <div className="grid gap-3">
                      {pendingTetherRequests.filter(t => t.broker_id).map((tether) => (
                        <div key={tether.id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                          <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-yellow-600" />
                            <div>
                              <p className="font-medium">
                                {tether.realtor_full_name || tether.realtor_email || 'Unknown Realtor'}
                              </p>
                              <p className="text-sm text-gray-600">
                                Waiting for response
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Sent: {new Date(tether.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelPending(tether.id)}
                            className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pendingTetherRequests.length === 0 && (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No pending requests</p>
                    <p className="text-sm text-gray-500 mt-1">All realtor connections are up to date</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Add Realtor Tab */}
            <TabsContent value="add" className="mt-6">
              <div className="max-w-md mx-auto">
                <div className="p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Send Realtor Request</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Enter the email address of the realtor you want to connect with
                  </p>
                  <div className="space-y-4">
                    <Input
                      type="email"
                      placeholder="realtor@example.com"
                      value={realtorEmail}
                      onChange={(e) => setRealtorEmail(e.target.value)}
                      disabled={isCreatingTether}
                      className="w-full"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateTether();
                        }
                      }}
                    />
                    <Button
                      onClick={handleCreateTether}
                      disabled={isCreatingTether || !realtorEmail}
                      className="w-full"
                    >
                      {isCreatingTether ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4 mr-2" />
                      )}
                      Send Connection Request
                    </Button>
                  </div>
                </div>
                
                {/* Recent Connections */}
                {acceptedRealtors.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Connected Realtors ({acceptedRealtors.length})
                    </h4>
                    <div className="space-y-2">
                      {acceptedRealtors.slice(0, 5).map((realtor) => (
                        <div key={realtor.id} className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-sm font-semibold">
                            {(realtor.realtor_full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{realtor.realtor_full_name}</p>
                            <p className="text-xs text-gray-500">{realtor.realtor_email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Realtor Connection</DialogTitle>
            <DialogDescription>
              <Alert className="mt-4 border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-800">Warning</AlertTitle>
                <AlertDescription className="text-orange-700 mt-2">
                  This action is irreversible. The realtor will need to request a new connection.
                </AlertDescription>
              </Alert>
              {selectedTether && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium">{selectedTether.realtor_full_name}</p>
                  <p className="text-xs text-gray-600">{selectedTether.realtor_email}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setSelectedTether(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteRealtor}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove Realtor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}