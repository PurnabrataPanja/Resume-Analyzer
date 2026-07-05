declare module "mammoth/mammoth.browser" {
  export interface MammothMessage {
    type: "warning" | "error";
    message: string;
  }

  export interface ExtractRawTextResult {
    value: string;
    messages: MammothMessage[];
  }

  export function extractRawText(input: {
    arrayBuffer: ArrayBuffer;
  }): Promise<ExtractRawTextResult>;
}
