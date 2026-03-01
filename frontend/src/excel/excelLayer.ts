import type { AiAction, ExcelContext, ExcelRangeSummary } from "../../../shared/aiContracts";

function columnLetterToIndex(letters: string): number {
  let index = 0;
  for (let i = 0; i < letters.length; i++) {
    index = index * 26 + (letters.toUpperCase().charCodeAt(i) - 64);
  }
  return index;
}

function parseRangeDimensions(address: string): { rowCount: number; colCount: number } | null {
  const match = address.match(/^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/i);
  if (!match) return null;
  const [, col1, row1, col2, row2] = match;
  const startRow = parseInt(row1, 10);
  const startCol = columnLetterToIndex(col1);
  const endRow = col2 && row2 ? parseInt(row2, 10) : startRow;
  const endCol = col2 ? columnLetterToIndex(col2) : startCol;
  return {
    rowCount: endRow - startRow + 1,
    colCount: endCol - startCol + 1,
  };
}

function normalizeValuesToDimensions(
  values: (string | number | null)[][],
  rowCount: number,
  colCount: number,
): (string | number | null)[][] {
  const result: (string | number | null)[][] = [];
  for (let r = 0; r < rowCount; r++) {
    const row = values[r] ?? [];
    const padded: (string | number | null)[] = [];
    for (let c = 0; c < colCount; c++) {
      padded.push(c < row.length ? row[c] : null);
    }
    result.push(padded);
  }
  return result;
}

const MAX_DATA_ROWS = 300;

/** Indica si una fila parece encabezados (texto categórico) vs datos (productoN, números). */
function looksLikeHeaders(row: (string | number | null)[]): boolean {
  const first = row[0] != null ? String(row[0]).trim().toLowerCase() : "";
  if (!first) return false;
  if (/^producto\d+$/.test(first)) return false;
  if (/^\d+$/.test(first)) return false;
  return true;
}

async function buildExcelContext(): Promise<ExcelContext> {
  if (!(window as any).Excel) {
    return {};
  }

  return Excel.run(async (context) => {
    const activeCell = context.workbook.getActiveCell();
    const activeSheet = context.workbook.worksheets.getActiveWorksheet();
    const usedRange = activeSheet.getUsedRange();
    const selection = context.workbook.getSelectedRange();

    activeCell.load("address");
    activeSheet.load("name");
    usedRange.load(["address", "values", "rowCount", "columnCount"]);
    selection.load(["address", "worksheet", "values", "columnCount", "rowCount"]);
    await context.sync();

    const usedValues = usedRange.values as (string | number | null)[][];
    const selValues = selection.values as (string | number | null)[][];

    let usedHeaders: string[] | undefined;
    let usedDataRows: string[][] = [];

    for (let i = 0; i < Math.min(5, usedValues.length); i++) {
      const row = usedValues[i] ?? [];
      if (looksLikeHeaders(row)) {
        usedHeaders = row.map((c) => (c == null ? "" : String(c)));
        usedDataRows = usedValues
          .slice(i + 1, Math.min(i + 1 + MAX_DATA_ROWS, usedValues.length))
          .map((r) => (r ?? []).map((c) => (c == null ? "" : String(c))));
        break;
      }
    }
    if (!usedHeaders) {
      usedHeaders = (usedValues[0] ?? []).map((c) => (c == null ? "" : String(c)));
      usedDataRows = usedValues
        .slice(1, Math.min(1 + MAX_DATA_ROWS, usedValues.length))
        .map((r) => (r ?? []).map((c) => (c == null ? "" : String(c))));
    }

    const usedRangeSummary: ExcelRangeSummary = {
      sheetName: activeSheet.name,
      address: usedRange.address,
      headers: usedHeaders,
      sampleRows: usedDataRows,
      rowCount: usedRange.rowCount,
      columnCount: usedRange.columnCount,
    };

    const selRows = selValues.map((r) =>
      (r ?? []).map((c) => (c == null ? "" : String(c))),
    );
    const selectionSummary: ExcelRangeSummary = {
      sheetName: selection.worksheet.name,
      address: selection.address,
      headers: usedHeaders,
      sampleRows: selRows,
      rowCount: selection.rowCount,
      columnCount: selection.columnCount,
    };

    return {
      selection: selectionSummary,
      usedRange: usedRangeSummary,
      activeCellAddress: activeCell.address,
      activeSheetName: activeSheet.name,
      usedRangeAddress: usedRange.address,
    };
  });
}

export { buildExcelContext };

export async function applyActions(actions: AiAction[]): Promise<void> {
  if (!actions.length || !(window as any).Excel) {
    throw new Error("No hay acciones o Excel no está disponible.");
  }

  try {
    await Excel.run(async (context) => {
    const workbook = context.workbook;

    for (const action of actions) {
      if (!action.type) continue;

      if (
        action.type === "updateRangeValues" &&
        action.targetRangeAddress &&
        action.values
      ) {
        const sheet = workbook.worksheets.getActiveWorksheet();
        const dims = parseRangeDimensions(action.targetRangeAddress);
        const rowCount = dims?.rowCount ?? action.values.length;
        const colCount =
          dims?.colCount ??
          (action.values.length > 0 ? Math.max(...action.values.map((r) => r.length)) : 1);
        const values = normalizeValuesToDimensions(
          action.values,
          rowCount,
          colCount,
        );
        const range = sheet.getRange(action.targetRangeAddress);
        range.values = values;
      }

      if (
        action.type === "setFormula" &&
        action.targetRangeAddress &&
        action.formula
      ) {
        const range = workbook.worksheets
          .getActiveWorksheet()
          .getRange(action.targetRangeAddress);
        range.formulas = [[action.formula]];
      }

      if (action.type === "createChart" && action.targetRangeAddress) {
        const sheet = workbook.worksheets.getActiveWorksheet();
        const range = sheet.getRange(action.targetRangeAddress);
        const chart = sheet.charts.add(
          action.chartType ?? "ColumnClustered",
          range,
          "Auto",
        );
        chart.setPosition(range, range);
      }
    }

    await context.sync();
  });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido al aplicar en Excel";
    const stack = e instanceof Error ? e.stack : undefined;
    console.error("[excelLayer] applyActions failed:", { message: msg, stack });
    throw new Error(`No se pudo aplicar en la hoja: ${msg}`);
  }
}

