import type { AiAction } from "../../../../shared/aiContracts";
// @ts-ignore - JSON import
import excelToolsJson from "./excelTools.json";

export const EXCEL_TOOLS = excelToolsJson;

export function toolCallToAiAction(
  name: string,
  args: Record<string, unknown>,
): AiAction | null {
  try {
    if (name === "updateRangeValues") {
      return {
        type: "updateRangeValues",
        targetRangeAddress: String(args.targetRangeAddress ?? ""),
        values: (args.values ?? []) as (string | number | null)[][],
        description:
          args.actionDescription ?? args.description
            ? String(args.actionDescription ?? args.description)
            : undefined,
      };
    }
    if (name === "setFormula") {
      return {
        type: "setFormula",
        targetRangeAddress: String(args.targetRangeAddress ?? ""),
        formula: String(args.formula ?? ""),
        description:
          args.actionDescription ?? args.description
            ? String(args.actionDescription ?? args.description)
            : undefined,
      };
    }
    if (name === "createChart") {
      return {
        type: "createChart",
        targetRangeAddress: String(args.targetRangeAddress ?? ""),
        chartType:
          (args.chartType as AiAction["chartType"]) ?? "ColumnClustered",
        description:
          args.actionDescription ?? args.description
            ? String(args.actionDescription ?? args.description)
            : undefined,
      };
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[excelTools] toolCallToAiAction failed:", name, args, e);
    return null;
  }
  return null;
}
