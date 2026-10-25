import { ChatMessage } from "@/components/ai/types";

export interface Deal {
  id: string;
  user_id: string;
  created_at: Date;
  dealName: string;
  template: string;
  isActive: boolean;
  dealSide: "buy" | "rent" | "sell" | "lease";
  partyIntakeTemplate: string;
  steps_statuses: {stepId: string, status: StepStatus}[]; 
}

export type StepStatus = "completed" | "current" | "upcoming";



export interface DealSubPage { 
 tab: 'timeline' | 'clients' | 'forms' | 'files' | 'settings';
  

}



export interface RealtorPageNavigation {
  area: "workspace" | "inside_deal" | "crm" | "templates" | "help-docs" | "first-sign-in";
  
  // Deal-specific navigation (when area === "deal")
  deal?: {
    dealId: string;
    
    // Simple navigation state
    tab: 'timeline' | 'clients' | 'forms' | 'settings';

    clients?: {
        clientTab?: "all" | "yours" | "properties";
        clientSection?: "management" | "intakes" | "portals";
        editingIntake?: string;
        viewingResponses?: string;
        previewingIntake?: string;
        selectedClientIntakeId?: string;
    }
 
 
    forms?: {
        viewMode?: 'list' | 'form-editor' | 'property-editor' | 'preview' | 'finalized';
        selectedFormId?: string;
        selectedPropertyId?: string;
    }
  }
  // Templates-specific navigation (when area === "templates")
  templates?: {
    tab: 'create' | 'modify' 
    modify?: {
        type: "transaction_forms" | "client_intake"
        templateId?: string; 
    }
  };
  
  // Info page navigation (when area === "info_page")
  help_docs?: {
    tab: 'getting-started' | 'deal-management' | 'forms-and-templates' | 'ai-features' | 'pdf-editor';
  };
  
}

export interface AIConnectionTether {
  role: 'realtor' | 'broker' | 'client' | 'tenant' 
  pageNavigation: RealtorPageNavigation;
  fullConversation: ChatMessage[];
}



export interface DealOption {
  id: string;
  deal_id: string;
  user_id: string;
  address: string;
  is_selected: boolean;
  created_at: Date;
  updated_at: Date;
  property_information_response: Record<string, string>;
  attribute_store: Record<string, string>;
}

export interface DealOptionFormMerged extends DealOption {
  forms: Form[];
}

export interface DealParty {
  id: string;
  deal_id: string;
  party_id: string;
  party_role:
    | "seller"
    | "buyer"
    | "landlord"
    | "tenant"
    | "seller_agent"
    | "buyer_agent"
    | "tenant_agent"
    | "landlord_agent";
  realtorIsRepresenting: boolean;
  partyNumber: number;
  created_at: Date;
  party_email: string;
}

export type SignatureInput = {
  actionAs: "signer" | "delegator";
  email: string;
};


export type FileUpload = {
  files: string[]; // Array of file URLs or identifiers
  count: number; // Number of files uploaded
  // Additional properties for file upload field component
  id?: string;
  originalName?: string;
  size?: number;
  type?: string;
  status?: 'uploaded' | 'error';
  uploadedAt?: Date;
  url?: string;
};

export interface SignerAssignment {
  email: string;
  display_names?: string[]; // display names this person signs
  row_uuid: string; //uuid of signature row
  actionAs: string;
}

export type SignatureOutput = Record<string, string>; //unique id to signature png

export type FormResponse = Record<string, string | string [] | SignatureInput | FileUpload>; 

export interface PDFFieldPosition {
  formId: string;
  fieldId: string;
  pageNumber: number;
  xPosition: number;
  yPosition: number;
  width: number;
  height: number;
}


export interface Form {
  id: string;
  user_id: string;
  created_at: string;
  deal_option_id: string;
  form_type: string;
  form_response: FormResponse;
  order: number;
  signature_sequence: SignerAssignment[][];
  file_upload_pdf: string;
  finalized_pdf: string;
  custom_schema: Schema;
  pdf_field_metadata: PDFFieldPosition[] | Record<string, {
    type: string;
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    name?: string;
  }>;
  form_stage: string;
  review_stage?: 'not_sent' | 'reviewing' | 'approved';
}

export interface Template {
  id: string;
  created_at: string;
  user_id: string;
  name: string;
}

export interface TemplateForm {
  id: string;
  created_at: string;
  user_id: string;
  template_id: string;
  form_type: string;
  form_response: JSON;
  order: number;
  deal_wide: boolean;
  file_upload_pdf: string;
  form_stage?: string;
}

export interface Profile {
  user_id: string;
  role: string;
  created_at: string;
  firstName: string;
  lastName: string;
  email: string;
  broker_license: string;
  realtor_license_number: string;
}

