"use client";

import {
  updateTemplateFormResponse,
  fetchTemplateFormResponses,
} from "@/app/actions/realtor/template-actions";
import { getSchemaByFormType } from "@/app/actions/realtor/schema";
import {
  getIndividualTemplateForm,
  addTemplateType,
  getAllTemplateNames,
} from "@/app/actions/realtor/template-actions";

import OptimizedFormInput from "@/components/files/realtor/OptimizedFormInput";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React, { useEffect, useState } from "react";
import { SchemaItem, SignatureInput } from "@/components/files/types/realtor";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TemplateFormMainContentProps {
  formattedTemplate: string;
  setFormattedTemplate: (formattedTemplate: string) => void;
  fetchTemplateForms: (formattedTemplate: string) => void;
  activeFormId: string | null;
}

const TemplateFormMainContent = ({
  setFormattedTemplate,
  fetchTemplateForms,
  activeFormId,
}: TemplateFormMainContentProps) => {
  const [templateField1, setTemplateField1] = useState<string>("");
  const [templateField2, setTemplateField2] = useState<string>("");
  const [templateField3, setTemplateField3] = useState<string>("");
  const [schema, setSchema] = useState<SchemaItem[]>([]);
  const [allTemplates, setAllTemplates] = useState<string[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [formResponses, setFormResponses] = useState<Record<string, string>>(
    {}
  );
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);

  const [isAddTypeModalOpen, setIsAddTypeModalOpen] = useState(false);
  const [newTemplateTypeName, setNewTemplateTypeName] = useState("");
  const [isSavingNewType, setIsSavingNewType] = useState(false);

  useEffect(() => {
    const loadAllTemplates = async () => {
      setIsLoadingTemplates(true);
      try {
        // Replace with your actual function call when available
        // const fetchedTemplates = await getAllTemplateNames();
        // Using mock data for now:
        const fetchedTemplates = await getAllTemplateNames();
        // Log the templates right after fetching/assigning
        setAllTemplates(fetchedTemplates);
      } catch (error) {
        console.error("Failed to fetch all template names:", error);
        setAllTemplates([]); // Set empty on error
      } finally {
        setIsLoadingTemplates(false);
      }
    };
    loadAllTemplates();
  }, []); // Empty dependency array means run once on mount

  useEffect(() => {
    if (templateField1 && templateField2 && templateField3) {
      const name = `${templateField1}-${templateField2}-${templateField3}`;
      setFormattedTemplate(name);
      fetchTemplateForms(name);
    } else {
      setFormattedTemplate("");
    }
  }, [
    templateField1,
    templateField2,
    templateField3,
    setFormattedTemplate,
    fetchTemplateForms,
  ]);

  useEffect(() => {
    if (activeFormId) {
      const loadSchema = async () => {
        try {
          const templateForm = await getIndividualTemplateForm(activeFormId);
          const schemaData = await getSchemaByFormType(templateForm.form_type);
          setSchema(schemaData as SchemaItem[]);
        } catch (error) {
          console.error("Error loading schema:", error);
        }
      };
      loadSchema();
    }
  }, [activeFormId]);

  useEffect(() => {
    if (activeFormId) {
      const loadResponses = async () => {
        setIsLoadingResponses(true);
        try {
          const responses = await fetchTemplateFormResponses(activeFormId);
          setFormResponses(responses);
        } catch (error) {
          console.error("Error loading form responses:", error);
        } finally {
          setIsLoadingResponses(false);
        }
      };
      loadResponses();
    } else {
      setFormResponses({});
    }
  }, [activeFormId]);

  let availableTemplateTypes: string[] = [];
  if (templateField1 && templateField2 && allTemplates.length > 0) {
    const prefix = `${templateField1}-${templateField2}-`;
    availableTemplateTypes = allTemplates
      .filter((template) => template.startsWith(prefix))
      .map((template) => template.split("-")[2])
      .filter((value, index, self) => self.indexOf(value) === index);
  }

  useEffect(() => {
    if (templateField3 && !availableTemplateTypes.includes(templateField3)) {
      setTemplateField3("");
    }
  }, [availableTemplateTypes, templateField3]);

  function handleTemplateField1Change(value: string): void {
    setTemplateField1(value);
    setTemplateField3("");
  }

  function handleTemplateField2Change(value: string): void {
    setTemplateField2(value);
    setTemplateField3("");
  }

  function handleTemplateField3Change(value: string): void {
    setTemplateField3(value);
  }

  function handleAddTemplateType(type: string): void {
    if (!templateField1 || !templateField2 || !type) {
      console.error("Cannot add template type: missing fields");
      alert("Cannot add template type: missing fields");
      return;
    }
    const newTemplate = `${templateField1}-${templateField2}-${type
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")}`;
    addTemplateType(newTemplate);
  }

  const handleSaveNewType = async () => {
    const trimmedName = newTemplateTypeName.trim();
    if (!trimmedName) {
      alert("Please enter a name for the new template type.");
      return;
    }
    if (trimmedName.includes("-") || trimmedName.includes("/")) {
      alert("Template type name cannot contain dashes (-) or slashes (/).");
      return;
    }
    const sanitizedExisting = availableTemplateTypes.map((t) =>
      t.toLowerCase()
    );
    if (
      sanitizedExisting.includes(trimmedName.toLowerCase().replace(/\s+/g, "_"))
    ) {
      alert(
        `Template type '${trimmedName}' already exists for this combination.`
      );
      return;
    }

    setIsSavingNewType(true);
    try {
      handleAddTemplateType(trimmedName);
      setNewTemplateTypeName("");
      setIsAddTypeModalOpen(false);
    } catch (error) {
      console.error("Error saving new template type:", error);
      alert("Failed to save new template type.");
    } finally {
      setIsSavingNewType(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-screen">
      <div className="w-full p-2">
        <div className="flex gap-2">
          <Select
            value={templateField1}
            onValueChange={handleTemplateField1Change}
          >
            <SelectTrigger className="flex-1 min-w-[100px] text-center justify-center">
              <SelectValue placeholder="Deal Side" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buy" className="text-center">
                Buy
              </SelectItem>
              <SelectItem value="sell" className="text-center">
                Sell
              </SelectItem>
              <SelectItem value="lease" className="text-center">
                Lease
              </SelectItem>
              <SelectItem value="rent" className="text-center">
                Rent
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={templateField2}
            onValueChange={handleTemplateField2Change}
          >
            <SelectTrigger className="flex-1 min-w-[100px] text-center justify-center">
              <SelectValue placeholder="Property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="residential" className="text-center">
                Residential
              </SelectItem>
              <SelectItem value="commercial" className="text-center">
                Commercial
              </SelectItem>
              <SelectItem value="improved_land" className="text-center">
                Improved Land
              </SelectItem>
              <SelectItem value="unimproved_land" className="text-center">
                Unimproved Land
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={templateField3}
            onValueChange={handleTemplateField3Change}
            disabled={!templateField1 || !templateField2 || isLoadingTemplates}
          >
            <SelectTrigger className="flex-1 min-w-[100px] text-center justify-center">
              <SelectValue placeholder="Template type" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingTemplates ? (
                <div className="text-center text-sm text-muted-foreground p-2">
                  Loading...
                </div>
              ) : availableTemplateTypes.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground p-2">
                  No types available
                </div>
              ) : (
                availableTemplateTypes.map((templateType: string) => (
                  <SelectItem
                    key={templateType}
                    value={templateType}
                    className="text-center"
                  >
                    {templateType.charAt(0).toUpperCase() +
                      templateType.slice(1).replace(/_/g, " ")}
                  </SelectItem>
                ))
              )}
              {!isLoadingTemplates && templateField1 && templateField2 && (
                <>
                  <Separator className="my-1" />
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm p-2 h-auto font-normal"
                    onClick={() => setIsAddTypeModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Template Type
                  </Button>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      {activeFormId && (
        <Card className="flex-1 m-2">
          <CardContent className="p-4">
            <OptimizedFormInput
              dealOptionId={activeFormId}
              key={activeFormId}
              can_edit={true}
              schema={schema}
              initialFormResponses={formResponses}
              formResponseUpdateByField={(
                itemKey: string,
                newValue: string | string[] | SignatureInput
              ) => updateTemplateFormResponse(activeFormId, itemKey, newValue)}
              loading={isLoadingResponses}
            />
          </CardContent>
        </Card>
      )}

      <Dialog open={isAddTypeModalOpen} onOpenChange={setIsAddTypeModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Template Type</DialogTitle>
            <DialogDescription>
              Enter a name for the new template type (e.g., Luxury, Starter
              Home). It will be combined with {templateField1 || "[Side]"}-
              {templateField2 || "[Property]"}-.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-template-type-name" className="text-right">
                Name
              </Label>
              <Input
                id="new-template-type-name"
                value={newTemplateTypeName}
                onChange={(e) => setNewTemplateTypeName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Custom Basic"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddTypeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNewType}
              disabled={isSavingNewType || !newTemplateTypeName.trim()}
            >
              {isSavingNewType ? "Saving..." : "Save Type"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateFormMainContent;
