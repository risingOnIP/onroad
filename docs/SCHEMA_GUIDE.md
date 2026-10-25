# Complete Schema Item Guide

## Overview
A schema is an array of SchemaItem objects that define form fields, their behavior, validation, and appearance. This guide covers every aspect of creating schemas for the OnRoad platform.

## Table of Contents
1. [Basic Structure](#basic-structure)
2. [Input Types](#input-types)
3. [Display Attributes](#display-attributes)
4. [Special Input Styling](#special-input-styling)
5. [Validation](#validation)
6. [Conditional Visibility](#conditional-visibility)
7. [Value Resolution](#value-resolution)
8. [PDF Mapping](#pdf-mapping)
9. [Block Grouping](#block-grouping)
10. [Examples](#examples)

## Basic Structure

Every schema item must have:
```typescript
{
  unique_id: string;              // Unique identifier for the field
  display_attributes: {           // Display configuration
    input_type: string;           // Type of input
    order: number;                // Display order (increments by 1)
    // ... other display properties
  };
  pdf_attributes?: [...];         // Optional PDF field mappings
}
```

## Input Types

### 1. Text Input (`"text"`)
Basic text field with various special formats:
```typescript
{
  unique_id: "buyer_name",
  display_attributes: {
    input_type: "text",
    display_name: "Buyer Name",
    placeholder: "Enter full name",
    order: 1,
    width: 6,                    // 1-12 grid system
    isRequired: true,
    special_input: {
      text: {
        percentage: true,        // Formats as percentage
        phone: true,            // Phone number format
        date: true,             // Date picker
        currency: true,         // Currency format ($)
        number: true,           // Numbers only
        email: true,            // Email validation
        url: true               // URL validation
      }
    }
  }
}
```

### 2. Text Area (`"text-area"`)
Multi-line text input:
```typescript
{
  unique_id: "property_description",
  display_attributes: {
    input_type: "text-area",
    display_name: "Property Description",
    placeholder: "Describe the property...",
    order: 2,
    special_input: {
      textArea: {
        minRows: 3,             // Minimum visible rows
        maxRows: 10,            // Maximum before scrolling
        autoResize: true        // Auto-grow with content
      }
    }
  }
}
```

### 3. Radio Buttons (`"radio"`)
Single selection from options:
```typescript
{
  unique_id: "property_type",
  display_attributes: {
    input_type: "radio",
    display_name: "Property Type",
    order: 3,
    display_radio_options: ["House", "Condo", "Apartment", "Townhouse"],
    special_input: {
      radio: {
        layout: "horizontal",    // "vertical" | "horizontal" | "grid"
        columns: 2               // For grid layout
      }
    }
  }
}
```

### 4. Checkbox (`"checkbox"`)
Multiple selection with advanced features:
```typescript
{
  unique_id: "amenities",
  display_attributes: {
    input_type: "checkbox",
    display_name: "Amenities",
    order: 4,
    checkbox_options: {
      options: [
        {
          display_name: "Pool",
          databaseStored: "pool",
          linkedFields: ["pool_type", "pool_heated"]  // Fields shown when selected
        },
        {
          display_name: "Garage",
          databaseStored: "garage",
          linkedFields: ["garage_spaces"]
        }
      ],
      maxSelected: 5,           // Maximum selections allowed
      minSelected: 1            // Minimum selections required
    },
    special_input: {
      checkbox: {
        asRadio: true,          // Behave like radio (single selection)
        horizontal: 3           // Display in 3 columns
      }
    }
  }
}
```

### 5. Signature (`"signature"`)
Signature collection field:
```typescript
{
  unique_id: "buyer_signature",
  display_attributes: {
    input_type: "signature",
    display_name: "Buyer Signature",
    order: 5,
    value: {
      type: "manual",
      output: "SignatureInput__signer"  // or "SignatureInput__delegator"
    },
    special_input: {
      signature: {
        dateFormat: "MM/DD/YYYY",      // Custom date format
        showInitials: true             // Show initials field
      }
    }
  }
}
```

### 6. File Upload (`"fileUpload"`)
File upload field:
```typescript
{
  unique_id: "proof_of_income",
  display_attributes: {
    input_type: "fileUpload",
    display_name: "Proof of Income",
    order: 6,
    special_input: {
      fileUpload: {
        accept: ".pdf,.doc,.docx",     // Accepted file types
        maxSize: 10,                   // Max size in MB
        multiple: true                 // Allow multiple files
      }
    }
  }
}
```

### 7. Info Box (`"info"`)
Informational display (not an input):
```typescript
{
  unique_id: "lease_info",
  display_attributes: {
    input_type: "info",
    display_name: "Important Notice",
    description: "Please read the lease terms carefully before signing.",
    order: 7,
    special_input: {
      info: {
        style: "warning",              // Style variant (see below)
        icon: true,                    // Show icon
        minimizable: true              // Can be minimized
      }
    }
  }
}
```

Info box styles:
- `"default"`: Blue background, prominent
- `"subtle"`: Light gray, understated
- `"minimal"`: Very light background
- `"inline"`: Compact inline style
- `"compact"`: Smaller padding, blue
- `"warning"`: Yellow warning style
- `"success"`: Green success style
- `"error"`: Red error style
- `"tip"`: Purple tip style

## Display Attributes

### Layout and Styling
```typescript
{
  display_attributes: {
    width: 6,                          // 1-12 grid columns
    display_name: "Field Label",       // Label shown to user
    description: "Help text",          // Additional help text
    placeholder: "Placeholder text",   // Input placeholder
    attribute: "phone",                // Semantic tag for caching
    breakBefore: true,                 // Force new row before this field
    isRequired: true,                  // Required field
    isHidden: true,                    // Hidden field
    isCached: true                     // Cache value for reuse
  }
}
```

## Special Input Styling

### Complete Special Input Options
```typescript
{
  special_input: {
    // Text input options
    text: {
      percentage: boolean,
      phone: boolean,
      date: boolean,
      currency: boolean,
      number: boolean,
      email: boolean,
      url: boolean
    },
    
    // Checkbox options
    checkbox: {
      asRadio: boolean,         // Single selection mode
      horizontal: number        // Number of columns (1-12)
    },
    
    // Info box options
    info: {
      style: 'default' | 'subtle' | 'minimal' | 'inline' | 
             'compact' | 'warning' | 'success' | 'error' | 'tip',
      icon: boolean,
      minimizable: boolean
    },
    
    // Radio button options
    radio: {
      layout: 'vertical' | 'horizontal' | 'grid',
      columns: number           // For grid layout
    },
    
    // Signature options
    signature: {
      dateFormat: string,
      showInitials: boolean
    },
    
    // File upload options
    fileUpload: {
      accept: string,           // e.g., ".pdf,.jpg"
      maxSize: number,          // MB
      multiple: boolean
    },
    
    // Text area options
    textArea: {
      minRows: number,
      maxRows: number,
      autoResize: boolean
    }
  }
}
```

## Validation

### Loopback Validation (Self-validation)
```typescript
{
  display_attributes: {
    validation: {
      loopback: [
        {
          regex: "^[0-9]{5}$",
          message: "ZIP code must be 5 digits"
        },
        {
          regex: "^[A-Z]{2}$",
          message: "State must be 2 uppercase letters"
        }
      ]
    }
  }
}
```

### Cross-field Validation
```typescript
{
  display_attributes: {
    validation: {
      crossField: [
        {
          rule: ">=",                    // >, >=, <, <=, ==, !==
          unique_id: "start_date",       // Field to compare against
          message: "End date must be after start date"
        }
      ]
    }
  }
}
```

## Conditional Visibility

Show/hide fields based on other field values:
```typescript
{
  display_attributes: {
    visibleIf: [
      {
        unique_id: "has_pool",
        operation: "==",                 // Operations: >, >=, <, <=, ==, !==, contains, doesNotContain
        valueChecked: "true"
      },
      {
        unique_id: "property_type",
        operation: "contains",
        valueChecked: "house"
      }
    ]
  }
}
```

## Value Resolution

### Manual Entry
```typescript
{
  value: {
    type: "manual"              // User enters value
  }
}
```

### Database Resolution
```typescript
{
  value: {
    type: "resolved",
    supabase: [
      {
        table: "profiles",
        column: "first_name",
        eqBy: [
          {
            columnName: "user_id",
            variable: "userId"   // Uses current user ID
          }
        ]
      }
    ]
  }
}
```

### Reserved Values
```typescript
{
  value: {
    type: "reserved",
    reserved: "tenant_name_csv"  // Special computed values
  }
}
```

Reserved value options:
- `"tenant_name_csv"`: Comma-separated tenant names
- `"realtor_name_spaced"`: Realtor's full name

## PDF Mapping

Map schema fields to PDF form fields:
```typescript
{
  pdf_attributes: [
    {
      formType: "residential_lease",
      formfield: "tenant_name_1",        // Single PDF field
      
      // For linked text fields (continuation)
      linked_form_fields_text: ["tenant_name_1_cont1", "tenant_name_1_cont2"],
      
      // For linked radio buttons
      linked_form_fields_radio: [
        { radioField: "prop_type_house", displayName: "House" },
        { radioField: "prop_type_condo", displayName: "Condo" }
      ],
      
      // For linked checkboxes
      linked_form_fields_checkbox: [
        { fromDatabase: "pool", pdfAttribute: "amenity_pool" },
        { fromDatabase: "garage", pdfAttribute: "amenity_garage" }
      ],
      
      // For date fields
      linked_dates: [
        { dateFieldName: "lease_start_date" }
      ]
    }
  ]
}
```

## Block Grouping

Group related fields visually:
```typescript
{
  display_attributes: {
    block: "property_details",           // Block identifier
    block_style: {
      title: "Property Information",
      description: "Enter property details",
      icon: "home",                      // Icon name
      color_theme: 'blue'                // 'blue' | 'green' | 'purple' | 'orange' | 'gray'
    }
  }
}
```

## Complete Examples

### 1. Complex Checkbox with Linked Fields
```typescript
{
  unique_id: "payment_methods",
  display_attributes: {
    input_type: "checkbox",
    display_name: "Accepted Payment Methods",
    order: 10,
    checkbox_options: {
      options: [
        {
          display_name: "Credit Card",
          databaseStored: "credit_card",
          linkedFields: ["cc_types", "cc_fee"]
        },
        {
          display_name: "Bank Transfer",
          databaseStored: "bank_transfer",
          linkedFields: ["bank_name", "routing_required"]
        }
      ]
    },
    special_input: {
      checkbox: {
        horizontal: 2
      }
    }
  }
},
// Linked field example
{
  unique_id: "cc_types",
  display_attributes: {
    input_type: "checkbox",
    display_name: "Accepted Cards",
    order: 11,
    width: 6,
    checkbox_options: {
      options: [
        { display_name: "Visa", databaseStored: "visa" },
        { display_name: "MasterCard", databaseStored: "mastercard" },
        { display_name: "Amex", databaseStored: "amex" }
      ]
    },
    special_input: {
      checkbox: {
        horizontal: 3
      }
    },
    visibleIf: [{
      unique_id: "payment_methods",
      operation: "contains",
      valueChecked: "credit_card"
    }]
  }
}
```

### 2. Date Range with Validation
```typescript
{
  unique_id: "lease_start",
  display_attributes: {
    input_type: "text",
    display_name: "Lease Start Date",
    order: 20,
    width: 6,
    isRequired: true,
    special_input: {
      text: {
        date: true
      }
    }
  }
},
{
  unique_id: "lease_end",
  display_attributes: {
    input_type: "text",
    display_name: "Lease End Date",
    order: 21,
    width: 6,
    isRequired: true,
    special_input: {
      text: {
        date: true
      }
    },
    validation: {
      crossField: [{
        rule: ">",
        unique_id: "lease_start",
        message: "End date must be after start date"
      }]
    }
  }
}
```

### 3. Conditional Section
```typescript
{
  unique_id: "has_pets",
  display_attributes: {
    input_type: "radio",
    display_name: "Do you have pets?",
    order: 30,
    display_radio_options: ["Yes", "No"],
    isRequired: true
  }
},
{
  unique_id: "pet_deposit",
  display_attributes: {
    input_type: "text",
    display_name: "Pet Deposit Amount",
    order: 31,
    width: 6,
    special_input: {
      text: {
        currency: true
      }
    },
    visibleIf: [{
      unique_id: "has_pets",
      operation: "==",
      valueChecked: "Yes"
    }]
  }
},
{
  unique_id: "pet_info",
  display_attributes: {
    input_type: "info",
    display_name: "Pet Policy",
    description: "Additional $50/month pet rent applies. Maximum 2 pets.",
    order: 32,
    special_input: {
      info: {
        style: "warning",
        icon: true,
        minimizable: true
      }
    },
    visibleIf: [{
      unique_id: "has_pets",
      operation: "==",
      valueChecked: "Yes"
    }]
  }
}
```

## Best Practices

1. **Unique IDs**: Use descriptive, unique identifiers (e.g., `tenant_email`, not `email1`)
2. **Order**: Number sequentially, leave gaps (10, 20, 30) for future insertions
3. **Width**: Use the 12-column grid system effectively
4. **Validation**: Add both client-side (loopback) and cross-field validation
5. **Linked Fields**: Keep linked fields immediately after their parent in order
6. **Blocks**: Group related fields into logical blocks
7. **Required Fields**: Mark truly required fields, not just "nice to have"
8. **Placeholders**: Provide helpful placeholders that show format expectations
9. **Info Boxes**: Use sparingly for critical information
10. **Special Inputs**: Choose the most specific type (e.g., email vs text)

## Schema Item Types Reference

```typescript
interface SchemaItem {
  unique_id: string;
  pdf_attributes?: PDFAttribute[];
  display_attributes: DisplayAttributes;
}

interface DisplayAttributes {
  display_name?: string;
  input_type: "text" | "radio" | "checkbox" | "signature" | "fileUpload" | "info" | "text-area";
  description?: string;
  order: number;
  attribute?: string;
  block?: string;
  block_style?: BlockStyle;
  visibleIf?: VisibilityCondition[];
  validation?: ValidationRules;
  placeholder?: string;
  width?: number;
  display_radio_options?: string[];
  checkbox_options?: CheckboxOptions;
  value: ValueDefinition;
  breakBefore?: boolean;
  isCached?: boolean;
  isRequired?: boolean;
  isHidden?: boolean;
  special_input?: SpecialInput;
}
```

This guide covers all aspects of creating schemas in the OnRoad platform. Use it as a reference when building forms and ensure consistency across all implementations.