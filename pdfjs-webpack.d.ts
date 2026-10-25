// Type definitions for the pdfjs-dist webpack entry point
declare module "pdfjs-dist/webpack.mjs" {
  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
    
    // Both destroy methods with proper return types
    destroy(): Promise<void>; // Returns a Promise
    cleanup?(): void; // Optional synchronous helper
    
    // Additional useful properties
    fingerprint?: string;
    loadingTask?: PDFDocumentLoadingTask;
  }

  export interface PDFPageProxy {
    pageNumber: number;
    getViewport(options: { scale: number; rotation?: number }): PDFPageViewport;
    getAnnotations(): Promise<PDFAnnotation[]>;
    
    // Additional methods you might need
    render?(params: {
      canvasContext: CanvasRenderingContext2D;
      viewport: PDFPageViewport;
    }): PDFRenderTask;
    
    cleanup?(): void;
  }

  export interface PDFPageViewport {
    width: number;
    height: number;
    scale: number;
    rotation: number;
    
    convertToViewportRectangle(rect: number[]): number[];
    convertToViewportPoint?(point: number[]): number[];
    
    // Additional viewport methods
    clone?(options?: { scale?: number; rotation?: number }): PDFPageViewport;
  }

  export interface PDFAnnotation {
    subtype: string;
    fieldName?: string;
    rect: number[];
    
    // Additional annotation properties
    id?: string;
    type?: string;
    contents?: string;
    modificationDate?: string;
    flags?: number;
    borderStyle?: {
      width: number;
      style: number;
      dashArray?: number[];
    };
  }

  export interface PDFRenderTask {
    promise: Promise<void>;
    cancel(): void;
  }

  export interface PDFDocumentLoadingTask {
    promise: Promise<PDFDocumentProxy>;
    
    // Both destroy methods
    destroy(): void; // Synchronous method on the task
    
    // Additional task properties
    docId?: string;
    onPassword?: (callback: (password: string) => void, reason: number) => void;
    onProgress?: (progressData: { loaded: number; total: number }) => void;
  }

  // Global worker options with more configuration
  export const GlobalWorkerOptions: {
    workerSrc: string;
    workerPort?: MessagePort;
    disableWorker?: boolean;
  };

  export const version: string;

  // More comprehensive getDocument options
  export interface PDFDocumentSource {
    data?: Uint8Array | ArrayBuffer;
    url?: string;
    httpHeaders?: Record<string, string>;
    withCredentials?: boolean;
    password?: string;
    disableWorker?: boolean;
    disableRange?: boolean;
    disableStream?: boolean;
    disableAutoFetch?: boolean;
    pdfBug?: boolean;
    maxImageSize?: number;
    cMapUrl?: string;
    cMapPacked?: boolean;
    stopAtErrors?: boolean;
    verbosity?: number;
  }

  export function getDocument(source: PDFDocumentSource | string | Uint8Array): PDFDocumentLoadingTask;

  // Additional utility exports
  export const PasswordResponses: {
    NEED_PASSWORD: number;
    INCORRECT_PASSWORD: number;
  };

  export const VerbosityLevel: {
    ERRORS: number;
    WARNINGS: number;
    INFOS: number;
  };

  // Error types you might encounter
  export class PasswordException extends Error {
    code: number;
  }

  export class InvalidPDFException extends Error {}
  export class MissingPDFException extends Error {}
  export class UnexpectedResponseException extends Error {}
}