"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useState } from "react";
import { getTemplateForms } from "@/app/actions/realtor/template-actions";
import TemplateFormMainContent from "./TemplateFormMainContent";
import { TemplateForm } from "@/components/files/types/realtor";
import TemplateFormSidebar from "./TemplateFormSidebar";

const TemplatePage = () => {
  const [formattedTemplate, setFormattedTemplate] = useState<string>("");
  const [templateForms, setTemplateForms] = useState<TemplateForm[]>([]);
  const [activeFormId, setActiveFormId] = useState<string | null>(null);

  const fetchTemplateForms = async (formattedTemplate: string) => {
    const templateForms = await getTemplateForms(formattedTemplate);
    setTemplateForms(templateForms);
  };


  return (
    <div className="flex-grow flex w-full h-full">
      <SidebarProvider>
        <div className="flex w-full h-full">
          <div className="h-full">
            <TemplateFormSidebar
              templateForms={templateForms}
              formattedTemplate={formattedTemplate}
              activeFormId={activeFormId}
              setActiveFormId={setActiveFormId}
            />
          </div>
          <div className="flex-1 h-full flex flex-col">
            <div className="sticky top-0 z-10 bg-white">
              <SidebarTrigger />
            </div>
            <div className="flex-grow overflow-auto">
              <TemplateFormMainContent
                formattedTemplate={formattedTemplate}
                setFormattedTemplate={setFormattedTemplate}
                activeFormId={activeFormId}
                fetchTemplateForms={fetchTemplateForms}
              />
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default TemplatePage;
