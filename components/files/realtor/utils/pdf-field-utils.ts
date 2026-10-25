import { PDFFieldPosition } from "@/components/files/types/realtor";

// Define interfaces locally
interface CustomFormField {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  label: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  signatureConfig?: any;
}

interface CustomSchemaItem {
  unique_id: string;
  display_attributes: {
    display_name: string;
    input_type: string;
    required?: boolean;
    placeholder?: string;
    default_value?: string;
    signature_config?: any;
  };
}

/**
 * Converts custom form fields to schema items for form processing
 */
export function convertFieldsToSchema(fields: CustomFormField[]): CustomSchemaItem[] {
  return fields.map(field => ({
    unique_id: field.id,
    display_attributes: {
      display_name: field.label,
      input_type: field.type,
      required: field.required,
      placeholder: field.placeholder,
      default_value: field.defaultValue,
      signature_config: field.signatureConfig,
    },
  }));
}

/**
 * Normalizes pixel coordinates to 0-1 range based on page dimensions
 */
export function normalizeCoordinates(
  x: number,
  y: number,
  width: number,
  height: number,
  pageWidth: number,
  pageHeight: number
): { x: number; y: number; width: number; height: number } {
  return {
    x: x / pageWidth,
    y: y / pageHeight,
    width: width / pageWidth,
    height: height / pageHeight,
  };
}

/**
 * Denormalizes 0-1 range coordinates to pixel values
 */
export function denormalizeCoordinates(
  x: number,
  y: number,
  width: number,
  height: number,
  pageWidth: number,
  pageHeight: number
): { x: number; y: number; width: number; height: number } {
  return {
    x: x * pageWidth,
    y: y * pageHeight,
    width: width * pageWidth,
    height: height * pageHeight,
  };
}

/**
 * Validates field positions to ensure they're within bounds
 */
export function validateFieldPosition(field: CustomFormField): boolean {
  return (
    field.x >= 0 &&
    field.x <= 1 &&
    field.y >= 0 &&
    field.y <= 1 &&
    field.width > 0 &&
    field.width <= 1 &&
    field.height > 0 &&
    field.height <= 1 &&
    field.x + field.width <= 1 &&
    field.y + field.height <= 1
  );
}

/**
 * Groups fields by page number
 */
export function groupFieldsByPage(fields: CustomFormField[]): Map<number, CustomFormField[]> {
  const grouped = new Map<number, CustomFormField[]>();
  
  fields.forEach(field => {
    const pageFields = grouped.get(field.page) || [];
    pageFields.push(field);
    grouped.set(field.page, pageFields);
  });
  
  return grouped;
}

/**
 * Generates a unique field ID
 */
export function generateFieldId(type: string): string {
  return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Default field dimensions for different field types
 */
export const DEFAULT_FIELD_DIMENSIONS = {
  text: { width: 0.25, height: 0.04 },
  checkbox: { width: 0.03, height: 0.03 },
  signature: { width: 0.2, height: 0.08 },
} as const;

/**
 * Converts field positions to the format expected by the database
 */
export function convertToPDFFieldPositions(
  fields: CustomFormField[],
  formId: string
): PDFFieldPosition[] {
  return fields.map(field => ({
    formId,
    fieldId: field.id,
    pageNumber: field.page,
    xPosition: field.x,
    yPosition: field.y,
    width: field.width,
    height: field.height,
  }));
}

/**
 * Converts database field positions back to custom form fields
 */
export function convertFromPDFFieldPositions(
  positions: PDFFieldPosition[],
  schema: CustomSchemaItem[]
): CustomFormField[] {
  const schemaMap = new Map(schema.map(item => [item.unique_id, item]));
  
  return positions.map(pos => {
    const schemaItem = schemaMap.get(pos.fieldId);
    if (!schemaItem) {
      throw new Error(`Schema item not found for field ${pos.fieldId}`);
    }
    
    return {
      id: pos.fieldId,
      type: schemaItem.display_attributes.input_type,
      x: pos.xPosition,
      y: pos.yPosition,
      width: pos.width,
      height: pos.height,
      page: pos.pageNumber,
      label: schemaItem.display_attributes.display_name,
      required: schemaItem.display_attributes.required || false,
      placeholder: schemaItem.display_attributes.placeholder,
      defaultValue: schemaItem.display_attributes.default_value,
      signatureConfig: schemaItem.display_attributes.signature_config,
    } as CustomFormField;
  });
}

/**
 * Constructs a public URL for a PDF stored in Supabase storage
 * @param storagePath The path returned from file upload (e.g., "user-id/file-name.pdf")
 * @param bucketName The storage bucket name (default: "pdf-uploads")
 * @returns The public URL for the PDF
 */
export function getStorageUrl(storagePath: string, bucketName: string = "pdf-uploads"): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined");
  }
  
  // Remove any leading slashes
  const cleanPath = storagePath.startsWith('/') ? storagePath.slice(1) : storagePath;
  
  // Construct the public URL
  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${cleanPath}`;
}

/**
 * Checks if a form has custom fields defined
 */
export function hasCustomFields(form: { custom_schema?: CustomSchemaItem[] }): boolean {
  return Boolean(form.custom_schema && form.custom_schema.length > 0);
}

/**
 * Gets signature fields from custom schema
 */
export function getSignatureFieldsFromSchema(schema: CustomSchemaItem[]): CustomSchemaItem[] {
  return schema.filter(item => item.display_attributes.input_type === 'signature');
}