export const numOperators: Record<string, (a: number, b: number) => boolean> = {
  ">": (a, b) => a > b,
  ">=": (a, b) => a >= b,
  "<": (a, b) => a < b,
  "<=": (a, b) => a <= b,
  "==": (a, b) => a == b,
  "===": (a, b) => a === b,
  "!=": (a, b) => a != b,
  "!==": (a, b) => a !== b,
};
export type operation = ">" | ">=" | "<" | "<=" | "==" | "!==" | "contains" | "doesNotContain";
export interface SchemaItem {
  unique_id: string;

  pdf_attributes?: {
    formType: string;               
    formfield: string | string[]; // PDF field name (no coordinates), string array for same value radio buttons pushing
    linked_form_fields_text?: string[]; // continuation boxes (left‑to‑right)
    linked_form_fields_radio?: { radioField: string; displayName: string }[];
    linked_form_fields_checkbox?: { fromDatabase: string; pdfAttribute: string}[];
    linked_dates?: { dateFieldName: string }[];
  }[];
  
  /** Rendering, linking, and validation */
  display_attributes: {
    display_name?: string;
    input_type: "text" | "radio" | "checkbox" | "signature" | "fileUpload" | "info" | "text-area";
    description?: string; 
    order: number;                   // global, increments by 1
    attribute?: {
      key: string; 
      operation?: (value: string | string[]) => string | string[]; 
      reverseOperation?: (reverseValue: string | string[]) => string | string[];
    };              // simple semantic tag ("address", "phone", etc.)
    block?: string;                  // optional grouping label
    block_style?: {

      title?: string;
      description?: string;
      icon?: string;                   
      color_theme?: 'blue' | 'green' | 'purple' | 'orange' | 'gray';
    }
    visibleIf?: {
      unique_id: string;
      operation: operation;
      valueChecked: string;
    }[];
    validation?: {
      loopback?: {
        regex: string,
        message: string; // if rule not met display this message to user
      }[]
      crossField?: {
        rule: ">" | ">=" | "<" | "<=" | "==" | "!==" 
        unique_id: string; // the unique_id of the field to check against
        message?: string; // if rule not met display this message to user
      }[]
    };
    placeholder?: string;
    width?: number;                  // 12‑unit grid
    display_radio_options?: string[];
    checkbox_options?: {
      options: {display_name: string, databaseStored: string, linkedFields?: string[]}[];
      maxSelected?: number;
      minSelected?: number;
    }
    
    value: {
      type: "manual" | "resolved" | "reserved";
      output?: "string" | "SignatureInput__signer" | "SignatureInput__delegator";
      supabase?: {
        table: string;
        column: string;
        eqBy: { columnName: string; hardCodedValue?: string; variable?: "dealId" | "dealOptionId" | "userId" }[];
      }[];
      reserved?: "landlord_name_csv" | "tenant_name_csv" | "realtor_name_spaced" | "property_street_address" | "buyer/tenant_name_csv" | "buyer/tenant_phone_number"| "landlord_phone_number"
    };

    breakBefore?: boolean; 

    /** Caching flag: set to true for realtor info */
    isCached?: boolean;  // true for fields such as realtor_name, realtor_number, realtor_phone, realtor_email, broker_firm_name
    isRequired?: boolean;
    isHidden?: boolean; 
    
    special_input?: {
      text?: {
        percentage?: boolean; //for text input
        phone?: boolean; //for text input
        date?: boolean; //for text input like January 1, 2025
        numbered_date?: boolean;  //like 01/01/2025
        month_year?: boolean; // for month/year picker (displays as "Month YYYY")
        currency?: boolean; //for text input with currency formatting
        number?: boolean; //for text input with number-only validation
        email?: boolean; //for text input with email validation
        url?: boolean; //for text input with URL validation
        minRows?: number; //for text-area input
        maxRows?: number; //for text-area input
        autoResize?: boolean; //for text-area input
      }
      checkbox?: {
        asRadio?: boolean; //for checkbox input
        horizontal?: number; //for checkbox input - number of columns
      },
      info?: {
        style?: 'default' | 'subtle' | 'minimal' | 'inline' | 'compact' | 'warning' | 'success' | 'error' | 'tip';
        icon?: boolean; //whether to show icon
        minimizable?: boolean; //whether user can minimize/collapse
      }
      radio?: {
        layout?: 'vertical' | 'horizontal' | 'grid';
        columns?: number; //for grid layout
      }
    }

  };
}

