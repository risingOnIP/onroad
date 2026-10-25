//DO NOT DELETE THIS FILE; we can fix it and need it


"use client";

import React, { useEffect, useState } from "react";

import SidebarTop from "@/components/files/realtor/SidebarTop";
import SidebarBottom from "@/components/files/realtor/SidebarBottom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { Folder } from "lucide-react";

import { getAvailableFormsFromTemplate } from "@/app/actions/realtor/form-actions";
import { addTemplateForm } from "@/app/actions/realtor/template-actions";
import FormList from "@/components/files/realtor/FormList";
import { TemplateForm } from "@/components/files/types/realtor";

/* ───────────────── types ───────────────── */
interface TemplateFormSidebarProps {
  formattedTemplate: string;
  templateForms: TemplateForm[];
  activeFormId: string | null;
  setActiveFormId: (formId: string) => void;
}

/* ───────────────── component ───────────────── */
const TemplateFormSidebar = ({
  formattedTemplate,
  templateForms,
  activeFormId,
  setActiveFormId
}: TemplateFormSidebarProps) => {
  const [availableForms, setAvailableForms] = useState<string[]>([]);

  /* ───────── fetch available form types ───────── */
  useEffect(() => {
    async function fetchAvailableForms() {
      if (!formattedTemplate) return;
      try {
        const forms = await getAvailableFormsFromTemplate(formattedTemplate); //route doesn't exist
        setAvailableForms(forms);
      } catch (error) {
        console.error("Error fetching available forms:", error);
      }
    }
    fetchAvailableForms();
  });

  /* ───────── helpers ───────── */
  const handleFormClick = (formId: string) => setActiveFormId(formId);

  const addDealFormToBackend = async (form_type: string) =>
    addTemplateForm(formattedTemplate, form_type, true);

  const addDealOptionFormToBackend = async (form_type: string) =>
    addTemplateForm(formattedTemplate, form_type, false);

  const onFormDeleted = (formId: string) => {
  };

  /* ───────── basic categorisation ───────── */
  // You can adjust these predicates to match your schema
  const dealOptionForms = templateForms.filter(
    f => f.deal_wide === false
  );
  const dealForms = templateForms.filter(f => f.deal_wide === true);

  /* ───────── render ───────── */
  //this is my change
  return (
    <div className="flex h-full flex-col">
      <Sidebar className="flex grow flex-col overflow-hidden">
        <SidebarTop display="Template Builder" />

        <SidebarContent className="flex grow flex-col space-y-2 pb-4">
          {/* template title */}
          <p className="px-2 pt-2 text-sm font-medium text-muted-foreground">
            {formattedTemplate} 
            
          </p>

          {/* ───── Deal-Option Forms group ───── */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold hover:bg-muted">
                <Folder className="h-4 w-4" />
                Deal Option Forms
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-3">
              <FormList
                forms={dealOptionForms}
                handleFormClick={handleFormClick}
                activeFormId={activeFormId}
                availableForms={availableForms}
                addFormToBackend={addDealOptionFormToBackend}
                updateFormOrderInBackend={async () => {}}
                onFormDeleted={onFormDeleted}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* ───── Deal Forms group ───── */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold hover:bg-muted">
                <Folder className="h-4 w-4" />
                Deal Forms
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-3">
              <FormList
                forms={dealForms}
                handleFormClick={handleFormClick}
                activeFormId={activeFormId}
                availableForms={availableForms}
                addFormToBackend={addDealFormToBackend}
                updateFormOrderInBackend={async () => {}}
                onFormDeleted={onFormDeleted}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* separator before footer */}
          <Separator className="mt-auto" />
        </SidebarContent>

        <SidebarFooter>
          <SidebarBottom />
        </SidebarFooter>
      </Sidebar>
    </div>
  );
};

export default TemplateFormSidebar;
