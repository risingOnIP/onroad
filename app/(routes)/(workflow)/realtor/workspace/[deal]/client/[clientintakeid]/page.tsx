"use client";

import React, { useEffect, useState } from "react";
import {
  ClientIntake,
  PartyIntakeSchemaItem,
  SchemaItem,
} from "@/components/files/types/realtor";
import { getSchemaByFormType } from "@/app/actions/realtor/schema";
import { getAvailableFormsFromDealId } from "@/app/actions/realtor/form-actions";
import { ClientIntakeEditor } from "../../../templates/modify/client-intake/[clientIntakeTemplateId]/components";
import {
  getClientIntakeById,
  saveClientIntakeSchema,
} from "@/app/actions/realtor/client-intake-actions";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

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

                      {/* Radio field skeleton */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="h-5 bg-gray-200 rounded animate-pulse w-28"></div>
                          <div className="flex gap-2">
                            <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                            <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                            <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {[1, 2].map((i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse"></div>
                              <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Add section button skeleton */}
                  <div className="flex justify-center">
                    <div className="h-12 bg-blue-100 rounded-lg border-2 border-dashed border-blue-300 animate-pulse w-32"></div>
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

const ClientIntakeCraft = ({
  params,
}: {
  params: Promise<{ deal: string; clientintakeid: string }>;
}) => {
  const [clientIntake, setClientIntake] = useState<ClientIntake>();
  const [dealId, setDealId] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const setterEffect = async () => {
      try {
        const resolvedparams = await params;
        setDealId(resolvedparams.deal);
        const clientIntake = await getClientIntakeById(
          resolvedparams.clientintakeid
        );
        setClientIntake(clientIntake);
      } catch (error) {
        console.error("Error loading client intake:", error);
      } finally {
        setIsLoading(false);
      }
    };

    setterEffect();
  }, []);

  const getInitialSchema = async (): Promise<PartyIntakeSchemaItem[]> => {
    return clientIntake!.party_intake_form_schema;
  };

  const handleSaveSchema = async (
    clientIntakeSchema: PartyIntakeSchemaItem[]
  ): Promise<void> => {
    await saveClientIntakeSchema(clientIntakeSchema, clientIntake!.id);
  };

  const handleGetSchemaByFormType = async (
    formType: string
  ): Promise<SchemaItem[]> => {
    const schema = await getSchemaByFormType(formType);
    return schema;
  };

  const handleGetAvailableFormTypes = async (): Promise<string[]> => {
    const formTypes = await getAvailableFormsFromDealId(dealId!);
    const allFormTypes = formTypes.deal_wide.concat(formTypes.property_specific || []);
    const availableFormTypes = allFormTypes.map(ft => ft.formType);
    return availableFormTypes;
  };

  // Show loading skeleton while data is being fetched
  if (isLoading || !clientIntake || !dealId) {
    return (
      <div className="space-y-6">
        <ClientIntakeEditorSkeleton />
      </div>
    );
  }

  // If loading is finished and there were no blocks (no redirect happened)
  return (
    <div className="space-y-6">
      {/* Send to Clients Button */}

      {/* Client Intake Editor */}
      <ClientIntakeEditor
        title="Client Intake"
        onLoadItems={getInitialSchema}
        onSaveItems={handleSaveSchema}
        onGetAvailableFormTypes={handleGetAvailableFormTypes}
        onGetSchemaByFormType={handleGetSchemaByFormType}
      />
    </div>
  );
};

export default ClientIntakeCraft;
