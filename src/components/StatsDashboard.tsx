import { useState } from "react";
import { BloodPressureReading, GlucoseReading, WeightReading, UserProfile } from "../types";
import { Heart, Activity, HeartCrack, ChevronUp, ChevronDown, Calendar, AlertTriangle, Calculator, Scale } from "lucide-react";

interface StatsDashboardProps {
  bpReadings: BloodPressureReading[];
  glucoseReadings: GlucoseReading[];
  weightReadings: WeightReading[];
  profile: UserProfile;
}

export default function StatsDashboard({ bpReadings, glucoseReadings, weightReadings, profile }: StatsDashboardProps) {
  const [activeChart, setActiveChart] = useState<'pressure' | 'glucose' | 'weight'>('pressure');

  // Calculates Blood Pressure Averages
  const avgSys = bpReadings.length > 0 
    ? Math.round(bpReadings.reduce((sum, r) => sum + r.systolic, 0) / bpReadings.length) 
    : 0;

  const avgDia = bpReadings.length > 0 
    ? Math.round(bpReadings.reduce((sum, r) => sum + r.diastolic, 0) / bpReadings.length) 
    : 0;

  const avgPulse = bpReadings.length > 0 
    ? Math.round(bpReadings.reduce((sum, r) => sum + r.pulse, 0) / bpReadings.length) 
    : 0;

  // Calculates Glucose Averages
  const fastingGl = glucoseReadings.filter(g => g.mealState === 'jejum');
  const avgFastingGlucose = fastingGl.length > 0
    ? Math.round(fastingGl.reduce((sum, r) => sum + r.value, 0) / fastingGl.length)
    : 0;

  const posPrandialGl = glucoseReadings.filter(g => g.mealState === 'pos_prandial');
  const avgPosGlucose = posPrandialGl.length > 0
    ? Math.round(posPrandialGl.reduce((sum, r) => sum + r.value, 0) / posPrandialGl.length)
    : 0;

  const overallAvgGlucose = glucoseReadings.length > 0
    ? Math.round(glucoseReadings.reduce((sum, r) => sum + r.value, 0) / glucoseReadings.length)
    : 0;

  // Convert height and calculate BMI/IMC
  const heightInMeters = profile.height / 100;
  
  const sortedWeightReadings = [...weightReadings].sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime());
  const latestWeight = sortedWeightReadings.length > 0 ? sortedWeightReadings[0] : null;
  const currentWeight = latestWeight ? latestWeight.weight : profile.weight;
  
  const imc = heightInMeters > 0 ? (currentWeight / (heightInMeters * heightInMeters)) : 0;
  const minIdealWeight = heightInMeters > 0 ? (18.5 * (heightInMeters * heightInMeters)) : 0;
  const maxIdealWeight = heightInMeters > 0 ? (24.9 * (heightInMeters * heightInMeters)) : 0;

  // Calculate age
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
  const age = calculateAge(profile.birthDate);

  const getImcCategory = (val: number) => {
    if (val <= 0) return { label: "N/A", color: "text-slate-400 bg-slate-50 border-slate-100" };
    if (val < 18.5) return { label: "Abaixo do peso", color: "text-amber-800 bg-amber-50 border-amber-100" };
    if (val >= 18.5 && val < 25) return { label: "Saudável", color: "text-emerald-800 bg-emerald-50 border-emerald-100" };
    if (val >= 25 && val < 30) return { label: "Sobrepeso", color: "text-orange-850 bg-orange-50 border-orange-100" };
    return { label: "Obesidade", color: "text-rose-800 bg-rose-50 border-rose-100" };
  };
  const imcInfo = getImcCategory(imc);

  // Blood pressure WHO classification rating for average
  const getAverageBPStatus = (sys: number, dia: number) => {
    if (sys === 0) return { label: "Nenhum registro", color: "text-slate-500 bg-slate-50 border-slate-100" };
    if (sys < 120 && dia < 80) return { label: "Saudável (Excelente)", color: "text-emerald-700 bg-emerald-50 border-emerald-100" };
    if (sys < 130 && dia < 85) return { label: "Normal / Estável", color: "text-emerald-700 bg-emerald-100/60 border-emerald-200" };
    if (sys < 140 && dia < 90) return { label: "Pré-Hipertensão", color: "text-amber-700 bg-amber-50 border-amber-100" };
    if (sys < 160 || dia < 100) return { label: "Hipertensão Estágio 1", color: "text-orange-750 bg-orange-50 border-orange-100" };
    return { label: "Hipertensão Estágio 2", color: "text-red-700 bg-red-50 border-red-200" };
  };

  const sortedBPReadings = [...bpReadings].sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime());
  const latestBP = sortedBPReadings.length > 0 ? sortedBPReadings[0] : null;

  const sortedGlucoseReadings = [...glucoseReadings].sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime());
  const latestGlucose = sortedGlucoseReadings.length > 0 ? sortedGlucoseReadings[0] : null;

  const avgWeight = weightReadings.length > 0 
    ? (weightReadings.reduce((sum, r) => sum + r.weight, 0) / weightReadings.length) 
    : 0;

  const bpStatus = getAverageBPStatus(
    latestBP ? latestBP.systolic : 0,
    latestBP ? latestBP.diastolic : 0
  );

  // Glucose state classification rating for average
  const getGlucoseAverageStatus = (val: number) => {
    if (val === 0) return { label: "Nenhum registro", color: "text-slate-500 bg-slate-50 border-slate-100" };
    if (val < 70) return { label: "Risco Hipoglicemia", color: "text-indigo-700 bg-indigo-50 border-indigo-100" };
    if (val <= 110) return { label: "Controle excelente", color: "text-emerald-700 bg-emerald-50 border-emerald-100" };
    if (val <= 140) return { label: "Controle aceitável", color: "text-amber-700 bg-amber-50 border-amber-100" };
    return { label: "Média Elevada", color: "text-red-700 bg-red-50 border-red-100" };
  };

  const glStatus = getGlucoseAverageStatus(latestGlucose ? latestGlucose.value : 0);

  // Chronologically sorted arrays for graphing (max 10 entries)
  const bpChartData = [...bpReadings]
    .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())
    .slice(-10);

  const glucoseChartData = [...glucoseReadings]
    .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())
    .slice(-10);

  const weightChartData = [...weightReadings]
    .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())
    .slice(-10);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between px-1 mb-1 sm:mb-2">
        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] sm:text-xs font-black text-slate-700 stats-patient-name">{profile.name}</span>
        </div>
        <div className="text-[10px] sm:text-xs font-bold text-slate-500 stats-patient-age">
          {calculateAge(profile.birthDate)} anos
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {/* Card 1: Pressure Average */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-2.5 sm:p-3 relative overflow-hidden flex flex-col justify-between min-h-[100px] sm:min-h-[120px]">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">Última Pressão</span>
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600 shrink-0">
                <Heart className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
              </div>
            </div>

            <div className="flex items-baseline space-x-1">
              <span className="text-base sm:text-xl font-black text-slate-800 tracking-tight">
                {latestBP ? `${latestBP.systolic}/${latestBP.diastolic}` : "--/--"}
              </span>
              <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold font-mono">mmHg</span>
            </div>

            <div className="mt-1">
              <span className={`text-[7.5px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 rounded-full border font-bold inline-block leading-normal ${bpStatus.color} max-w-full truncate`}>
                {bpStatus.label}
              </span>
            </div>
          </div>

          <div className="mt-2 border-t border-slate-50 pt-1">
            {latestBP ? (
              <p className="text-[8px] sm:text-[9.5px] text-slate-400 font-medium truncate">
                Pulso: <span className="font-bold text-slate-600 font-mono">{latestBP.pulse} bpm</span>
              </p>
            ) : (
              <p className="text-[8px] sm:text-[9.5px] text-slate-400 font-medium truncate">Sem pulso</p>
            )}
          </div>
        </div>

        {/* Card 2: Glucose Average */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-2.5 sm:p-3 relative overflow-hidden flex flex-col justify-between min-h-[100px] sm:min-h-[120px]">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">Última Glicose</span>
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                <Activity className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
              </div>
            </div>

            <div className="flex items-baseline space-x-1">
              <span className="text-base sm:text-xl font-black text-slate-800 tracking-tight">
                {latestGlucose ? latestGlucose.value : "---"}
              </span>
              <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold font-mono">mg/dL</span>
            </div>

            <div className="mt-1">
              <span className={`text-[7.5px] sm:text-[8px] px-1.5 sm:px-2 py-0.5 rounded-full border font-bold inline-block leading-normal ${glStatus.color} max-w-full truncate`}>
                {glStatus.label}
              </span>
            </div>
          </div>

          <div className="mt-1 border-t border-slate-50 pt-1 text-[8px] sm:text-[9.5px] text-slate-400 truncate">
            {latestGlucose ? (
              <span>Estado: <strong className="text-slate-600 font-bold">{latestGlucose.mealState === 'jejum' ? 'Em Jejum' : 'Pós-Refeição'}</strong></span>
            ) : (
              <span>Nenhum registro</span>
            )}
          </div>
        </div>

        {/* Card 3: Clinical Health Indexes */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-2.5 sm:p-3 flex flex-col justify-between min-h-[100px] sm:min-h-[120px]">
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-sans">Detalhes Glicêmicos</span>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <div className="bg-slate-50 p-1 rounded-lg border border-slate-100/60">
                <span className="text-[7px] sm:text-[8px] text-slate-400 block uppercase font-bold leading-none mb-0.5 truncate">Jejum</span>
                <span className="font-bold text-slate-700 text-[9px] font-mono">{avgFastingGlucose > 0 ? `${avgFastingGlucose}` : "--"} <span className="text-[6px] text-slate-400 font-normal">mg</span></span>
              </div>
              <div className="bg-slate-50 p-1 rounded-lg border border-slate-100/60">
                <span className="text-[7px] sm:text-[8px] text-slate-400 block uppercase font-bold leading-none mb-0.5 truncate">Pós-Ref.</span>
                <span className="font-bold text-slate-700 text-[9px] font-mono">{avgPosGlucose > 0 ? `${avgPosGlucose}` : "--"} <span className="text-[6px] text-slate-400 font-normal">mg</span></span>
              </div>
            </div>
          </div>

          <div className="text-[8px] sm:text-[9px] text-slate-400 border-t border-slate-50 pt-1 flex items-center gap-0.5 truncate">
            <HeartCrack className="w-2.5 h-2.5 text-rose-500 shrink-0" />
            <span className="truncate">Refeições no diário.</span>
          </div>
        </div>

        {/* Card 4: Interactive IMC / BMI Indicator (Requested on Home) */}
        <div id="home-imc-card" className="bg-white rounded-2xl shadow-xs border border-slate-100 p-2.5 sm:p-3 flex flex-col justify-between min-h-[100px] sm:min-h-[120px]">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">Peso & IMC Atual</span>
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <Scale className="w-3 h-3 text-indigo-600" />
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="text-base sm:text-xl font-black text-slate-800 tracking-tight">
                  {currentWeight.toFixed(1).replace('.', ',')} <span className="text-xs font-bold text-slate-400">kg</span>
                </span>
                {profile.targetWeight ? (
                  <span className="text-[8px] font-bold text-slate-500">Meta: {profile.targetWeight.toFixed(1).replace('.', ',')} kg</span>
                ) : (
                  <span className="text-[8px] font-bold text-slate-500">Sem meta def.</span>
                )}
              </div>
              
              <div className="flex flex-col items-end">
                <span className="text-xs sm:text-sm font-black text-indigo-900 tracking-tight">
                  <span className="text-[8px] text-indigo-400 font-bold mr-0.5">IMC</span>{imc > 0 ? imc.toFixed(1).replace('.', ',') : "N/A"}
                </span>
                <span className={`text-[7px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1 py-0.5 rounded-full block truncate`}>
                  {imcInfo.label}
                </span>
              </div>
            </div>
          </div>

          <div className="text-[8px] sm:text-[9px] text-slate-400 border-t border-slate-50 pt-1 flex items-center gap-1">
            <span className="font-mono bg-slate-100 px-1 rounded text-slate-500">{(profile.height / 100).toFixed(2).replace('.', ',')}m</span>
            <span>Altura cadastrada</span>
          </div>
        </div>
      </div>

      {/* Dynamic Rendered SVG Charting engine */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 border-b border-slate-50 pb-4">
          <div>
            <h3 className="font-bold text-slate-700 text-sm md:text-base">Distribuição e Tendências Clínicas</h3>
            <p className="text-xs text-slate-400">Linha temporal das últimas 10 medições do diário</p>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveChart('pressure')}
              className={`text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1.5 rounded-lg transition ${
                activeChart === 'pressure' 
                  ? "bg-teal-600 text-white shadow-sm chart-btn-active-pressure" 
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              Exibir Pressão
            </button>
            <button
              onClick={() => setActiveChart('glucose')}
              className={`text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1.5 rounded-lg transition ${
                activeChart === 'glucose' 
                  ? "bg-amber-500 text-white shadow-sm" 
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              Exibir Glicose
            </button>
            <button
              onClick={() => setActiveChart('weight')}
              className={`text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1.5 rounded-lg transition ${
                activeChart === 'weight' 
                  ? "bg-indigo-500 text-white shadow-sm" 
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              Exibir Peso
            </button>
          </div>
        </div>

        {activeChart === 'pressure' ? (
          bpChartData.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              Registre medições de Pressão Arterial para gerar o gráfico de tendência.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative h-36 sm:h-40 w-full bg-slate-50/40 rounded-xl p-2.5 border border-slate-100 flex items-end">
                {/* SVG Visual Canvas with vertical bars starting from zero */}
                <svg className="w-full h-[90%] overflow-visible">
                  {/* Grid background lines */}
                  {[0, 25, 50, 75, 100].map((percent, idx) => (
                    <line
                      key={idx}
                      x1="0%"
                      y1={`${percent}%`}
                      x2="100%"
                      y2={`${percent}%`}
                      stroke="#f1f5f9"
                      strokeWidth="1.5"
                    />
                  ))}

                  {/* Dual columns for Systolic and Diastolic starting from 0 to 200 mmHg */}
                  {bpChartData.map((d, index) => {
                    const slotWidth = 100 / bpChartData.length;
                    const barWidth = slotWidth * 0.28;
                    const barSpacing = slotWidth * 0.04;
                    const startX = index * slotWidth + (slotWidth - (barWidth * 2 + barSpacing)) / 2;

                    const sysHeight = (d.systolic / 200) * 100;
                    const sysY = 100 - sysHeight;

                    const diaHeight = (d.diastolic / 200) * 100;
                    const diaY = 100 - diaHeight;

                    return (
                      <g key={d.id} className="group cursor-pointer">
                        {/* Systolic Bar - Teal */}
                        <rect
                          x={`${startX}%`}
                          y={`${sysY}%`}
                          width={`${barWidth}%`}
                          height={`${sysHeight}%`}
                          fill="#0d9488"
                          rx="1.5"
                          className="transition-all duration-300 hover:opacity-85 pointer-events-auto"
                        />
                        {/* Diastolic Bar - Blue */}
                        <rect
                          x={`${startX + barWidth + barSpacing}%`}
                          y={`${diaY}%`}
                          width={`${barWidth}%`}
                          height={`${diaHeight}%`}
                          fill="#3b82f6"
                          rx="1.5"
                          className="transition-all duration-300 hover:opacity-85 pointer-events-auto"
                        />
                        
                        {/* Static light reading values labels perfectly above the bars */}
                        <text
                          x={`${startX + barWidth / 2}%`}
                          y={`${sysY - 1.5}%`}
                          textAnchor="middle"
                          fill="#0d9488"
                          fontSize="7"
                          fontWeight="bold"
                          className="font-mono"
                        >
                          {d.systolic}
                        </text>

                        <text
                          x={`${startX + barWidth + barSpacing + barWidth / 2}%`}
                          y={`${diaY - 1.5}%`}
                          textAnchor="middle"
                          fill="#3b82f6"
                          fontSize="7"
                          fontWeight="bold"
                          className="font-mono"
                        >
                          {d.diastolic}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Left labels scale */}
                <div className="absolute top-2 left-2 text-[8px] bg-white border border-slate-100 shadow-sm rounded px-1.5 py-0.5 text-slate-500 font-mono">
                  Sistólica / Diastólica (Escala 0 - 200 mmHg)
                </div>
                <div className="absolute bottom-2 left-2 text-[8px] bg-white border border-slate-100 shadow-sm rounded px-1.5 py-0.5 text-slate-500 font-mono">
                  Base: 0 mmHg
                </div>

                <div className="absolute bottom-2 right-2 text-[8px] bg-sky-50 text-slate-700 rounded px-1.5 py-0.5 font-bold stats-legend-text">
                  Sistólica (<span className="text-teal-600 font-black">■</span> Verde) / Diastólica (<span className="text-blue-500 font-black">■</span> Azul)
                </div>
              </div>

              {/* Chronological legend */}
              <div className="flex justify-between text-[8px] sm:text-[10px] text-slate-400 px-2 font-mono">
                <span>{new Date(bpChartData[0].measuredAt).toLocaleDateString('pt-BR')}</span>
                <span>Meio</span>
                <span>{new Date(bpChartData[bpChartData.length - 1].measuredAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          )
        ) : activeChart === 'glucose' ? (
          glucoseChartData.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              Registre medições de Glicose para gerar o gráfico histórico.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative h-36 sm:h-40 w-full bg-slate-50/40 rounded-xl p-2.5 border border-slate-100 flex items-end">
                {/* SVG Visual Canvas for Glucose */}
                <svg className="w-full h-[90%] overflow-visible">
                  {/* Grid background lines */}
                  {[0, 25, 50, 75, 100].map((percent, idx) => (
                    <line
                      key={idx}
                      x1="0%"
                      y1={`${percent}%`}
                      x2="100%"
                      y2={`${percent}%`}
                      stroke="#f1f5f9"
                      strokeWidth="1.5"
                    />
                  ))}

                  {/* Glucose Columns starting from zero */}
                  {glucoseChartData.map((d, index) => {
                    const slotWidth = 100 / glucoseChartData.length;
                    const barWidth = slotWidth * 0.4;
                    const startX = index * slotWidth + (slotWidth - barWidth) / 2;

                    const glHeight = (d.value / 300) * 100;
                    const glY = 100 - glHeight;

                    return (
                      <g key={d.id} className="group cursor-pointer">
                        <rect
                          x={`${startX}%`}
                          y={`${glY}%`}
                          width={`${barWidth}%`}
                          height={`${glHeight}%`}
                          fill="#f59e0b"
                          rx="1.5"
                        />
                        <text x={`${startX + barWidth / 2}%`} y={`${glY}%`} dy="-5" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="bold">
                          {Math.round(d.value)}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Left labels scale */}
                <div className="absolute top-2 left-2 text-[8px] bg-white border border-slate-100 shadow-sm rounded px-1.5 py-0.5 text-slate-500 font-mono">
                  Escala: 0 - 300 mg/dL
                </div>
                <div className="absolute bottom-2 left-2 text-[8px] bg-white border border-slate-100 shadow-sm rounded px-1.5 py-0.5 text-slate-500 font-mono">
                  Base: 0 mg/dL
                </div>
              </div>

              {/* Chronological legend */}
              <div className="flex justify-between text-[8px] sm:text-[10px] text-slate-400 px-2 font-mono">
                <span>{new Date(glucoseChartData[0].measuredAt).toLocaleDateString('pt-BR')}</span>
                <span>Meio</span>
                <span>{new Date(glucoseChartData[glucoseChartData.length - 1].measuredAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          )
        ) : (
          weightChartData.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              Registre medições de Peso para gerar o gráfico histórico.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative h-36 sm:h-40 w-full bg-slate-50/40 rounded-xl p-2.5 border border-slate-100 flex items-end">
                {/* SVG Visual Canvas for Weight */}
                <svg className="w-full h-[90%] overflow-visible">
                  {/* Grid background lines */}
                  {[0, 25, 50, 75, 100].map((percent, idx) => (
                    <line
                      key={idx}
                      x1="0%"
                      y1={`${percent}%`}
                      x2="100%"
                      y2={`${percent}%`}
                      stroke="#f1f5f9"
                      strokeWidth="1.5"
                    />
                  ))}

                  {/* Weight Columns starting from zero */}
                  {weightChartData.map((d, index) => {
                    const slotWidth = 100 / weightChartData.length;
                    const barWidth = slotWidth * 0.4;
                    const startX = index * slotWidth + (slotWidth - barWidth) / 2;

                    const maxW = Math.max(120, ...weightChartData.map(w => w.weight)) * 1.2;
                    const wtHeight = (d.weight / maxW) * 100;
                    const wtY = 100 - wtHeight;

                    return (
                      <g key={d.id} className="group cursor-pointer">
                        <rect
                          x={`${startX}%`}
                          y={`${wtY}%`}
                          width={`${barWidth}%`}
                          height={`${wtHeight}%`}
                          fill="#4f46e5"
                          rx="1.5"
                        />
                        <text x={`${startX + barWidth / 2}%`} y={`${wtY}%`} dy="-5" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="bold">
                          {d.weight.toFixed(1).replace('.', ',')}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div className="absolute top-2 left-2 text-[8px] bg-white border border-slate-100 shadow-sm rounded px-1.5 py-0.5 text-slate-500 font-mono">
                  Escala: 0 - {Math.round(Math.max(120, ...weightChartData.map(w => w.weight)) * 1.2)} kg
                </div>
                <div className="absolute bottom-2 left-2 text-[8px] bg-white border border-slate-100 shadow-sm rounded px-1.5 py-0.5 text-slate-500 font-mono">
                  Base: 0 kg
                </div>
              </div>

              {/* Chronological legend */}
              <div className="flex justify-between text-[8px] sm:text-[10px] text-slate-400 px-2 font-mono">
                <span>{new Date(weightChartData[0].measuredAt).toLocaleDateString('pt-BR')}</span>
                <span>Meio</span>
                <span>{new Date(weightChartData[weightChartData.length - 1].measuredAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          )
        )}
      </div>

      {/* WHO & ADA Reference Guide */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <h4 className="font-bold text-slate-700 flex items-center space-x-1 mb-2">
            <Heart className="w-3.5 h-3.5 text-teal-600" />
            <span>Classificação da Pressão (Padrão OMS)</span>
          </h4>
          <div className="space-y-1">
            <div className="flex justify-between p-1.5 bg-white border border-slate-100 rounded-lg">
              <span className="font-semibold text-emerald-700">Ótima / Normal</span>
              <span className="text-slate-500">Menor que 130 / 85 mmHg</span>
            </div>
            <div className="flex justify-between p-1.5 bg-white border border-slate-100 rounded-lg">
              <span className="font-semibold text-amber-700">Limítrofe</span>
              <span className="text-slate-500">130-139 / 85-89 mmHg</span>
            </div>
            <div className="flex justify-between p-1.5 bg-white border border-slate-100 rounded-lg">
              <span className="font-semibold text-orange-700">Hipertensão Estágio 1</span>
              <span className="text-slate-500">140-159 / 90-99 mmHg</span>
            </div>
            <div className="flex justify-between p-1.5 bg-white border border-slate-100 rounded-lg">
              <span className="font-semibold text-rose-700">Hipertensão Estágio 2</span>
              <span className="text-slate-500">Maior que 160 / 100 mmHg</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-slate-700 flex items-center space-x-1 mb-2">
            <Activity className="w-3.5 h-3.5 text-amber-500" />
            <span>Glicemia em Jejum (Diretrizes ADA)</span>
          </h4>
          <div className="space-y-1">
            <div className="flex justify-between p-1.5 bg-white border border-slate-100 rounded-lg">
              <span className="font-semibold text-emerald-700">Ideal / Sob Controle</span>
              <span className="text-slate-500">70 a 99 mg/dL</span>
            </div>
            <div className="flex justify-between p-1.5 bg-white border border-slate-100 rounded-lg">
              <span className="font-semibold text-amber-700">Pré-Diabetes</span>
              <span className="text-slate-500">100 a 125 mg/dL</span>
            </div>
            <div className="flex justify-between p-1.5 bg-white border border-slate-100 rounded-lg">
              <span className="font-semibold text-rose-700">Suspeita de Diabetes</span>
              <span className="text-slate-500">126 mg/dL ou mais</span>
            </div>
            <div className="flex justify-between p-1.5 bg-white border border-slate-100 rounded-lg">
              <span className="font-semibold text-indigo-700">Hipoglicemia</span>
              <span className="text-slate-500">Abaixo de 70 mg/dL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
