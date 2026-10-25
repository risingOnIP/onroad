"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  FileText,
  X,
} from "lucide-react";
import {
  PartyIntake,
  PartyIntakeSchemaItem,
} from "@/components/files/types/realtor";

interface PublishIntakeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  intake: PartyIntake | null;
  onConfirmPublish: () => void;
  isPublishing?: boolean;
}

const PublishIntakeDialog: React.FC<PublishIntakeDialogProps> = ({
  isOpen,
  onClose,
  intake,
  onConfirmPublish,
  isPublishing = false,
}) => {
  if (!intake) return null;

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              Publish Client Intake Form
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Review how your client will see this form before publishing
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-blue-900">
                {intake.email} - {intake.partyrole_partynumber}
              </h3>
            </div>
            <p className="text-sm text-blue-800">
              This form will be sent to the client via a secure, personalized link.
            </p>
          </div>

          {/* Form Preview */}
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
                  Client View
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
              {/* Render each section */}
              {Object.entries(groupedSchema).map(([sectionName, items], index) => (
                <div key={sectionName} className="mb-6">
                  <div className="mb-3 pb-2 border-b border-gray-200">
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
                                <div className="p-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-500">
                                  Text input field
                                </div>
                              )}
            
                              
                              {schemaItem.display_attributes.input_type === "radio" && (
                                <div className="space-y-1">
                                  {schemaItem.display_attributes.display_radio_options?.map((option, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                      <div className="w-3 h-3 border border-gray-300 rounded-full bg-gray-50"></div>
                                      <span className="text-xs text-gray-600">{option}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {schemaItem.display_attributes.input_type === "checkbox" && (
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 border border-gray-300 rounded bg-gray-50"></div>
                                  <span className="text-xs text-gray-600">Checkbox option</span>
                                </div>
                              )}
                              
                              {schemaItem.display_attributes.input_type === "fileUpload" && (
                                <div className="p-3 border-2 border-dashed border-gray-300 rounded-md bg-gray-50 text-center">
                                  <FileText className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                                  <span className="text-xs text-gray-500">File upload area</span>
                                </div>
                              )}
                              
                              {schemaItem.display_attributes.input_type === "signature" && (
                                <div className="p-3 border-2 border-dashed border-gray-300 rounded-md bg-gray-50 text-center">
                                  <div className="w-6 h-6 mx-auto mb-1 bg-gray-400 rounded"></div>
                                  <span className="text-xs text-gray-500">Digital signature area</span>
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
              <div className="pt-4 border-t border-gray-200">
                <Button className="w-full" disabled>
                  Submit Form (Preview Mode)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirmPublish} 
            disabled={isPublishing}
            className="bg-green-600 hover:bg-green-700"
          >
            {isPublishing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Publishing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Confirm & Publish
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PublishIntakeDialog;