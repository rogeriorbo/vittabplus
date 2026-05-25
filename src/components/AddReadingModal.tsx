import { useState } from "react";
import { Activity, Plus, Heart, Calendar, Clock, Sparkles, Tag, Check, MessageSquare } from "lucide-react";
import { BloodPressureReading, GlucoseReading, WeightReading } from "../types";

interface AddReadingModalProps {
  onAddBP: (bp: Omit<BloodPressureReading, 'id'>) => void;
  onAddGlucose: (gl: Omit<GlucoseReading, 'id'>) => void;
  onAddWeight: (wt: Omit<WeightReading, 'id'>) => void;
}

export default function AddReadingModal({ onAddBP, onAddGlucose, onAddWeight }: AddReadingModalProps) {
  const [activeTab, setActiveTab] = useState<'pressure' | 'glucose' | 'weight'>('pressure');
  
  // Blood Pressure states
  const [systolic, setSystolic] = useState<number>(120);
  const [diastolic, setDiastolic] = useState<number>(80);
  const [pulse, setPulse] = useState<number>(75);
  const [bpNotes, setBpNotes] = useState("");
  const [bpTags, setBpTags] = useState<string[]>(["Braço Esquerdo", "Sentado"]);
  const [bpDate, setBpDate] = useState(new Date().toISOString().substring(0, 10));
  const [bpTime, setBpTime] = useState(new Date().toTimeString().substring(0, 5));

  // Glucose states
  const [glucoseVal, setGlucoseVal] = useState<number>(95);
  const [mealState, setMealState] = useState<GlucoseReading['mealState']>('jejum');
  const [glNotes, setGlNotes] = useState("");
  const [glTags, setGlTags] = useState<string[]>(["Após Acordar"]);
  const [glDate, setGlDate] = useState(new Date().toISOString().substring(0, 10));
  const [glTime, setGlTime] = useState(new Date().toTimeString().substring(0, 5));

  // Weight states
  const [weightVal, setWeightVal] = useState<number>(75.0);
  const [wtNotes, setWtNotes] = useState("");
  const [wtDate, setWtDate] = useState(new Date().toISOString().substring(0, 10));
  const [wtTime, setWtTime] = useState(new Date().toTimeString().substring(0, 5));

  // Custom tag inputs
  const [customTag, setCustomTag] = useState("");

  const bpPresetTags = [
    "Braço Esquerdo", "Braço Direito", "Sentado", "Deitado", "Em Pé", "Antes do Remédio", "Após Exercício"
  ];

  const glPresetTags = [
    "Após Acordar", "Antes do Almoço", "Após Almoço", "Antes do Jantar", "Pós Jantar", "Pré Exercício"
  ];

  const toggleBpTag = (tag: string) => {
    setBpTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const toggleGlTag = (tag: string) => {
    setGlTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleAddCustomTag = () => {
    const trimmed = customTag.trim();
    if (!trimmed) return;
    if (activeTab === 'pressure') {
      if (!bpTags.includes(trimmed)) setBpTags([...bpTags, trimmed]);
    } else {
      if (!glTags.includes(trimmed)) setGlTags([...glTags, trimmed]);
    }
    setCustomTag("");
  };

  // Get WHO Blood Pressure classification
  const getBPClassification = (sys: number, dia: number) => {
    if (sys < 120 && dia < 80) return { label: "Muito Saudável (Ótima)", color: "text-emerald-600 bg-emerald-50 border-emerald-100", status: "normal" };
    if (sys < 130 && dia < 85) return { label: "Normal", color: "text-emerald-600 bg-emerald-50 border-emerald-100", status: "normal" };
    if (sys < 140 && dia < 90) return { label: "Limítrofe (Pré-Hipertensão)", color: "text-amber-600 bg-amber-50 border-amber-100", status: "pre" };
    if (sys < 160 || dia < 100) return { label: "Hipertensão Estágio 1 (Leve)", color: "text-orange-600 bg-orange-50 border-orange-100", status: "hiper1" };
    if (sys < 180 || dia < 110) return { label: "Hipertensão Estágio 2 (Moderada)", color: "text-rose-600 bg-rose-50 border-rose-100", status: "hiper2" };
    return { label: "Crise Hipertensiva (Urgência Médica)", color: "text-red-700 bg-red-50 border-red-200 font-bold", status: "crise" };
  };

  // Get American Diabetes Association Glucose classification
  const getGlucoseClassification = (val: number, state: string) => {
    if (state === 'jejum') {
      if (val < 70) return { label: "Glicemia Baixa (Hipoglicemia)", color: "text-indigo-600 bg-indigo-50 border-indigo-100" };
      if (val <= 99) return { label: "Glicemia de Jejum Normal", color: "text-emerald-600 bg-emerald-50 border-emerald-100" };
      if (val <= 125) return { label: "Glicemia de Jejum Alterada (Pré-Diabetes)", color: "text-amber-600 bg-amber-50 border-amber-100" };
      return { label: "Hiperglicemia Sugestiva de Diabetes", color: "text-red-600 bg-red-50 border-red-100" };
    } else {
      // Pós-prandial ou geral
      if (val < 70) return { label: "Hipoglicemia", color: "text-indigo-600 bg-indigo-50 border-indigo-100" };
      if (val < 140) return { label: "Normal Pós-Refeição", color: "text-emerald-600 bg-emerald-50 border-emerald-100" };
      if (val < 200) return { label: "Glicemia pós-prandial elevada", color: "text-amber-600 bg-amber-50 border-amber-100" };
      return { label: "Pico de Hiperglicemia", color: "text-red-600 bg-red-50 border-red-100" };
    }
  };

  const bpClass = getBPClassification(systolic, diastolic);
  const glClass = getGlucoseClassification(glucoseVal, mealState);

  const handleSubmitBP = () => {
    const measuredAt = new Date(`${bpDate}T${bpTime}`).toISOString();
    onAddBP({
      systolic,
      diastolic,
      pulse,
      notes: bpNotes,
      tags: bpTags,
      measuredAt
    });
    // reset state
    setBpNotes("");
  };

  const handleSubmitGlucose = () => {
    const measuredAt = new Date(`${glDate}T${glTime}`).toISOString();
    onAddGlucose({
      value: glucoseVal,
      mealState,
      notes: glNotes,
      tags: glTags,
      measuredAt
    });
    // reset state
    setGlNotes("");
  };

  const handleSubmitWeight = () => {
    const measuredAt = new Date(`${wtDate}T${wtTime}`).toISOString();
    onAddWeight({
      weight: Number(weightVal),
      notes: wtNotes,
      measuredAt
    });
    setWtNotes("");
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 p-2.5 sm:p-4">
      <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1.5 sm:mb-3 flex items-center space-x-2">
        <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 animate-pulse" />
        <span>Registrar Novo Exame / Diário</span>
      </h3>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 mb-2 sm:mb-3.5">
        <button
          onClick={() => setActiveTab('pressure')}
          className={`flex-1 pb-2 sm:pb-3 text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-1.5 sm:space-x-2 border-b-2 cursor-pointer ${
            activeTab === 'pressure' 
              ? "border-teal-600 text-teal-600" 
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Pressão Arterial</span>
        </button>

        <button
          onClick={() => setActiveTab('glucose')}
          className={`flex-1 pb-2 sm:pb-3 text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-1.5 sm:space-x-2 border-b-2 cursor-pointer ${
            activeTab === 'glucose' 
              ? "border-amber-500 text-amber-500" 
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Glicose Sanguínea</span>
          <span className="sm:hidden">Glicose</span>
        </button>

        <button
          onClick={() => setActiveTab('weight')}
          className={`flex-1 pb-2 sm:pb-3 text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-1.5 sm:space-x-2 border-b-2 cursor-pointer ${
            activeTab === 'weight' 
              ? "border-indigo-500 text-indigo-500" 
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Peso Corp.</span>
        </button>
      </div>

      {activeTab === 'pressure' ? (
        <div className="space-y-3 sm:space-y-4">
          {/* WHO Indicator Badge */}
          <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border text-[10px] sm:text-xs text-center font-bold sm:font-medium ${bpClass.color} transition-all duration-300`}>
            Status: {bpClass.label}
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-slate-500 mb-0.5 sm:mb-1 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-teal-500 shrink-0"></span>
                <span>Sistólica</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={systolic}
                  onChange={(e) => setSystolic(Number(e.target.value))}
                  className="w-full text-center text-sm sm:text-lg font-bold px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded-lg sm:rounded-xl focus:border-teal-500 focus:outline-none"
                />
                <span className="absolute bottom-0.5 sm:bottom-1 right-1 sm:right-2 text-[6.5px] sm:text-[8px] text-slate-400 font-mono">mmHg</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-slate-500 mb-0.5 sm:mb-1 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-teal-400 shrink-0"></span>
                <span>Diastólica</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={diastolic}
                  onChange={(e) => setDiastolic(Number(e.target.value))}
                  className="w-full text-center text-sm sm:text-lg font-bold px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded-lg sm:rounded-xl focus:border-teal-500 focus:outline-none"
                />
                <span className="absolute bottom-0.5 sm:bottom-1 right-1 sm:right-2 text-[6.5px] sm:text-[8px] text-slate-400 font-mono">mmHg</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-slate-500 mb-0.5 sm:mb-1 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-400 shrink-0"></span>
                <span>Pulso</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={pulse}
                  onChange={(e) => setPulse(Number(e.target.value))}
                  className="w-full text-center text-sm sm:text-lg font-bold px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded-lg sm:rounded-xl focus:border-teal-500 focus:outline-none"
                />
                <span className="absolute bottom-0.5 sm:bottom-1 right-1 sm:right-2 text-[6.5px] sm:text-[8px] text-slate-400 font-mono">bpm</span>
              </div>
            </div>
          </div>

          {/* Quick ranges slider for BP */}
          <div className="space-y-1 bg-slate-50/50 p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-slate-100">
            <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-slate-400 block font-bold">Simular Variação</span>
            <input
              type="range"
              min="90"
              max="190"
              value={systolic}
              onChange={(e) => {
                const sys = Number(e.target.value);
                setSystolic(sys);
                // Proportional estimation for default matching diastolic ratios
                setDiastolic(Math.round(sys * 0.65));
              }}
              className="w-full accent-teal-600"
            />
          </div>

          {/* Preset Tags picker */}
          <div>
            <span className="block text-[10px] sm:text-xs font-medium text-slate-500 mb-1 sm:mb-1.5 flex items-center space-x-1">
              <Tag className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-slate-400" />
              <span>Contexto de Medição</span>
            </span>
            <div className="flex flex-wrap gap-1">
              {bpPresetTags.map((tag) => {
                const isSelected = bpTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleBpTag(tag)}
                    className={`text-[9.5px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border transition-all cursor-pointer ${
                      isSelected 
                        ? "bg-teal-600 text-white border-teal-600 shadow-sm bp-tag-selected" 
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : activeTab === 'glucose' ? (
        <div className="space-y-3 sm:space-y-4">
          {/* Glucose Indicator Badge */}
          <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border text-[10px] sm:text-xs text-center font-bold sm:font-medium ${glClass.color} transition-all duration-300`}>
            Status: {glClass.label}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-slate-500 mb-0.5 sm:mb-1">Glicose Sanguínea (Valor)</label>
              <div className="relative">
                <input
                  type="number"
                  value={glucoseVal}
                  onChange={(e) => setGlucoseVal(Number(e.target.value))}
                  className="w-full font-bold text-sm sm:text-lg px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded-lg sm:rounded-xl focus:border-amber-500 focus:outline-none"
                />
                <span className="absolute bottom-1.5 sm:bottom-2.5 right-2 sm:right-3 text-[8px] sm:text-[10px] font-bold text-slate-400 font-mono">mg/dL</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-slate-500 mb-0.5 sm:mb-1">Momento do Teste / Estado</label>
              <select
                value={mealState}
                onChange={(e) => setMealState(e.target.value as GlucoseReading['mealState'])}
                className="w-full text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 sm:py-2.5 border border-slate-200 bg-white rounded-lg sm:rounded-xl focus:border-amber-500 focus:outline-none"
              >
                <option value="jejum">Fasting / Em Jejum</option>
                <option value="pre_prandial">Pré-prandial (Antes de Comer)</option>
                <option value="pos_prandial">Pós-prandial (2h após comer)</option>
                <option value="antes_de_dormir">Antes de dormir</option>
                <option value="outro">Outro momento / Geral</option>
              </select>
            </div>
          </div>

          {/* Quick slider for Glucose */}
          <div className="space-y-1 bg-slate-50/50 p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-slate-100">
            <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-slate-400 block font-bold">Simular Medição</span>
            <input
              type="range"
              min="50"
              max="240"
              value={glucoseVal}
              onChange={(e) => setGlucoseVal(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Glucose presets tags */}
          <div>
            <span className="block text-[10px] sm:text-xs font-medium text-slate-500 mb-1 sm:mb-1.5 flex items-center space-x-1">
              <Tag className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-slate-400" />
              <span>Marcadores Clínicos</span>
            </span>
            <div className="flex flex-wrap gap-1">
              {glPresetTags.map((tag) => {
                const isSelected = glTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleGlTag(tag)}
                    className={`text-[9.5px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border transition-all cursor-pointer ${
                      isSelected 
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm" 
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col items-center py-2.5 bg-slate-50 border border-slate-100 rounded-xl">
            <label className="block text-[10px] sm:text-xs font-semibold text-slate-500 mb-1">Peso Atual (Registro Evolutivo)</label>
            <div className="relative w-3/4 sm:w-1/2">
              <input
                type="number"
                step="0.1"
                value={weightVal}
                onChange={(e) => setWeightVal(Number(e.target.value))}
                className="w-full text-center font-black text-2xl sm:text-2xl text-indigo-700 bg-white border border-indigo-100 rounded-xl px-4 py-2 sm:py-3 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 focus:outline-none transition-all shadow-sm"
              />
              <span className="absolute bottom-1.5 sm:bottom-2.5 right-3 sm:right-4 text-[10px] sm:text-xs font-semibold text-indigo-400">kg</span>
            </div>
            
            <div className="w-full px-4 mt-3">
              <div className="space-y-1 bg-white p-2 rounded-xl border border-slate-200 w-full shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold text-center mb-0.5">Ajuste Rápido (Slider)</span>
                <input
                  type="range"
                  min="30"
                  max="180"
                  step="0.1"
                  value={weightVal}
                  onChange={(e) => setWeightVal(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shared tag addition, notes calendar & clock */}
      <div className="mt-2.5 sm:mt-3.5 space-y-2 sm:space-y-2.5 pt-2 sm:pt-3 border-t border-slate-100">
        {activeTab !== 'weight' && (
        <div>
          <label className="block text-[10px] sm:text-xs font-medium text-slate-500 mb-1 sm:mb-1.5 flex items-center space-x-1">
            <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-slate-400" />
            <span>Adicionar Tag Personalizada (Opcional)</span>
          </label>
          <div className="flex items-center space-x-1.5">
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              placeholder="Ex: Sentindo dor de cabeça, braço esquerdo..."
              className="flex-1 text-[10px] sm:text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded-lg sm:rounded-xl focus:border-teal-500 focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
            />
            <button
              onClick={handleAddCustomTag}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] sm:text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition cursor-pointer"
            >
              Adicionar
            </button>
          </div>
        </div>
        )}

        {/* Date & Time fields */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div>
            <label className="block text-[10px] sm:text-xs font-medium text-slate-500 mb-0.5 sm:mb-1 flex items-center space-x-1">
              <Calendar className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-slate-400" />
              <span>Data</span>
            </label>
            <input
              type="date"
              value={activeTab === 'pressure' ? bpDate : activeTab === 'glucose' ? glDate : wtDate}
              onChange={(e) => {
                if (activeTab === 'pressure') setBpDate(e.target.value);
                else if (activeTab === 'glucose') setGlDate(e.target.value);
                else setWtDate(e.target.value);
              }}
              className="w-full text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] sm:text-xs font-medium text-slate-500 mb-0.5 sm:mb-1 flex items-center space-x-1">
              <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-slate-400" />
              <span>Hora</span>
            </label>
            <input
              type="time"
              value={activeTab === 'pressure' ? bpTime : activeTab === 'glucose' ? glTime : wtTime}
              onChange={(e) => {
                if (activeTab === 'pressure') setBpTime(e.target.value);
                else if (activeTab === 'glucose') setGlTime(e.target.value);
                else setWtTime(e.target.value);
              }}
              className="w-full text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] sm:text-xs font-medium text-slate-500 mb-0.5 sm:mb-1 flex items-center space-x-1">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            <span>Notas Clínicas ou Sintomas</span>
          </label>
          <textarea
            value={activeTab === 'pressure' ? bpNotes : activeTab === 'glucose' ? glNotes : wtNotes}
            onChange={(e) => {
              if (activeTab === 'pressure') setBpNotes(e.target.value);
              else if (activeTab === 'glucose') setGlNotes(e.target.value);
              else setWtNotes(e.target.value);
            }}
            placeholder="Como você está se sentindo?"
            rows={2}
            className="w-full text-[10px] sm:text-xs p-2 sm:p-2.5 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-slate-400"
          ></textarea>
        </div>

        <button
          onClick={activeTab === 'pressure' ? handleSubmitBP : activeTab === 'glucose' ? handleSubmitGlucose : handleSubmitWeight}
          className={`w-full py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg sm:rounded-xl font-semibold text-[11px] sm:text-xs text-white shadow-sm flex items-center justify-center space-x-1.5 sm:space-x-2 transition cursor-pointer ${
            activeTab === 'pressure' ? "bg-teal-600 hover:bg-teal-700" : activeTab === 'glucose' ? "bg-amber-500 hover:bg-amber-600" : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Salvar no Diário</span>
        </button>
      </div>
    </div>
  );
}
