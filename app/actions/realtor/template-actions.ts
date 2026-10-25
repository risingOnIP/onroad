"use server";

import { getAuthToken } from "../general";
import {
  SignatureInput,
  TemplateForm,
  Template,
  Stage,
} from "@/components/files/types/realtor";

const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL;

export async function getTemplate(templateId: string) {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/realtor/templates/get-template/${templateId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.json() as unknown as Template;
}


export async function getTemplateForms(formattedTemplate: string) {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/realtor/templates/get-forms/${formattedTemplate}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Failed to fetch deal options:", errorData);
    throw new Error(errorData.error || "Failed to fetch deal options");
  }

  const result = (await response.json()) as TemplateForm[];
  return result;
}

export async function getTemplateFormsById(templateId: string) {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/realtor/templates/get-forms/by-template-id/${templateId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    console.error("Failed to fetch template form:", errorData);
    throw new Error(errorData.error || "Failed to fetch template form");
  }
  return response.json() as unknown as TemplateForm[];
}

export async function addTemplateForm(
  formattedTemplate: string,
  form_type: string,
  deal_wide: boolean
) {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/realtor/templates/addform/${formattedTemplate}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ form_type, deal_wide }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Failed to add template form:", errorData);
    throw new Error(errorData.error || "Failed to add template form");
  }

  const result = (await response.json()) as TemplateForm;
  return result;
}

export async function addTemplateFormByTemplateId(templateId: string, form_type: string, deal_wide: boolean, form_stage?: string) {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/realtor/templates/addform/by-template-id/${templateId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ form_type, deal_wide, form_stage }),

    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    console.error("Failed to add template form:", errorData);
    throw new Error(errorData.error || "Failed to add template form");
  } 
  return response.json() as unknown as TemplateForm;  
}

export async function updateTemplateFormResponse(
  formId: string,
  itemKey: string,
  newValue: string | string[] | SignatureInput
) {
  const token = await getAuthToken();
  await fetch(
    `${API_BASE_URL}/realtor/templates/updateTemplateFormResponse/${formId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        itemKey,
        newValue,
      }),
    }
  );
}

export async function updateTemplateFormStage(
  formId: string,
  newStage: string
) {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/realtor/templates/updateTemplateFormStage/${formId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        form_stage: newStage,
      }),
    }
  );
  
  if (!response.ok) {
    const errorData = await response.json();
    console.error("Failed to update template form stage:", errorData);
    throw new Error(errorData.error || "Failed to update template form stage");
  }
}

export async function fetchTemplateFormResponses(formId: string) {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/realtor/templates/getFormResponses/${formId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  const returning = (await response.json()) as unknown as Record<
    string,
    string
  >;
  return returning;
}

export async function getIndividualTemplateForm(formId: string) {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/realtor/templates/get-individual-template-form/${formId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.json() as unknown as TemplateForm;
}

export async function addTemplateType(template: string) {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/realtor/templates/addTemplate/${template}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.json() as unknown as Template;
}

export async function getAllTemplates() {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/realtor/templates/getAllTemplates`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.json() as unknown as Template[];
}

export async function getAllTemplateNames() {
  const templates = await getAllTemplates();
  return templates.map((template) => template.name);
}

export async function getStageByTemplateId(templateId: string) {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/realtor/templates/getStagesById/${templateId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.json() as unknown as Stage[];
}

export async function deleteTemplateFormById(formId: string) {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/realtor/templates/${formId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.json() as unknown as {
    message: string;  
    success: boolean;
  };
}
