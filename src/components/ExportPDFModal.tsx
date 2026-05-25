import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { X, FileDown, Calendar, Filter, FileText, CheckCircle, Heart, Activity } from "lucide-react";
import { BloodPressureReading, GlucoseReading, WeightReading, UserProfile } from "../types";
import { getMealStateLabel } from "../utils/export";

interface ExportPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  bpReadings: BloodPressureReading[];
  glucoseReadings: GlucoseReading[];
  weightReadings: WeightReading[];
  profile: UserProfile;
}

export default function ExportPDFModal({ isOpen, onClose, bpReadings, glucoseReadings, weightReadings, profile }: ExportPDFModalProps) {
  const [filterType, setFilterType] = useState<"all" | "7" | "14" | "30" | "custom">("all");
  const [dataType, setDataType] = useState<"both" | "pressure" | "glucose">("both");
  const [layoutMode, setLayoutMode] = useState<"compact" | "detailed">("compact");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  if (!isOpen) return null;

  // Age calculation helper
  const calculateAge = (dateStr: string): number => {
    if (!dateStr || !dateStr.includes('-')) return 0;
    const today = new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    let age = today.getFullYear() - year;
    const m = (today.getMonth() + 1) - month;
    if (m < 0 || (m === 0 && today.getDate() < day)) {
      age--;
    }
    return isNaN(age) ? 0 : age;
  };

  const generatePDF = () => {
    // 1. Filter the readings based on the selected date filter
    const now = new Date();
    let cutoffDate: Date | null = null;

    if (filterType === "7") {
      cutoffDate = new Date();
      cutoffDate.setDate(now.getDate() - 7);
    } else if (filterType === "14") {
      cutoffDate = new Date();
      cutoffDate.setDate(now.getDate() - 14);
    } else if (filterType === "30") {
      cutoffDate = new Date();
      cutoffDate.setDate(now.getDate() - 30);
    }

    const isAfterCutoff = (measuredStr: string) => {
      const date = new Date(measuredStr);
      if (filterType === "custom") {
        const start = startDate ? new Date(startDate + "T00:00:00") : null;
        const end = endDate ? new Date(endDate + "T23:59:59") : null;
        if (start && date < start) return false;
        if (end && date > end) return false;
        return true;
      }
      if (cutoffDate) {
        return date >= cutoffDate;
      }
      return true;
    };

    // Compact layout slices recent arrays to fit securely on one page
    const maxItems = layoutMode === "compact" ? 25 : 999;

    const filteredBP = bpReadings
      .filter((r) => isAfterCutoff(r.measuredAt))
      .sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime())
      .slice(0, maxItems);

    const filteredGlucose = glucoseReadings
      .filter((r) => isAfterCutoff(r.measuredAt))
      .sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime())
      .slice(0, maxItems);

    // 2. Initialize PDF Document (A4 portrait size)
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;

    // Primary Brand Colors for Clinical aesthetic representation
    const primaryColor: [number, number, number] = [13, 148, 136]; // Teal-600
    const secondaryColor: [number, number, number] = [30, 41, 59]; // Slate-850
    const accentColor: [number, number, number] = [79, 70, 229]; // Indigo-600
    const grayText: [number, number, number] = [100, 116, 139]; // Slate-500

    // 3. Document Title / Header banner (Height optimized if compact)
    const headerHeight = layoutMode === "compact" ? 23 : 42;
    doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.rect(0, 0, pageWidth, headerHeight, "F");

    // Corporate Brand Label
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(layoutMode === "compact" ? 17 : 22);
    doc.text("VittaBP", 15, layoutMode === "compact" ? 10 : 17);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(layoutMode === "compact" ? 8 : 9);
    doc.setTextColor(180, 200, 200);
    doc.text(
      layoutMode === "compact" 
        ? "Ficha Resumida de Consulta Prontuária" 
        : "Ecosistema Prontuário Clínico & Diário Clínico Móvel", 
      15, 
      layoutMode === "compact" ? 14 : 23
    );

    // Generation Metadata Box
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(layoutMode === "compact" ? 7.5 : 8.5);
    const dateOfReport = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    doc.text(`Emitido em: ${dateOfReport}`, pageWidth - 15, layoutMode === "compact" ? 10 : 15, { align: "right" });
    doc.text(
      layoutMode === "compact" ? "Modelo: Resumido 1-Pág" : "Versão Segura: v2.5 Prontuário", 
      pageWidth - 15, 
      layoutMode === "compact" ? 14 : 21, 
      { align: "right" }
    );

    // Date Range Text for Report
    let periodText = "Todo o histórico de registros cadastrados";
    if (filterType === "7") periodText = "Últimos 7 dias de monitoramento clínico";
    else if (filterType === "14") periodText = "Últimos 14 dias de monitoramento clínico";
    else if (filterType === "30") periodText = "Últimos 30 dias de monitoramento clínico";
    else if (filterType === "custom") {
      const s = startDate ? startDate.split('-').reverse().join('/') : "Início";
      const e = endDate ? endDate.split('-').reverse().join('/') : "Fim";
      periodText = `Período Filtrado: ${s} até ${e}`;
    }
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 210, 190);
    doc.setFontSize(layoutMode === "compact" ? 8 : 9);
    doc.text(periodText.toUpperCase(), 15, layoutMode === "compact" ? 19 : 33);

    // 4. Patient Information Sub-Panel (Aesthetic Card)
    const patientCardY = layoutMode === "compact" ? 27 : 48;
    const patientCardHeight = layoutMode === "compact" ? 19 : 36;
    doc.setFillColor(248, 250, 252); // Slate-50 background
    doc.setDrawColor(226, 232, 240); // Slate-200 border
    doc.roundedRect(15, patientCardY, pageWidth - 30, patientCardHeight, 3, 3, "FD");

    const birthFormatted = profile.birthDate
      ? profile.birthDate.split('-').reverse().join('/')
      : "Não cadastrado";
    const heightInMeters = profile.height / 100;
    
    // Sort weight readings to get the most recent weight
    const sortedWeightReadings = [...weightReadings].sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime());
    const latestWeight = sortedWeightReadings.length > 0 ? sortedWeightReadings[0].weight : profile.weight;
    
    const imc = heightInMeters > 0 ? (latestWeight / (heightInMeters * heightInMeters)) : 0;
    let imcCategory = "Saudável";
    if (imc <= 0) imcCategory = "Não Calculado";
    else if (imc < 18.5) imcCategory = "Abaixo do peso";
    else if (imc >= 25 && imc < 30) imcCategory = "Sobrepeso";
    else if (imc >= 30) imcCategory = "Obesidade";

    if (layoutMode === "compact") {
      // Ultra-high density single-line patient card
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text("IDENTIFICAÇÃO DO PACIENTE", 20, patientCardY + 5.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const patientLine1 = `Nome: ${profile.name || "Paciente Não Identificado"}   •   Nascimento: ${birthFormatted} (${calculateAge(profile.birthDate)} anos)`;
      const patientLine2 = `Altura: ${heightInMeters.toFixed(2).replace(".", ",")} m (${profile.height} cm)   •   Peso: ${latestWeight.toFixed(1).replace(".", ",")} kg   •   IMC: ${imc > 0 ? imc.toFixed(1).replace(".", ",") : "N/A"} (${imcCategory})`;
      doc.text(patientLine1, 20, patientCardY + 10.5);
      doc.text(patientLine2, 20, patientCardY + 15);
    } else {
      // Left Column Profile Text
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text("DADOS DO PACIENTE", 20, 55);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text(`Nome Completo:  ${profile.name || "Paciente Não Identificado"}`, 20, 61);
      doc.text(`Data de Nascimento: ${birthFormatted}  (${calculateAge(profile.birthDate)} anos)`, 20, 66.5);
      
      // Right Column Stats Text Inside the Bio Box
      doc.text(`Altura: ${heightInMeters.toFixed(2).replace(".", ",")} m  (${profile.height} cm)`, 115, 61);
      doc.text(`Peso Corporal: ${latestWeight.toFixed(1).replace(".", ",")} kg`, 115, 66.5);
      
      // IMC Metric block highlight
      doc.setFont("helvetica", "bold");
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text(`Índice de Massa Corporal (IMC): ${imc > 0 ? imc.toFixed(2).replace(".", ",") : "N/A"} (${imcCategory})`, 115, 72.5);

      // Additional patient notes
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(grayText[0], grayText[1], grayText[2]);
      const obsLabel = profile.additionalInfo 
        ? `Obs: ${profile.additionalInfo.length > 90 ? profile.additionalInfo.substring(0, 88) + "..." : profile.additionalInfo}`
        : "Sem observações adicionais gravadas no perfil.";
      doc.text(obsLabel, 20, 78);
    }

    let nextY = layoutMode === "compact" ? 50 : 92;

    // Consolidated clinical statistics card (Only for compact layout)
    if (layoutMode === "compact") {
      doc.setFillColor(240, 253, 250); // Teal-50 background
      doc.setDrawColor(153, 246, 228); // Teal-200 border
      doc.roundedRect(15, nextY, pageWidth - 30, 10, 2, 2, "FD");

      // Calculate averages on sliced/current sets
      const avgSys = filteredBP.length > 0 ? Math.round(filteredBP.reduce((acc, cr) => acc + cr.systolic, 0) / filteredBP.length) : 0;
      const avgDia = filteredBP.length > 0 ? Math.round(filteredBP.reduce((acc, cr) => acc + cr.diastolic, 0) / filteredBP.length) : 0;
      const avgPulse = filteredBP.length > 0 ? Math.round(filteredBP.reduce((acc, cr) => acc + cr.pulse, 0) / filteredBP.length) : 0;
      const avgGlucose = filteredGlucose.length > 0 ? Math.round(filteredGlucose.reduce((acc, cr) => acc + cr.value, 0) / filteredGlucose.length) : 0;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 118, 110); // Teal-700
      let statsText = "MÉDIAS DE 30 DIAS:  ";
      if (avgSys > 0) statsText += `Pressão Arterial: ${avgSys}/${avgDia} mmHg   •   Pulso: ${avgPulse} bpm`;
      else statsText += "Sem aferições de PA";
      
      if (avgGlucose > 0) statsText += `   •   Glicemia: ${avgGlucose} mg/dL`;
      else statsText += "   •   Sem glicose";

      doc.text(statsText, 20, nextY + 6.5);
      nextY += 15;
    }

    // Helper for drawing custom titles
    const drawSectionTitle = (title: string, iconColor: [number, number, number]) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      
      doc.setFillColor(iconColor[0], iconColor[1], iconColor[2]);
      doc.rect(15, nextY - 4, 3, 5, "F");
      
      doc.text(title, 20, nextY);
      nextY += 5;
    };

    // Render Side-by-Side tables if layoutMode is compact AND they want both datasets
    if (layoutMode === "compact" && dataType === "both") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      
      // LEFT COL: Blood Pressure Title
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(15, nextY - 4.5, 2.5, 5.5, "F");
      doc.text(`HISTÓRICO PRESSÃO ARTERIAL (${filteredBP.length} aferições)`, 20, nextY);

      // RIGHT COL: Blood Glucose Title
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(110, nextY - 4.5, 2.5, 5.5, "F");
      doc.text(`HISTÓRICO GLICEMIA (${filteredGlucose.length} aferições)`, 115, nextY);

      const tableTopY = nextY + 2.5;
      let leftTableY = tableTopY;
      let rightTableY = tableTopY;

      // Render Left Table: Blood Pressure
      if (filteredBP.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(grayText[0], grayText[1], grayText[2]);
        doc.text("Sem registros de pressão arterial.", 15, tableTopY + 8);
        leftTableY += 12;
      } else {
        const tableBodyLeft = filteredBP.map((bp) => {
          const itemD = new Date(bp.measuredAt);
          const compactDate = `${String(itemD.getDate()).padStart(2, '0')}/${String(itemD.getMonth() + 1).padStart(2, '0')} ${String(itemD.getHours()).padStart(2, '0')}:${String(itemD.getMinutes()).padStart(2, '0')}`;
          
          let classification = "Saudável";
          if (bp.systolic >= 140 || bp.diastolic >= 90) classification = "Hiper.";
          else if (bp.systolic >= 130 || bp.diastolic >= 85) classification = "Limít.";
          else if (bp.systolic < 90 || bp.diastolic < 60) classification = "Hipot.";

          return [
            compactDate,
            `${bp.systolic}/${bp.diastolic}`,
            `${bp.pulse} bpm`,
            classification
          ];
        });

        autoTable(doc, {
          startY: tableTopY,
          head: [["Data/Hora", "P.A.", "Pulso", "Status"]],
          body: tableBodyLeft,
          styles: { fontSize: 7.2, cellPadding: 1.1, font: "helvetica" },
          headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: "bold" },
          alternateRowStyles: { fillColor: [250, 252, 252] },
          columnStyles: {
            0: { cellWidth: 24 },
            1: { cellWidth: 16, fontStyle: "bold" },
            2: { cellWidth: 15 },
            3: { cellWidth: "auto" }
          },
          margin: { left: 15, right: 110 }, // Lock to left side [15, 100]
          theme: "striped",
          didDrawPage: (data) => {
            leftTableY = data.cursor ? data.cursor.y : leftTableY;
          }
        });
      }

      // Render Right Table: Blood Glucose
      if (filteredGlucose.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(grayText[0], grayText[1], grayText[2]);
        doc.text("Sem registros de glicemia.", 110, tableTopY + 8);
        rightTableY += 12;
      } else {
        const tableBodyRight = filteredGlucose.map((gl) => {
          const itemD = new Date(gl.measuredAt);
          const compactDate = `${String(itemD.getDate()).padStart(2, '0')}/${String(itemD.getMonth() + 1).padStart(2, '0')} ${String(itemD.getHours()).padStart(2, '0')}:${String(itemD.getMinutes()).padStart(2, '0')}`;
          
          let interpretation = "OK";
          if (gl.value < 70) interpretation = "Hipo.";
          else if (gl.mealState === "jejum" && gl.value >= 126) interpretation = "Diabetes";
          else if (gl.mealState === "jejum" && gl.value >= 100) interpretation = "Alterada";
          else if (gl.mealState !== "jejum" && gl.value >= 200) interpretation = "Crítica";
          else if (gl.mealState !== "jejum" && gl.value >= 140) interpretation = "Elevada";

          // Compact moments
          let state = "Geral";
          if (gl.mealState === "jejum") state = "Jejum";
          else if (gl.mealState === "pre_prandial") state = "Pré";
          else if (gl.mealState === "pos_prandial") state = "Pós";
          else if (gl.mealState === "antes_de_dormir") state = "Dorm.";

          return [
            compactDate,
            `${gl.value} md`,
            state,
            interpretation
          ];
        });

        autoTable(doc, {
          startY: tableTopY,
          head: [["Data/Hora", "Val", "Ref", "Status"]],
          body: tableBodyRight,
          styles: { fontSize: 7.2, cellPadding: 1.1, font: "helvetica" },
          headStyles: { fillColor: accentColor, textColor: [255, 255, 255], fontStyle: "bold" },
          alternateRowStyles: { fillColor: [248, 248, 252] },
          columnStyles: {
            0: { cellWidth: 24 },
            1: { cellWidth: 15, fontStyle: "bold" },
            2: { cellWidth: 12 },
            3: { cellWidth: "auto" }
          },
          margin: { left: 110, right: 15 }, // Lock to right side [110, 195]
          theme: "striped",
          didDrawPage: (data) => {
            rightTableY = data.cursor ? data.cursor.y : rightTableY;
          }
        });
      }

      // Maximum bottom-most cursor determines footer coordinate
      nextY = Math.max(leftTableY, rightTableY) + 12;

    } else {
      // Classic layout sequential tables OR single data type selected
      if (dataType === "both" || dataType === "pressure") {
        drawSectionTitle("AFERIÇÕES DE PRESSÃO ARTERIAL (mmHg)", primaryColor);

        if (filteredBP.length === 0) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(9.5);
          doc.setTextColor(grayText[0], grayText[1], grayText[2]);
          doc.text("Nenhum registro de pressão arterial foi localizado no período especificado.", 18, nextY + 3);
          nextY += 14;
        } else {
          const tableBody = filteredBP.map((bp) => {
            const dateStr = new Date(bp.measuredAt).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
            
            let classification = "Saudável";
            if (bp.systolic >= 140 || bp.diastolic >= 90) classification = "Hiper. Estágio 1/2";
            else if (bp.systolic >= 130 || bp.diastolic >= 85) classification = "Pré-Hipertensão";
            else if (bp.systolic < 90 || bp.diastolic < 60) classification = "Hipotensão";

            const tagsStr = bp.tags.join(", ") || "-";
            const notesStr = bp.notes || "-";

            return [
              dateStr,
              `${bp.systolic}/${bp.diastolic}`,
              `${bp.pulse} bpm`,
              classification,
              tagsStr,
              notesStr
            ];
          });

          autoTable(doc, {
            startY: nextY + 1,
            head: [["Data/Hora", "Pressão (PA)", "Pulso", "Status Clínico", "Tags/Contexto", "Notas/Sintomas"]],
            body: tableBody,
            styles: { 
              fontSize: layoutMode === "compact" ? 7.6 : 8.5, 
              cellPadding: layoutMode === "compact" ? 1.3 : 2.2 
            },
            headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: "bold" },
            alternateRowStyles: { fillColor: [250, 252, 252] },
            columnStyles: {
              0: { cellWidth: 32 },
              1: { cellWidth: 26, fontStyle: "bold" },
              2: { cellWidth: 20 },
              3: { cellWidth: 28 },
              4: { cellWidth: 32 },
              5: { cellWidth: "auto" }
            },
            margin: { left: 15, right: 15 },
            theme: "striped",
            didDrawPage: (data) => {
              nextY = data.cursor ? data.cursor.y + 12 : nextY + 12;
            }
          });
        }
      }

      if (dataType === "both" || dataType === "glucose") {
        if (nextY > pageHeight - 45 && layoutMode !== "compact") {
          doc.addPage();
          nextY = 20;
        }

        drawSectionTitle("AFERIÇÕES DE GLICEMIA (mg/dL)", accentColor);

        if (filteredGlucose.length === 0) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(9.5);
          doc.setTextColor(grayText[0], grayText[1], grayText[2]);
          doc.text("Nenhum registro de glicose foi localizado no período especificado.", 18, nextY + 3);
          nextY += 14;
        } else {
          const tableBody = filteredGlucose.map((gl) => {
            const dateStr = new Date(gl.measuredAt).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            const stateLabel = getMealStateLabel(gl.mealState);
            const tagsStr = gl.tags.join(", ") || "-";
            const notesStr = gl.notes || "-";

            let interpretation = "Normal";
            if (gl.value < 70) interpretation = "Hipoglicemia";
            else if (gl.mealState === "jejum" && gl.value >= 126) interpretation = "Diabetes Suspeita";
            else if (gl.mealState === "jejum" && gl.value >= 100) interpretation = "Jejum Alterado";
            else if (gl.mealState !== "jejum" && gl.value >= 200) interpretation = "Hiperglicemia Crítica";
            else if (gl.mealState !== "jejum" && gl.value >= 140) interpretation = "Resposta Elevada";

            return [
              dateStr,
              `${gl.value} mg/dL`,
              stateLabel,
              interpretation,
              tagsStr,
              notesStr
            ];
          });

          autoTable(doc, {
            startY: nextY + 1,
            head: [["Data/Hora", "Valor Glicemia", "Estado de Alimentação", "Parecer Prontuário", "Tags", "Notas"]],
            body: tableBody,
            styles: { 
              fontSize: layoutMode === "compact" ? 7.6 : 8.5, 
              cellPadding: layoutMode === "compact" ? 1.3 : 2.2 
            },
            headStyles: { fillColor: accentColor, textColor: [255, 255, 255], fontStyle: "bold" },
            alternateRowStyles: { fillColor: [248, 248, 252] },
            columnStyles: {
              0: { cellWidth: 32 },
              1: { cellWidth: 26, fontStyle: "bold" },
              2: { cellWidth: 42 },
              3: { cellWidth: 30 },
              4: { cellWidth: 25 },
              5: { cellWidth: "auto" }
            },
            margin: { left: 15, right: 15 },
            theme: "striped",
            didDrawPage: (data) => {
              nextY = data.cursor ? data.cursor.y + 12 : nextY + 12;
            }
          });
        }
      }
    }

    // 7. Medical Disclaimer at Footer
    const disclaimerHeight = layoutMode === "compact" ? 13 : 22;
    if (nextY > pageHeight - (disclaimerHeight + 7)) {
      doc.addPage();
      nextY = 20;
    }

    doc.setFillColor(241, 245, 249); // White-Slate card
    doc.setDrawColor(203, 213, 225); // Slate-300
    doc.roundedRect(15, nextY, pageWidth - 30, disclaimerHeight, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(layoutMode === "compact" ? 6.5 : 7.5);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("⚠️ AVISO DE RESPONSABILIDADE MÉDICA E CUIDADO PREVENTIVO:", 18, nextY + (layoutMode === "compact" ? 4 : 5));

    doc.setFont("helvetica", "normal");
    doc.setFontSize(layoutMode === "compact" ? 6 : 7);
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    const disclaimerLines = [
      "Este relatório é um compilado seguro consolidado do histórico clínico pessoal de medições estáticas mantidas de forma soberana pelo usuário do VittaBP.",
      "As informações geradas servem apenas para auxílio estático de relatórios de tendências e nunca substituem, anulam, interferem ou sobressaem o parecer",
      "médico profissional de seu cardiologista, clínico geral ou enfermeiro de medicina corporativa."
    ];
    
    if (layoutMode === "compact") {
      const fullText = disclaimerLines.join(" ");
      doc.text(fullText, 18, nextY + 7.5, { maxWidth: pageWidth - 36 });
    } else {
      doc.text(disclaimerLines[0], 18, nextY + 9);
      doc.text(disclaimerLines[1], 18, nextY + 13);
      doc.text(disclaimerLines[2], 18, nextY + 17);
    }

    // Save the PDF locally for browser convenient viewing
    const nameSlug = profile.name ? profile.name.trim().toLowerCase().replace(/\s+/g, "_") : "paciente";
    doc.save(`vittabp_ficha_resumida_${nameSlug}.pdf`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden select-none">
        
        {/* Header Block */}
        <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/10">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-white leading-none">Exportar PDF Clínico</h3>
              <p className="text-[10px] text-teal-300 font-medium mt-1 font-mono tracking-wide uppercase">PRONTUÁRIO VITTABP V2.5</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 px-2.5 hover:bg-slate-800 rounded-xl transition text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Panel */}
        <div className="p-5 md:p-6 space-y-5 text-slate-700">
          
          {/* Quick Active Bio Metadata preview */}
          <div className="bg-teal-50/50 rounded-xl border border-teal-150 p-3.5 flex items-center space-x-3.5">
            <div className="bg-teal-600 text-white rounded-full p-2 h-9 w-9 flex items-center justify-center font-bold text-xs">
              {profile.name ? profile.name.charAt(0).toUpperCase() : "P"}
            </div>
            <div className="space-y-0.5">
              <span className="block text-[10px] text-teal-600 font-black uppercase tracking-wider">Identificação Prontuária</span>
              <p className="text-xs font-black text-slate-800 leading-none">{profile.name || "Paciente Não Cadastrado"}</p>
              <p className="text-[10px] text-slate-450 text-slate-400 font-mono">
                {profile.height}cm • {profile.weight}kg • {calculateAge(profile.birthDate)} anos • IMC: {(profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1).replace(".", ",")}
              </p>
            </div>
          </div>

          {/* Section 1: Data Scope selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              O que você deseja exportar no relatório?
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDataType("both")}
                className={`py-2 px-1 text-center rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
                  dataType === "both"
                    ? "border-teal-500 bg-teal-50/50 text-teal-800 font-black shadow-xs"
                    : "border-slate-200 bg-slate-50 text-slate-650 hover:bg-slate-100"
                }`}
              >
                <div className="flex gap-0.5">
                  <Heart className="w-3 h-3 text-teal-600" />
                  <Activity className="w-3 h-3 text-indigo-500" />
                </div>
                <span>Ambos</span>
              </button>

              <button
                type="button"
                onClick={() => setDataType("pressure")}
                className={`py-2 px-1 text-center rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
                  dataType === "pressure"
                    ? "border-teal-500 bg-teal-50/50 text-teal-800 font-black shadow-xs"
                    : "border-slate-200 bg-slate-50 text-slate-650 hover:bg-slate-100"
                }`}
              >
                <Heart className="w-3.5 h-3.5 text-teal-600" />
                <span>Pressão Arterial</span>
              </button>

              <button
                type="button"
                onClick={() => setDataType("glucose")}
                className={`py-2 px-1 text-center rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
                  dataType === "glucose"
                    ? "border-indigo-500 bg-indigo-50/50 text-indigo-800 font-black shadow-xs"
                    : "border-slate-200 bg-slate-50 text-slate-650 hover:bg-slate-100"
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-indigo-500" />
                <span>Glicemia</span>
              </button>
            </div>
          </div>

          {/* Section 2: Date period filter selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Filtrar Leituras por Período
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`py-2 px-2 rounded-xl border font-bold text-center transition ${
                  filterType === "all" ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-650 hover:bg-slate-100"
                }`}
              >
                Todas as leituras
              </button>

              <button
                type="button"
                onClick={() => setFilterType("7")}
                className={`py-2 px-2 rounded-xl border font-bold text-center transition ${
                  filterType === "7" ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-650 hover:bg-slate-100"
                }`}
              >
                Últimos 7 dias
              </button>

              <button
                type="button"
                onClick={() => setFilterType("14")}
                className={`py-2 px-2 rounded-xl border font-bold text-center transition ${
                  filterType === "14" ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-650 hover:bg-slate-100"
                }`}
              >
                Últimos 14 dias
              </button>

              <button
                type="button"
                onClick={() => setFilterType("30")}
                className={`py-2 px-2 rounded-xl border font-bold text-center transition ${
                  filterType === "30" ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-650 hover:bg-slate-100"
                }`}
              >
                Últimos 30 dias
              </button>
            </div>

            {/* Custom Range Indicator toggle row */}
            <div className="mt-1">
              <button
                type="button"
                onClick={() => setFilterType("custom")}
                className={`w-full py-2 px-2 text-xs rounded-xl border font-bold text-center transition ${
                  filterType === "custom" ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-650 hover:bg-slate-100"
                }`}
              >
                Período Personalizado (Calendário)
              </button>
            </div>
          </div>

          {/* Calendários (Visível apenas se 'custom' estiver marcado de forma explícita) */}
          {filterType === "custom" && (
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-150 animate-fadeIn">
              <div>
                <label className="block text-[9.5px] font-bold text-slate-550 text-slate-500 uppercase mb-1">De (Data Início)</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white font-mono text-slate-750"
                />
              </div>
              <div>
                <label className="block text-[9.5px] font-bold text-slate-550 text-slate-500 uppercase mb-1">Até (Data Limite)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white font-mono text-slate-750"
                />
              </div>
            </div>
          )}

          {/* Section 3: Layout Style selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <FileDown className="w-3.5 h-3.5 text-slate-400" />
              Modelo / Layout do Relatório PDF
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLayoutMode("compact")}
                className={`p-3 text-left rounded-xl border text-xs transition flex flex-col justify-between h-20 cursor-pointer ${
                  layoutMode === "compact"
                    ? "border-teal-500 bg-teal-50/25 text-teal-850 shadow-xs ring-1 ring-teal-500"
                    : "border-slate-200 bg-slate-50 text-slate-650 hover:bg-slate-100"
                }`}
              >
                <span className="font-extrabold block text-slate-800">Ficha Resumida (1 Pág)</span>
                <span className="text-[9.5px] text-slate-400 leading-tight">Ideal para consulta física rápido. Dados compactados lado a lado com médias de 30 dias inclusas.</span>
              </button>

              <button
                type="button"
                onClick={() => setLayoutMode("detailed")}
                className={`p-3 text-left rounded-xl border text-xs transition flex flex-col justify-between h-20 cursor-pointer ${
                  layoutMode === "detailed"
                    ? "border-teal-500 bg-teal-50/25 text-teal-850 shadow-xs ring-1 ring-teal-500"
                    : "border-slate-200 bg-slate-50 text-slate-650 hover:bg-slate-100"
                }`}
              >
                <span className="font-extrabold block text-slate-800">Prontuário Completo</span>
                <span className="text-[9.5px] text-slate-400 leading-tight">Histórico médico espaçado completo. Tabelas sequenciais completas ideias para arquivo extenso.</span>
              </button>
            </div>
          </div>

        </div>

        {/* Action Panel Button Bottom */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition cursor-pointer"
          >
            Voltar ao diário
          </button>
          
          <button
            type="button"
            onClick={generatePDF}
            className="px-5 py-2.5 rounded-xl text-xs font-black bg-teal-600 hover:bg-teal-700 text-white transition flex items-center space-x-1.5 shadow-sm shadow-teal-600/10 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Gerar PDF Oficial</span>
          </button>
        </div>

      </div>
    </div>
  );
}
