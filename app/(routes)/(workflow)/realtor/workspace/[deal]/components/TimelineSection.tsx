"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle,
  FileText,
  TrendingUp,
  Users,
  Circle,
  Home,
  Search,
  Send,
  FileSignature,
  DollarSign,
  Key,
  PenTool,
  Activity,
  ChevronRight,
} from "lucide-react";
import { getDealOptionsWithForms } from "@/app/actions/realtor/deal-option-actions";
import { getClientIntakesByDealId } from "@/app/actions/realtor/client-intake-actions";
import { getStagesForDeal } from "@/app/actions/realtor/stage-actions";
import { getDeal } from "@/app/actions/realtor/deal-actions";
import { updateDealStepsStatuses } from "@/app/actions/realtor/deal-actions";
import { toast } from "sonner";
import TimelineSectionSkeleton from "@/components/loading-skeletons/TimelineSectionSkeleton";
import { Deal, StepStatus } from "@/components/files/types/realtor";

interface DealStep {
  id: string;
  title: string;
  description: string;
  status: "completed" | "current" | "upcoming";
  icon: React.ReactNode;
  action?: () => void;
  actionLabel?: string;
}

interface TimelineSectionProps {
  dealId: string;
  onShowForms: () => void;
  onShowClientIntakes: () => void;
  stepStatuses: { stepId: string; status: StepStatus }[];
}

