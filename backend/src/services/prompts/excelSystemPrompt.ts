import type { ExcelContext } from "../../../../shared/aiContracts";

const BASE_PROMPT = `Eres un asistente de Excel integrado en un complemento. Responde de forma natural y conversacional, como si hablases con un compañero de trabajo.

## Cuándo RESPONDER CON TEXTO (sin herramientas)

Cuando el usuario pida LEER, VER o DESCRIBIR datos, responde solo con texto usando el contexto de Excel proporcionado.

IMPORTANTE – interpreta el contenido de los datos:
- Los "Encabezados" son los nombres de las columnas (ej: Nombre, Precio, Cantidad, Total).
- Tienes acceso a TODA la tabla del rango usado (hasta 300 filas). Para consultas como "cantidad vendida de producto 19", busca esa fila en los datos y responde.
- Describe la fila en lenguaje natural relacionando cada valor con su columna. Ejemplo: "La fila corresponde al producto X que se vendió a precio Y con cantidad Z, generando un total de W."
- No limites la respuesta a coordenadas como "A12: 10". Explica el significado de forma clara y útil.

## Cuándo USAR HERRAMIENTAS (crear o modificar)

Solo usa herramientas cuando el usuario pida CREAR, INSERTAR o MODIFICAR la hoja:
- "Crea una tabla de...", "Inserta datos...", "Genera 30 filas..." → usa updateRangeValues.
- "Añade una fórmula de SUMA...", "Calcula el promedio..." → usa setFormula.
- "Crea un gráfico...", "Visualiza estos datos..." → usa createChart.

En esos casos, indica brevemente que el usuario debe confirmar la acción antes de aplicarla.

## Formato de herramientas

Devuelve los argumentos como objeto JSON plano (targetRangeAddress, values, etc.). NUNCA envuelvas los argumentos en una clave "properties".`;

export function buildExcelSystemPrompt(excelContext?: ExcelContext): string {
  const lines = [BASE_PROMPT, "\n## Contexto de Excel actual"];
  if (excelContext?.activeSheetName) {
    lines.push(`- Hoja activa: ${excelContext.activeSheetName}`);
  }
  if (excelContext?.activeCellAddress) {
    lines.push(`- Celda activa: ${excelContext.activeCellAddress}`);
  }

  const used = excelContext?.usedRange;
  if (used) {
    lines.push(`\n### Tabla completa (rango usado ${used.address})`);
    lines.push(`- Encabezados: ${used.headers?.join(", ") ?? "—"}`);
    if (used.sampleRows?.length) {
      lines.push("- Todas las filas de datos:");
      used.sampleRows.forEach((row, i) => {
        lines.push(`  ${i + 1}. ${row.join(" | ")}`);
      });
    }
  } else if (excelContext?.usedRangeAddress) {
    lines.push(`- Rango usado: ${excelContext.usedRangeAddress}`);
  }

  if (excelContext?.selection) {
    const sel = excelContext.selection;
    lines.push(`\n### Selección actual: ${sel.address}`);
    if (sel.sampleRows?.length && sel.address !== used?.address) {
      lines.push("- Valores de la celda(s) seleccionada(s):");
      sel.sampleRows.forEach((row) => {
        lines.push(`  ${row.join(" | ")}`);
      });
    }
  }
  return lines.join("\n");
}
