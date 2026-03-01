import type { AiAction, ExcelContext, ExcelRangeSummary } from "../../../shared/aiContracts";

async function getSelectionRangeSummary(): Promise<ExcelRangeSummary | undefined> {
  if (!(window as any).Excel) {
    return undefined;
  }

  return Excel.run(async (context) => {
    const range = context.workbook.getSelectedRange();
    range.load(["address", "worksheet", "values", "columnCount", "rowCount"]);
    await context.sync();

    const values = range.values as (string | number | null)[][];
    const [headerRow, ...dataRows] = values;

    const sampleRows = dataRows.slice(0, 5).map((row) =>
      row.map((cell) => (cell == null ? "" : String(cell))),
    );

    return {
      sheetName: range.worksheet.name,
      address: range.address,
      headers: headerRow?.map((cell) => (cell == null ? "" : String(cell))),
      sampleRows,
      rowCount: range.rowCount,
      columnCount: range.columnCount,
    };
  });
}

export async function buildExcelContext(): Promise<ExcelContext> {
  const selection = await getSelectionRangeSummary();
  return {
    selection,
  };
}

export async function applyActions(actions: AiAction[]): Promise<void> {
  if (!actions.length || !(window as any).Excel) {
    return;
  }

  await Excel.run(async (context) => {
    const workbook = context.workbook;

    for (const action of actions) {
      if (!action.type) continue;

      if (
        action.type === "updateRangeValues" &&
        action.targetRangeAddress &&
        action.values
      ) {
        const range = workbook.worksheets
          .getActiveWorksheet()
          .getRange(action.targetRangeAddress);
        range.values = action.values;
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
}