const TimelineSection: React.FC<TimelineSectionProps> = ({
  dealId,
  onShowForms,
  onShowClientIntakes,
  stepStatuses = [],
}) => {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [steps, setSteps] = useState<DealStep[]>([]);
  const [stats, setStats] = useState({
    totalForms: 0,
    completedForms: 0,
    pendingSignatures: 0,
    clientIntakes: 0,
    completedIntakes: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTimelineData();
  }, [dealId]);

  const dealIfy = (dealName: string) => {
    const endIndex = dealName.indexOf(", United States");
    const dealNameIfy = dealName.substring(0, endIndex);
    return dealNameIfy;
  };

  const handleStatusChange = async (
    stepIndex: number,
    newStatus: StepStatus
  ) : Promise<void> => {
    const prevSteps = [...steps];
    const updatedSteps = [...steps];

    if (stepIndex >= steps.length) {
      return;
    }

    updatedSteps[stepIndex].status = newStatus;
    setSteps(updatedSteps);
    if (newStatus === "completed" && stepIndex <= steps.length-1) {
      updatedSteps[stepIndex+1].status = "current";
    }
    toast.success(`Step status updated to ${newStatus}`);

    // Prepare payload for API
    const stepStatusesPayload = updatedSteps.map((step) => ({
      stepId: step.id,
      status: step.status as StepStatus,
    }));

    try {
      await updateDealStepsStatuses(dealId, stepStatusesPayload);
    } catch (error) {
      setSteps(prevSteps); // revert UI
      console.error(error);
      toast.error("Failed to update step status. Reverting change.");
    }
  };

  const loadTimelineData = async () => {
    setIsLoading(true);
    try {
      // Load deal details
      const dealData = await getDeal(dealId);
      setDeal(dealData);

      // Load stages
      await getStagesForDeal(dealId);

      // Load forms data
      const dealOptions = await getDealOptionsWithForms(dealId);
      const allForms = dealOptions.flatMap((option) =>
        (option.forms || []).map((form) => ({
          ...form,
          deal_option_address: option.address,
        }))
      );

      // Load client intakes
      const clientIntakes = await getClientIntakesByDealId(dealId);

      // Calculate stats
      const completedForms = allForms.filter(
        (form) =>
          form.signature_sequence &&
          form.signature_sequence.every((step) =>
            step.every((signer) => signer.row_uuid && signer.row_uuid !== "")
          )
      ).length;

      const pendingSignatures = allForms.filter(
        (form) =>
          form.signature_sequence &&
          form.signature_sequence.some((step) =>
            step.some((signer) => signer.row_uuid && signer.row_uuid !== "")
          ) &&
          !form.signature_sequence.every((step) =>
            step.every((signer) => signer.row_uuid && signer.row_uuid !== "")
          )
      ).length;

      const completedIntakes = clientIntakes.filter(
        (intake) =>
          intake.party_response && Object.keys(intake.party_response).length > 0
      ).length;

      setStats({
        totalForms: allForms.length,
        completedForms,
        pendingSignatures,
        clientIntakes: clientIntakes.length,
        completedIntakes,
      });

      // Generate steps based on deal side
      const dealSteps = generateStepsForDealSide(
        dealData.dealSide,
        stepStatuses
      );
      setSteps(dealSteps);
    } catch (error) {
      console.error("Error loading timeline data:", error);
      toast.error("Failed to load timeline data");
    } finally {
      setIsLoading(false);
    }
  };

  const generateStepsForDealSide = (
    dealSide: string,
    stepStatuses: { stepId: string; status: StepStatus }[]
  ): DealStep[] => {
    // Common early steps for all deal types
    const commonEarlySteps: DealStep[] = [
      {
        id: "send-intake-forms",
        title: "Send Client Intake Forms",
        description: "Collect client information and preferences",
        status: "current",
        icon: <Send className="w-5 h-5" />,
        action: onShowClientIntakes,
        actionLabel: "Manage Parties",
      },
    ];

    // Deal-specific steps
    let dealSpecificSteps: DealStep[] = [];

    switch (dealSide) {
      case "buy":
        dealSpecificSteps = [
          {
            id: "search-for-properties",
            title: "Search for Properties",
            description: "Find suitable properties based on client preferences",
            status: "current",
            icon: <Search className="w-5 h-5" />,
          },
          {
            id: "select-properties",
            title: "Select Properties",
            description: "Choose properties to make offers on",
            status: "upcoming",
            icon: <Home className="w-5 h-5" />,
          },
          {
            id: "prepare-offer-documents",
            title: "Start Preparing Offer Documents",
            description: "Create purchase agreements and offers",
            status: "upcoming",
            icon: <FileText className="w-5 h-5" />,
            action: onShowForms,
            actionLabel: "Manage Forms",
          },
          {
            id: "submit-offers",
            title: "Submit Offers",
            description: "Send offers to sellers",
            status: "upcoming",
            icon: <FileSignature className="w-5 h-5" />,
          },
        ];
        break;

      case "sell":
        dealSpecificSteps = [
          {
            id: "prepare-listing-documents",
            title: "Prepare Listing Documents",
            description: "Create listing agreements and disclosures",
            status: "upcoming",
            icon: <FileText className="w-5 h-5" />,
            action: onShowForms,
            actionLabel: "Manage Forms",
          },
          {
            id: "sign-listing-agreement",
            title: "Sign Listing Agreement",
            description: "Client signs listing documents",
            status: "upcoming",
            icon: <FileSignature className="w-5 h-5" />,
          },
          {
            id: "market-property",
            title: "Market Property",
            description: "List property and show to buyers",
            status: "upcoming",
            icon: <TrendingUp className="w-5 h-5" />,
          },
          {
            id: "review-offers",
            title: "Review Offers",
            description: "Evaluate and negotiate buyer offers",
            status: "upcoming",
            icon: <DollarSign className="w-5 h-5" />,
          },
        ];
        break;

      case "rent":
        dealSpecificSteps = [
          {
            id: "search-rental-properties",
            title: "Search Rental Properties",
            description: "Find suitable rental properties",
            status: "upcoming",
            icon: <Search className="w-5 h-5" />,
          },
          {
            id: "schedule-viewings",
            title: "Schedule Viewings",
            description: "Tour selected properties",
            status: "upcoming",
            icon: <Home className="w-5 h-5" />,
          },
          {
            id: "submit-applications",
            title: "Submit Applications",
            description: "Apply for chosen rentals",
            status: "upcoming",
            icon: <FileText className="w-5 h-5" />,
            action: onShowForms,
            actionLabel: "Manage Forms",
          },
          {
            id: "sign-lease-agreement",
            title: "Sign Lease Agreement",
            description: "Finalize rental terms",
            status: "upcoming",
            icon: <FileSignature className="w-5 h-5" />,
          },
        ];
        break;

      case "lease":
        dealSpecificSteps = [
          {
            id: "prepare-property-listing",
            title: "List property",
            description: "Create rental listing materials",
            status: "upcoming",
            icon: <FileText className="w-5 h-5" />,
            action: onShowForms,
            actionLabel: "Manage Forms",
          },
          {
            id: "screen-tenants",
            title: "Screen Tenants",
            description: "Review applications and references",
            status: "upcoming",
            icon: <Users className="w-5 h-5" />,
          },
          {
            id: "prepare-lease-documents",
            title: "Prepare Lease Documents",
            description: "Create lease agreements",
            status: "upcoming",
            icon: <FileText className="w-5 h-5" />,
          },
          {
            id: "execute-lease",
            title: "Execute Lease",
            description: "Sign lease and collect deposits",
            status: "upcoming",
            icon: <Key className="w-5 h-5" />,
          },
        ];
        break;
    }

    // Common final steps

    const commonFinalSteps: DealStep[] = [
      {
        id: "complete-transaction",
        title: "Complete Transaction",
        description: "Finalize all paperwork and close deal",
        status: "upcoming",
        icon: <CheckCircle className="w-5 h-5" />,
      },
    ];

    const returning = [
      ...commonEarlySteps,
      ...dealSpecificSteps,
      ...commonFinalSteps,
    ];

    // Apply statuses from stepStatuses prop if provided
    if (stepStatuses && stepStatuses.length > 0) {
      returning.forEach((step) => {
        const statusUpdate = stepStatuses.find((s) => s.stepId === step.id);
        if (statusUpdate) {
          step.status = statusUpdate.status;
        }
      });
    }

    return returning;
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-600 border-green-200";
      case "current":
        return "bg-blue-100 text-blue-600 border-blue-200";
      case "upcoming":
        return "bg-gray-100 text-gray-400 border-gray-200";
      default:
        return "bg-gray-100 text-gray-400 border-gray-200";
    }
  };

  if (isLoading) {
    return <TimelineSectionSkeleton />;
  }

  const getDealSideLabel = (dealSide: string) => {
    switch (dealSide) {
      case "buy":
        return "Buyer Representative Transaction";
      case "sell":
        return "Seller Representative Transaction";
      case "rent":
        return "Rental Representative Transaction";
      case "lease":
        return "Lease - Landlord Representative - Transaction";
      default:
        return "Transaction";
    }
  };

  return (
    <div className="p-6 space-y-6 h-full overflow-auto">
      {/* Welcome Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {(deal && ((dealIfy(deal.dealName)) || deal.dealName)) || "Deal"}
        </h2>
        <p className="text-gray-600">
          {deal && getDealSideLabel(deal.dealSide)}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Total Forms</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalForms}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.completedForms}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <PenTool className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Pending Signs
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pendingSignatures}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Client Intakes
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.clientIntakes}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Completed Intakes
                </p>
                <p className="text-2xl font-bold text-indigo-600">
                  {stats.completedIntakes}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/*  Timeline - Professional Style */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Timeline
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
            {steps.map((step, index) => (
              <div key={step.id} className="relative">
                {/* Professional card */}
                <div
                  className={`relative h-full rounded-lg border transition-all duration-200 ${
                    step.status === "completed"
                      ? "bg-white border-green-200 shadow-md"
                      : step.status === "current"
                      ? "bg-white border-blue-400 shadow-lg ring-2 ring-blue-400"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  {/* Step number badge */}
                  <div className="absolute -top-3 -left-3 z-20">
                    <div
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-semibold text-sm ${
                        step.status === "completed"
                          ? "bg-green-500 border-green-600 text-white"
                          : step.status === "current"
                          ? "bg-blue-500 border-blue-600 text-white"
                          : "bg-gray-200 border-gray-300 text-gray-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                  </div>

                  {/* Status selection dropdown */}

                  <div className="p-5 h-full flex flex-col">
                    {/* Icon */}
                    <div className="flex justify-center mb-4">
                      <div
                        className={`w-14 h-14 rounded-lg flex items-center justify-center ${getStepColor(
                          step.status
                        )}`}
                      >
                        {step.status === "completed" ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <div className="w-6 h-6">{step.icon}</div>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col">
                      <h3
                        className={`font-semibold text-base mb-2 ${
                          step.status === "upcoming"
                            ? "text-gray-600"
                            : "text-gray-900"
                        }`}
                      >
                        {step.title}
                      </h3>
                      <p
                        className={`text-sm mb-4 flex-1 ${
                          step.status === "upcoming"
                            ? "text-gray-500"
                            : "text-gray-600"
                        }`}
                      >
                        {step.description}
                      </p>

                      {/* Action button or status */}
                      {step.action && step.status === "current" ? (
                        <Button
                          onClick={step.action}
                          size="sm"
                          className="w-full"
                        >
                          {step.actionLabel}
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      ) : (
                        <div
                          className={`text-center py-1.5 px-3 rounded-md text-xs font-medium ${getStepColor(
                            step.status
                          )}`}
                        >
                          {step.status === "completed"
                            ? "Completed"
                            : step.status === "current"
                            ? "In Progress"
                            : "Upcoming"}
                        </div>
                      )}

                      {/* Change Status Dropup Button */}
                      <div className="mt-2 flex justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`w-full ${getStepColor(step.status)} ${
                                step.status === "upcoming"
                                  ? "border-2 border-blue-400 shadow-md hover:border-blue-600 transition-all duration-150"
                                  : ""
                              }`}
                            >
                              Change Status
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="top" align="center">
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(index, "upcoming")
                              }
                              disabled={step.status === "upcoming"}
                            >
                              <Circle className="mr-2 h-4 w-4" />
                              Set as Upcoming
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(index, "current")
                              }
                              disabled={step.status === "current"}
                            >
                              <Activity className="mr-2 h-4 w-4" />
                              Set as Current
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(index, "completed")
                              }
                              disabled={step.status === "completed"}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Set as Completed
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional arrow connectors */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 transform -translate-y-1/2 z-10">
                    {/* Horizontal arrow for same row */}
                    {(index + 1) % 3 !== 0 && (
                      <svg
                        width="48"
                        height="24"
                        viewBox="0 0 48 24"
                        className="transform translate-x-1/2"
                      >
                        <defs>
                          <marker
                            id={`arrow-${index}`}
                            markerWidth="8"
                            markerHeight="8"
                            refX="8"
                            refY="4"
                            orient="auto"
                          >
                            <path d="M 0 0 L 8 4 L 0 8 Z" fill="#9CA3AF" />
                          </marker>
                        </defs>
                        <path
                          d="M 0 12 L 40 12"
                          fill="none"
                          stroke="#9CA3AF"
                          strokeWidth="2"
                          markerEnd={`url(#arrow-${index})`}
                        />
                      </svg>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Professional completion message */}
          {steps.length > 0 &&
            steps[steps.length - 1].status === "completed" && (
              <div className="mt-8 flex justify-center">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 text-green-700">
                    <CheckCircle className="w-6 h-6" />
                    <div>
                      <h3 className="font-semibold text-lg">
                        Transaction Complete
                      </h3>
                      <p className="text-sm">
                        All steps have been successfully completed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TimelineSection;
