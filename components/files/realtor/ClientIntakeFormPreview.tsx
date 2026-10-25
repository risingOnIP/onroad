"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Eye,
  FileText,
} from "lucide-react";
import {
  PartyIntake,
  PartyIntakeSchemaItem,
} from "@/components/files/types/realtor";

interface ClientIntakeFormPreviewProps {
  intake: PartyIntake;
  onBack: () => void;
}

const ClientIntakeFormPreview: React.FC<ClientIntakeFormPreviewProps> = ({
  intake,
  onBack,
}) => {
  const groupSchemaBySection = (schema: PartyIntakeSchemaItem[]) => {
    const grouped: { [key: string]: PartyIntakeSchemaItem[] } = {};

    schema.forEach((item) => {
      const section = item.display_attributes.block || "General Information";
      if (!grouped[section]) {
        grouped[section] = [];
      }
      grouped[section].push(item);
    });

    return grouped;
  };

  const groupedSchema = groupSchemaBySection(intake.party_intake_form_schema);

  return (
    <div className="space-y-6 p-6 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Eye className="w-6 h-6 text-blue-600" />
              Client Intake Form Preview
            </h1>
            <p className="text-gray-600">
              {intake.email} - {intake.partyrole_partynumber}
            </p>
          </div>
        </div>
      </div>


      {/* Preview Header */}
      <div className="border-t pt-6">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Client View Preview
          </h2>
          <p className="text-sm text-gray-600">
            This is how your client will see and interact with the form
          </p>
        </div>
      </div>

      {/* Form Preview - Using FormInput in read-only mode */}
      <Card className="border-2 border-dashed border-gray-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Client Intake Form</h3>
              <p className="text-sm text-gray-600">
                Complete this form to provide your information to your realtor
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              Preview Mode
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Render each section */}
          {Object.entries(groupedSchema).map(([sectionName, items], index) => (
            <div key={sectionName} className="mb-8">
              <div className="mb-4 pb-2 border-b border-gray-200">
                <h4 className="text-base font-medium text-gray-900 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">
                    {index + 1}
                  </span>
                  {sectionName}
                </h4>
              </div>
              
              <div className="grid grid-cols-12 gap-4">
                {items
                  .sort((a, b) => a.display_attributes.order - b.display_attributes.order)
                  .map((schemaItem) => {
                    const spanClass = `col-span-${schemaItem.display_attributes.width || 12}`;
                    
                    return (
                      <div key={schemaItem.unique_id} className={spanClass}>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">
                              {schemaItem.display_attributes.display_name}
                            </label>
                            {schemaItem.display_attributes.isRequired && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          
                          {/* Render input based on type */}
                          {schemaItem.display_attributes.input_type === "text" && (
                            <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
                              <span className="text-sm text-gray-500">Text input field</span>
                            </div>
                          )}
                          
                          
                          {schemaItem.display_attributes.input_type === "radio" && (
                            <div className="space-y-2">
                              {schemaItem.display_attributes.display_radio_options?.map((option, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <div className="w-4 h-4 border border-gray-300 rounded-full bg-gray-50"></div>
                                  <span className="text-sm text-gray-600">{option}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {schemaItem.display_attributes.input_type === "checkbox" && (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border border-gray-300 rounded bg-gray-50"></div>
                              <span className="text-sm text-gray-600">Checkbox option</span>
                            </div>
                          )}
                          
                          {schemaItem.display_attributes.input_type === "fileUpload" && (
                            <div className="p-4 border-2 border-dashed border-gray-300 rounded-md bg-gray-50 text-center">
                              <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                              <span className="text-sm text-gray-500">File upload area</span>
                            </div>
                          )}
                          
                          {schemaItem.display_attributes.input_type === "signature" && (
                            <div className="p-4 border-2 border-dashed border-gray-300 rounded-md bg-gray-50 text-center">
                              <div className="w-8 h-8 mx-auto mb-2 bg-gray-400 rounded"></div>
                              <span className="text-sm text-gray-500">Digital signature area</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
          
          {/* Preview submit button */}
          <div className="pt-6 border-t border-gray-200">
            <Button className="w-full" disabled>
              Submit Form (Preview Mode)
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default ClientIntakeFormPreview;