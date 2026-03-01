export type ProviderId = "groq" | "openrouter";

export type Role = "system" | "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface ExcelRangeSummary {
  sheetName: string;
  address: string;
  headers?: string[];
  sampleRows?: string[][];
  rowCount?: number;
  columnCount?: number;
}

export interface ExcelContext {
  selection?: ExcelRangeSummary;
  /** Tabla completa del rango usado (encabezados + filas, hasta ~300 filas) para consultas tipo "producto19" */
  usedRange?: ExcelRangeSummary;
  activeCellAddress?: string;
  activeSheetName?: string;
  usedRangeAddress?: string;
  [key: string]: unknown;
}

export type AiActionType =
  | "updateRangeValues"
  | "setFormula"
  | "createChart"
  | "explainOnly";

export interface AiAction {
  type: AiActionType;
  description?: string;
  targetRangeAddress?: string;
  values?: (string | number | null)[][];
  formula?: string;
  chartType?:
    | "ColumnClustered"
    | "Line"
    | "Pie"
    | "BarClustered"
    | "Area"
    | "Scatter";
}

export interface AiRequest {
  providerId: ProviderId;
  modelId: string;
  messages: ChatMessage[];
  excelContext?: ExcelContext;
  capabilities?: {
    allowEdits?: boolean;
  };
}

export interface AiResponse {
  text: string;
  actions?: AiAction[];
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    latencyMs?: number;
  };
}

export interface LLMProvider {
  id: ProviderId;
  call(request: AiRequest): Promise<AiResponse>;
}

