import ExcelJS from "exceljs";
import { MAX_BULK_ROWS } from "@/lib/asset-bulk-format";

export async function masterTemplateBuffer({ name, columns, data, instructions, options }: {
  name: string; columns: string[]; data: string[][]; instructions: string[][];
  options: Record<string, { id: string; name: string; code?: string }[]>;
}) {
  const workbook = new ExcelJS.Workbook();
  const input = workbook.addWorksheet(name);
  const reference = workbook.addWorksheet("Reference Data");
  const help = workbook.addWorksheet("Instructions");
  input.addRow(columns);
  input.addRows(data);
  input.views = [{ state: "frozen", ySplit: 1 }];
  input.columns.forEach(column => { column.width = 24; column.numFmt = "@"; });
  help.addRows(instructions);
  help.columns = [{ width: 24 }, { width: 14 }, { width: 18 }, { width: 100 }];

  Object.entries(options).forEach(([label, choices], index) => {
    // One block per master: Code + Name when the master has codes (same code as shown in the app),
    // otherwise Name only. Import matches on Name, which is what the dropdown inserts.
    const firstCol = index * 3 + 1;
    const hasCode = choices.some(choice => choice.code);
    const nameCol = hasCode ? firstCol + 1 : firstCol;
    reference.getCell(1, firstCol).value = label;
    if (hasCode) {
      reference.getCell(2, firstCol).value = "Code";
      reference.getColumn(firstCol).width = 16;
    }
    reference.getCell(2, nameCol).value = "Name";
    reference.getColumn(nameCol).width = 30;
    choices.forEach((choice, row) => {
      if (hasCode) reference.getCell(row + 3, firstCol).value = choice.code ?? "";
      reference.getCell(row + 3, nameCol).value = choice.name;
    });
    const rangeName = `Master_${index + 1}`;
    const letter = reference.getColumn(nameCol).letter;
    workbook.definedNames.add(`'Reference Data'!$${letter}$3:$${letter}$${Math.max(3, choices.length + 2)}`, rangeName);
    const column = columns.indexOf(label) + 1;
    if (!column) return;
    for (let row = 2; row <= MAX_BULK_ROWS + 1; row++) {
      input.getCell(row, column).dataValidation = {
        type: "list", allowBlank: true, formulae: [rangeName],
        showErrorMessage: true, errorStyle: "stop", errorTitle: "Invalid master data",
        error: `Select ${label} from the available database values.`,
        showInputMessage: true, promptTitle: label,
        prompt: choices.length ? "Pilih nama dari dropdown. Validasi ulang dilakukan saat import." : "Master kosong. Tambahkan master di aplikasi, lalu download template baru.",
      };
    }
  });
  for (const sheet of [input, reference, help]) {
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3212B8" } };
  }
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