export interface IndividualKnowledgeRuleSet {
  version: string
  requiredForms: {
    formType:
      | "IABS"
      | "Third_party_financing";
    placement: "deal-wide" | "property-specific";
    form_stage: string;
  }[]; // auto-attached forms
  conditionalForms?: {
    if: {
      unique_id: string;
      rule: ">" | ">=" | "<" | "<=" | "==" | "!==";
      value?: string; // for regex / numeric rules
      idCheckedAgainst?: string; // cross-field
    };
    then: {
      formTypes: string[];
    };
  }[];
  suggestions?: { message: string; showTo: "user" | "ai" }[]; // best practice nudges to show to users or to give to ai
  partyIntakeSchemas: {
    buyer1_schema?: PartyIntakeSchema;
    buyer2_schema?: PartyIntakeSchema;
    seller1_schema?: PartyIntakeSchema;
    seller2_schema?: PartyIntakeSchema;
  };

  availableForms: AvailableForms;
  stages?: Stage[];
}

export type AvailableForms = {
  deal_wide: {
    formType: string;
    preferredStage?: string;
  }[];
  property_specific?: {
    formType: string;
    preferredStage?: string;
  }[];
}

export type Stage = {
  name: string;
  color: string;
  order: number;
};

export interface PartyIntakeSchemaItem
  extends Omit<SchemaItem, "pdf_attributes"> {
  mapping?: {
    formType: string;
    uniqueId: string;
    radio_mapping?: {
      option: string;
      mappedRadioField: string;
    }[];
  }[];
}

export type PartyIntakeSchema = PartyIntakeSchemaItem[];

export interface PartyIntake {
  id: string;
  email: string;
  deal_id: string;
  party_response: PartyResponse;
  realtor_id: string;
  party_intake_form_schema: PartyIntakeSchema;
  form_visible: boolean;
  created_at: string;
  party_id: string;
  partyrole_partynumber: string;
}

export type PartyResponse = Record<string, string | string[]>;

export interface Realtor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  broker_license: string;
}

interface NavigateAction {
  type: "navigation";
  location: string;
}

interface CompleteAction {
  type: "complete";
  message: string;
}

interface RequestInfoAction {
  type: "request_info";
  message: string;
}

export type partyAction = NavigateAction | CompleteAction | RequestInfoAction;

export type Schema = SchemaItem[];

export interface PDFFormField {
  id: string;
  type: "text" | "signature" | "date" | "checkmark" | "strikethrough";
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  value?: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
  displayName?: string; // For signature fields
  email?: string; // For signature fields
  actionAs?: "signer" | "delegator"; // For signature fields
  color?: string;
}

export type aiPartyIntakeQuestionGeneration = {
  question: string;
  input_type: "text" | "radio" | "checkbox" | "fileUpload";
  placeholder?: string;
  radio_options?: string[];
  mapping?: {
    form_type: string;
    field_name: string;
  };
};

export interface Party {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  current_transaction_status:
    | "lead"
    | "searching"
    | "under_contract"
    | "closed"
    | "cancelled";
  form_information: JSON;
  notes: string;
  realtor_id: string;
  created_at: Date;
}

export interface Deals_Parties {
  id: string;
  party_id: string;
  deal_id: string;
  created_at: Date;
  party_role:
    | "seller"
    | "buyer"
    | "landlord"
    | "tenant"
    | "seller_agent"
    | "buyer_agent"
    | "tenant_agent"
    | "landlord_agent";
  realtorIsRepresenting: boolean;
  partyNumber: number;
  party_email: string;
}

export interface SignatureCollection {
  id: string;
  form_id: string;
  created_at: Date;
  actionAs: string;
  action_email: string;
  sender_id: string;
  signature_data: Record<string, Record<string, string>>;
  form_response: FormResponse;
  form_type: string;
  custom_schema: Schema;
  signature_sequence: SignerAssignment[][];
  file_upload_pdf: string;
  audit_json: AuditJson;
}

export interface PartyIntakeTemplate {
  id: string;
  name: string;
  user_id: string;
  buyer1_schema?: Schema;
  buyer2_schema?: Schema;
  seller1_schema?: Schema;
  seller2_schema?: Schema;
  created_at: Date;
}

export type AuditJson = {
  document_id: string;
  sender_id: string;
  original_document_hash: string;
  final_document_hash: string;
  consent_text_version: string;
  events: SignatureEvent[];
};

export type SignatureEvent = {
  event:
    | "signature_created"
    | "esign_consent_given"
    | "signature_applied"
    | "delegation_applied"
    | "document_submitted"
    | "delegated";
  sequence: number;
  timestamp: Date;
  ip_address: string;
  user_agent: string;
  actor_uuid: string;
  actor_auth_method: "login" | "email_otp";
  field_signed?: {
    unique_id: string;
    field_name: string;
    field_value: string;
    signature_method: "draw" | "typed";
  };
  signer_email: string;
  //consider adding unqiue event_uuid for each event
};


export type ClientIntake = PartyIntake;



export type FILE_NAMES = "IABS" | "Third_party_financing"

export type AutoFilledTypes = "intake" | "cached" | "resolved"
