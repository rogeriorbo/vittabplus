import { useState } from "react";
import { Sparkles, Activity, AlertCircle, Heart, Award, ShieldAlert, Download } from "lucide-react";
import { BloodPressureReading, GlucoseReading, UserProfile } from "../types";
import { downloadFile } from "../utils/export";
import jsPDF from "jspdf";

interface InsightsPanelProps {
  bpReadings: BloodPressureReading[];
  glucoseReadings: GlucoseReading[];
  profile?: UserProfile;
}

export default function InsightsPanel({ bpReadings, glucoseReadings, profile }: InsightsPanelProps) {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    setInsights(null);

    try {
      const response = await fetch("/api/gemini/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bpReadings, glucoseReadings })
      });

      const data = await response.json();

      if (data.success) {
        setInsights(data.insights);
      } else {
        setError(data.message || "Não foi possível resgatar seus insights clínicos com IA.");
      }
    } catch (err: any) {
      setError(`Erro na requisição dos insights: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const exportInsightsPDF = () => {
    if (!insights) return;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let cursorY = 20;

    // Header Block
    doc.setFillColor(20, 184, 166); // Teal 500
    doc.rect(0, 0, pageWidth, 28, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Relatório VittaBPlus - Copiloto Clínico", 15, 14);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 15, 21);

    cursorY = 40;

    // Patient Info Block
    if (profile && profile.name) {
      doc.setTextColor(30, 41, 59); // Slate 800
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Informações do Paciente", 15, cursorY);
      cursorY += 7;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Nome Completo: ${profile.name}`, 15, cursorY);
      cursorY += 5.5;
      
      const details = [];
      if (profile.birthDate) {
        // Formata idade simples
        const [year, month, day] = profile.birthDate.split('-');
        if (year && month && day) {
           details.push(`Nascimento: ${day}/${month}/${year}`);
        }
      }
      if (profile.height) details.push(`Altura: ${profile.height} cm`);
      if (profile.weight) details.push(`Peso: ${profile.weight} kg`);

      if (details.length > 0) {
        doc.text(details.join("   |   "), 15, cursorY);
        cursorY += 6;
      }
      
      // Divider below patient
      cursorY += 4;
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.line(15, cursorY, pageWidth - 15, cursorY);
      cursorY += 8;
    }

    // AI Insights Title
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(13, 148, 136); // Teal 600
    doc.text("Análise e Direções de Saúde (IA)", 15, cursorY);
    cursorY += 8;

    // Insights Body Content
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105); // Slate 600
    
    const lines = insights.split('\n');
    lines.forEach((line) => {
      // Basic sanitization
      let cleanLine = line
        .replace(/\*\*/g, "") // Remove bold
        .replace(/#/g, "")   // Remove header
        .replace(/&[a-z0-9]+;/gi, " ") // Remove HTML entities
        .replace(/&/g, "e")  // Replace ampersand
        .replace(/þ/g, "")   // Remove corrupted char
        .trim();

      if (cleanLine.length === 0) return; // Skip empty lines

      let indent = 15;
      // Handle simple bullet points
      if (cleanLine.startsWith("*") || cleanLine.startsWith("-")) {
        cleanLine = "• " + cleanLine.substring(1).trim();
        indent = 20;
      }

      const splitText = doc.splitTextToSize(cleanLine, pageWidth - (indent + 15));
      const lineCount = splitText.length;
      
      if (cursorY + (lineCount * 5.5) > 275) { 
          doc.addPage();
          cursorY = 20;
      }

      doc.text(cleanLine, indent, cursorY, { 
        align: 'justify', 
        maxWidth: pageWidth - (indent + 15) 
      } as any);
      
      // Calculate how many lines were created to advance cursorY
      cursorY += lineCount * 5.5;
      cursorY += 2; // Extra space after paragraphs/items
    });

    doc.save("vittabp_copiloto_clinico.pdf");
  };

  return (
    <div id="insights-panel-component" className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl shadow-sm p-4 sm:p-5 relative overflow-hidden transition-all duration-300">
      {/* Decorative subtle ambient lights */}
      <div className="absolute right-0 top-0 w-44 h-44 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute left-0 bottom-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>

      <div className="relative z-10">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-teal-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-teal-300 tracking-wider uppercase">Copiloto Clínico</span>
            <h3 className="font-bold text-sm md:text-base leading-tight text-white">Análise e Direções de Saúde com IA</h3>
          </div>
        </div>

        <p className="text-xs text-slate-200 leading-normal mb-3">
          Suas medições sob ótica clínica. Nossa inteligência correlaciona horários, picos e notas de alimentação para lhe instruir sobre bem-estar e hábitos.
        </p>

        {insights && (
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 mb-4 border border-white/10 text-xs text-slate-200 space-y-3 prose max-w-none leading-relaxed animate-fadeIn">
            <div className="border-b border-white/10 pb-2 mb-2 flex items-center justify-between">
              <span className="flex items-center space-x-1.5 text-teal-400 font-bold uppercase tracking-wider text-[10px]">
                <Award className="w-3.5 h-3.5" />
                <span>VittaBPlus AI Relatório de Tendências Baseado no Diário</span>
              </span>
            </div>
            {/* Simple Markdown Render parser */}
            <div className="space-y-2 whitespace-pre-wrap">
              {insights}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start space-x-2 bg-red-950/50 border border-red-500/30 text-red-200 text-xs p-3.5 rounded-xl mb-4">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" id="insight-alert" />
            <div className="space-y-1">
              <span className="font-semibold block">Falha ao gerar insights</span>
              <p className="text-[11px] text-red-300 leading-tight">{error}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={fetchInsights}
              disabled={loading}
              className="bg-teal-400 hover:bg-teal-500 disabled:opacity-50 text-slate-950 text-xs font-bold py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? "Processando Diário Clínico..." : "Gerar Relatório de Insights com IA"}</span>
            </button>
            {insights && (
              <button
                onClick={exportInsightsPDF}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Análise (PDF)</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-1.5 bg-white/5 px-3 py-2 rounded-lg text-[9px] text-slate-200 border border-white/5 md:max-w-xs">
            <ShieldAlert className="w-5 h-5 text-amber-500/80 shrink-0" />
            <span className="leading-tight">
              <strong>Isenção de Responsabilidade:</strong> Informações preventivas e de estilo de vida. Consulte profissionais de cardiologia/endocrinologia para decisões médicas.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
