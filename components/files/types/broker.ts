interface FieldInfo {
    name: string;
    type: string;
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    value?: string | boolean | string[];
    options?: string[];
    isReadOnly?: boolean;
    isRequired?: boolean;
    maxLength?: number;
    multiline?: boolean;
    fontSize?: number;
    borderWidth?: number;
    backgroundColor?: { r: number; g: number; b:
  number };
    borderColor?: { r: number; g: number; b: number
   };
    textColor?: { r: number; g: number; b: number
  };
  }

export type FormFields = FieldInfo[];