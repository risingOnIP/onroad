

"use server";

import { PartyIntakeSchema, PartyIntakeTemplate, SchemaItem } from "@/components/files/types/realtor";
import { getAuthToken } from "../general";

const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL;

export type SchemaType = 'buyer1_schema' | 'buyer2_schema' | 'seller1_schema' | 'seller2_schema';

export async function getPartyIntakeSchemaFromTemplate(templateName: string, schemaType: SchemaType = 'buyer1_schema') {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/realtor/party-intake-templates/get-template/${templateName}/${schemaType}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to get party intake template:", errorData);
        throw new Error(errorData.error || "Failed to get party intake template");
    }

    const template = await response.json();
    return template as unknown as PartyIntakeSchema;
}

export async function getAllSchemasForTemplate(templateName: string) {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/realtor/party-intake-templates/get-all-schemas/${templateName}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to get all schemas for template:", errorData);
        throw new Error(errorData.error || "Failed to get all schemas for template");
    }

    const schemas = await response.json();
    return schemas;
}

export async function updatePartyIntakeTemplateItem(templateName: string, schemaItem: SchemaItem, schemaType: SchemaType) {


    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/realtor/party-intake-templates/update-schema-item/${templateName}/${schemaType}`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ schemaItem }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to update party intake template item:", errorData);
        throw new Error(errorData.error || "Failed to update party intake template item");
    }

    const newitem = await response.json();
    return newitem;
}

export async function savePartyIntakeSchema(partyIntakeTemplateId: string, toSaveSchema: PartyIntakeSchema, schemaType: SchemaType) {

    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/realtor/party-intake-templates/save/${partyIntakeTemplateId}`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ toSaveSchema, schemaType }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to save party intake schema:", errorData);
        throw new Error(errorData.error || "Failed to save party intake schema");
    }

    const newSchema = await response.json() as PartyIntakeSchema;
    return newSchema;

}

export async function addSchemaItemToTemplate(templateName: string, schemaItem: SchemaItem, schemaType: SchemaType = 'buyer1_schema') {

    
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/realtor/party-intake-templates/add-schema-item/${templateName}/${schemaType}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ schemaItem }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to add schema item to template:", errorData);
        throw new Error(errorData.error || "Failed to add schema item to template");
    }

    const newitem = await response.json();
    return newitem;
}

export async function getAllPartyIntakeTemplates() {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/realtor/party-intake-templates/get-all-templates`, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to get all party intake templates:", errorData);
        throw new Error(errorData.error || "Failed to get all party intake templates");
    }
    const templates = await response.json();
    return templates as unknown as PartyIntakeTemplate[];
}

export async function getPartyIntakeTemplatesByDealSide(dealSide: string) {
    const token = await getAuthToken(); 
    const response = await fetch(`${API_BASE_URL}/realtor/party-intake-templates/get-by-dealside/${dealSide}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to get all party intake templates:", errorData);
        throw new Error(errorData.error || "Failed to get all party intake templates");
    }
    const templates = await response.json();
        return templates as unknown as PartyIntakeTemplate[];
}


export async function getAllPartyIntakeTemplateNamesByDealSide(dealSide: string) {
    const templates = await getPartyIntakeTemplatesByDealSide(dealSide);
    return templates.map((template) => template.name);
}

export async function addPartyIntakeTemplate(templateName:string) {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/realtor/party-intake-templates/add-template/${templateName}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to add party intake template:", errorData);
        throw new Error(errorData.error || "Failed to add party intake template");
    }
    const template = await response.json();
    return template;
}