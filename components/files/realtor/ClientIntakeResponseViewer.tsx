"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  ArrowLeft,
  FileText,
} from "lucide-react";
import {
  PartyIntake,
  PartyIntakeSchemaItem,
} from "@/components/files/types/realtor";
import { getSignedClientIntakeFileUploadUrls } from "@/app/actions/realtor/client-intake-actions";

interface ClientIntakeResponseViewerProps {
  intake: PartyIntake;
  onBack: () => void;
}

const ClientIntakeResponseViewer: React.FC<ClientIntakeResponseViewerProps> = ({
  intake,
  onBack,
}) => {
  const [fileUrls, setFileUrls] = useState<Record<string, string[]>>({});
  const [loadingFiles, setLoadingFiles] = useState<Record<string, boolean>>({});

  const FileUploadResponse: React.FC<{ 
    fieldId: string; 
    value: string | string[]; 
  }> = ({ fieldId, value }) => {
    const usingValue: string[] = Array.isArray(value) ? value : [value];
    const urls = fileUrls[fieldId];
    const isLoading = loadingFiles[fieldId];

    useEffect(() => {
      if (!urls && !isLoading) {
        setLoadingFiles(prev => ({ ...prev, [fieldId]: true }));
        
        getSignedClientIntakeFileUploadUrls(usingValue)
          .then(fetchedUrls => {
            setFileUrls(prev => ({ ...prev, [fieldId]: fetchedUrls }));
          })
          .catch(error => {
            console.error('Error fetching file URLs:', error);
          })
          .finally(() => {
            setLoadingFiles(prev => ({ ...prev, [fieldId]: false }));
          });
      }
    }, [fieldId, urls, isLoading, usingValue]);

    if (isLoading) {
      return (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading files...</p>
        </div>
      );
    }

    if (!urls || urls.length === 0) {
      return (
        <div className="text-center py-4">
          <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">No files uploaded</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {urls.map((url, index) => (
          <a 
            key={index} 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-600 hover:underline">
              View File {index + 1}
            </span>
          </a>
        ))}
      </div>
    );
  };

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

  const hasResponses =
    intake.party_response && Object.keys(intake.party_response).length > 0;

  if (!hasResponses) {
    return (
      <div className="space-y-6 p-6 h-full overflow-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Client Intake Responses</h1>
            <p className="text-gray-600">{intake.email} - No responses yet</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Responses Yet
            </h3>
            <p className="text-gray-500">
              This client hasn&apos;t submitted their intake form responses yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const groupedSchema = groupSchemaBySection(intake.party_intake_form_schema);

  return (
    <div className="space-y-6 p-6 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            Client Intake Responses
          </h1>
          <p className="text-gray-600">
            {intake.email} - {intake.partyrole_partynumber}
          </p>
        </div>
      </div>

      {/* Response Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="font-medium text-green-800">Response Submitted</span>
        </div>
        <p className="text-sm text-green-700">
          Client completed the intake form with{" "}
          {Object.keys(intake.party_response).length} responses
        </p>
      </div>


      {/* Responses by Section */}
      {Object.entries(groupedSchema).map(([sectionName, items]) => (
        <Card key={sectionName} className="border border-gray-200">
          <CardHeader className="pb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {sectionName}
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {items
              .sort(
                (a, b) =>
                  a.display_attributes.order - b.display_attributes.order
              )
              .map((schemaItem) => {
                const responseValue =
                  intake.party_response[schemaItem.unique_id];
                const isAnswered =
                  responseValue !== undefined && responseValue !== "";
                const isFileUpload =
                  schemaItem.display_attributes.input_type === "fileUpload";

                return (
                  <div
                    key={schemaItem.unique_id}
                    className="flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">
                        {schemaItem.display_attributes.display_name}
                      </label>
                      {schemaItem.display_attributes.isRequired && (
                        <Badge variant="secondary" className="text-xs">
                          Required
                        </Badge>
                      )}
                      {isFileUpload && (
                        <Badge variant="outline" className="text-xs">
                          File Upload
                        </Badge>
                      )}
                    </div>

                    {isFileUpload ? (
                      // Special handling for file uploads
                      <div className="rounded-lg border border-gray-200 p-3">
                        {isAnswered && responseValue ? (
                          <FileUploadResponse 
                            fieldId={schemaItem.unique_id} 
                            value={responseValue} 
                          />
                        ) : (
                          <div className="text-center py-4">
                            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm text-gray-500">
                              No files uploaded
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Regular response display
                      <div
                        className={`p-3 rounded-lg border ${
                          isAnswered
                            ? "bg-blue-50 border-blue-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <span
                          className={`text-sm ${
                            isAnswered ? "text-blue-900" : "text-gray-500"
                          }`}
                        >
                          {responseValue}
                        </span>
                      </div>
                    )}

                    {schemaItem.display_attributes.input_type === "radio" &&
                      schemaItem.display_attributes.display_radio_options && (
                        <div className="text-xs text-gray-500 mt-1">
                          Options:{" "}
                          {schemaItem.display_attributes.display_radio_options.join(
                            ", "
                          )}
                        </div>
                      )}
                  </div>
                );
              })}
          </CardContent>
        </Card>
      ))}

      {/* Response Metadata */}
      <Card className="bg-gray-50 border border-gray-200">
        <CardHeader className="pb-3">
          <h3 className="text-sm font-medium text-gray-700">
            Response Details
          </h3>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Client Email:</span>
            <span className="font-medium">{intake.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Client Role:</span>
            <span className="font-medium">{intake.partyrole_partynumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Form Created:</span>
            <span className="font-medium">
              {new Date(intake.created_at || "").toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Questions:</span>
            <span className="font-medium">
              {intake.party_intake_form_schema.length}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Responses Provided:</span>
            <span className="font-medium">
              {Object.keys(intake.party_response).length}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientIntakeResponseViewer;
