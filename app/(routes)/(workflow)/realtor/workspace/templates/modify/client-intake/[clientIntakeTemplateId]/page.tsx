"use client";

import React, { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { ClientIntakeEditor } from "./components/ClientIntakeEditor";
import { SchemaSelectorSidebar } from "./components/SchemaSelectorSidebar";
import { SchemaItem } from "@/components/files/types/realtor";
import { getAvailableFormsFromTemplate } from "@/app/actions/realtor/form-actions";
import { getSchemaByFormType } from "@/app/actions/realtor/schema";
import {
  getPartyIntakeSchemaFromTemplate,
  SchemaType,
  savePartyIntakeSchema,
} from "@/app/actions/realtor/client-intake-template-actions";

const TemplateBasePage = () => {
  const params = useParams();
  const clientIntakeTemplateId = params.clientIntakeTemplateId as string;
  const templateName = decodeURIComponent(clientIntakeTemplateId); //templateName is template id

  const [selectedSchemaType, setSelectedSchemaType] =
    useState<SchemaType>("buyer1_schema");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleLoadTemplate = useCallback(
    async (schemaType: SchemaType): Promise<SchemaItem[]> => {
      return await getPartyIntakeSchemaFromTemplate(templateName, schemaType);
    },
    [templateName]
  );

  const handleSaveTemplate = useCallback(
    async (
      schemaItems: SchemaItem[],
      schemaType: SchemaType
    ): Promise<void> => {
      await savePartyIntakeSchema(templateName, schemaItems, schemaType);
    },
    [templateName]
  );

  const handleGetAvailableFormTypes = useCallback(async (): Promise<
    string[]
  > => {
    return getAvailableFormsFromTemplate(templateName);
  }, [templateName]);

  const handleGetSchemaByFormType = useCallback(
    async (formType: string): Promise<any[]> => {
      return getSchemaByFormType(formType);
    },
    []
  );

  const handleSchemaTypeChange = useCallback(
    (schemaType: SchemaType) => {
      if (hasUnsavedChanges) {
        const confirmSwitch = window.confirm(
          "You have unsaved changes. Are you sure you want to switch schema types? Unsaved changes will be lost."
        );
        if (!confirmSwitch) return;
      }
      setSelectedSchemaType(schemaType);
      setHasUnsavedChanges(false);
    },
    [hasUnsavedChanges]
  );

  const getSchemaDisplayName = useCallback((schemaType: SchemaType): string => {
    const schemaNames = {
      buyer1_schema: "Primary Buyer",
      buyer2_schema: "Secondary Buyer",
      seller1_schema: "Primary Seller",
      seller2_schema: "Secondary Seller",
    };
    return schemaNames[schemaType];
  }, []);

  return (
    <div className="flex w-full flex-col my-4">
      {/* Subtle back button above the card */}
      <div className="mx-4 mb-2">
        <Link href="/realtor/workspace/templates/">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:underline flex items-center gap-1 px-2 py-1"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back</span>
          </Button>
        </Link>
      </div>

      <div className="flex h-screen bg-gray-50">
        {/* Schema Selector Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {templateName}
            </h1>
            <p className="text-sm text-gray-600 mb-6">Template Builder</p>
          </div>

          <SchemaSelectorSidebar
            selectedSchemaType={selectedSchemaType}
            onSchemaTypeChange={handleSchemaTypeChange}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <ClientIntakeEditor
            title={`${getSchemaDisplayName(selectedSchemaType)} Schema`}
            onLoadItems={() => handleLoadTemplate(selectedSchemaType)}
            onSaveItems={(schemaItems: SchemaItem[]) =>
              handleSaveTemplate(schemaItems, selectedSchemaType)
            }
            onGetAvailableFormTypes={handleGetAvailableFormTypes}
            onGetSchemaByFormType={handleGetSchemaByFormType}
            autoSave={true}
            autoSaveInterval={10000}
          />
        </div>
      </div>
    </div>
  );
};

export default TemplateBasePage;
