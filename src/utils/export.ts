import { BloodPressureReading, GlucoseReading } from "../types";

export function exportToCSV(bpReadings: BloodPressureReading[], glucoseReadings: GlucoseReading[]) {
  // 1. Blood Pressure CSV
  let bpCSV = "ID,Data/Hora,Sistolica (mmHg),Diastolica (mmHg),Pulso (bpm),Tags,Notas\n";
  bpReadings.forEach((bp) => {
    const dateStr = new Date(bp.measuredAt).toLocaleString("pt-BR");
    const tagsStr = bp.tags.join("; ");
    const notesClean = bp.notes.replace(/"/g, '""');
    bpCSV += `"${bp.id}","${dateStr}",${bp.systolic},${bp.diastolic},${bp.pulse},"${tagsStr}","${notesClean}"\n`;
  });

  // 2. Glucose CSV
  let glCSV = "ID,Data/Hora,Glicose (mg/dL),Estado de Alimentacao,Tags,Notas\n";
  glucoseReadings.forEach((gl) => {
    const dateStr = new Date(gl.measuredAt).toLocaleString("pt-BR");
    const mealStateLabel = getMealStateLabel(gl.mealState);
    const tagsStr = gl.tags.join("; ");
    const notesClean = gl.notes.replace(/"/g, '""');
    glCSV += `"${gl.id}","${dateStr}",${gl.value},"${mealStateLabel}","${tagsStr}","${notesClean}"\n`;
  });

  // Trigger downloads
  downloadFile(bpCSV, "smartbp_pressao_arterial.csv", "text/csv;charset=utf-8;");
  downloadFile(glCSV, "smartbp_glicemia.csv", "text/csv;charset=utf-8;");
}

export function getMealStateLabel(state: string): string {
  switch (state) {
    case "jejum":
      return "Jejum";
    case "pre_prandial":
      return "Pré-prandial (Antes da refeição)";
    case "pos_prandial":
      return "Pós-prandial (Após a refeição)";
    case "antes_de_dormir":
      return "Antes de dormir";
    default:
      return "Outro";
  }
}

export function downloadFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
