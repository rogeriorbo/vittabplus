import { useState, useEffect } from "react";
import { X, Heart, Activity, Calendar, Clock, Sparkles, Tag, Check, MessageSquare, Save, Scale } from "lucide-react";
import { BloodPressureReading, GlucoseReading, WeightReading } from "../types";

interface EditReadingModalProps {
  isOpen: boolean;
  reading: BloodPressureReading | GlucoseReading | WeightReading | null;
  type: 'pressure' | 'glucose' | 'weight';
  onSave: (id: string, updatedData: any) => void;
  onClose: () => void;
}

export default function EditReadingModal({ isOpen, reading, type, onSave, onClose }: EditReadingModalProps) {
  // Form states
  const [systolic, setSystolic] = useState<number>(120);
  const [diastolic, setDiastolic] = useState<number>(80);
  const [pulse, setPulse] = useState<number>(75);
  
  const [glucoseVal, setGlucoseVal] = useState<number>(95);
  const [mealState, setMealState] = useState<'jejum' | 'pre_prandial' | 'pos_prandial' | 'antes_de_dormir' | 'outro'>('jejum');
  
  const [weightVal, setWeightVal] = useState<number>(75);

  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  
  const [customTag, setCustomTag] = useState("");

  const bpPresetTags = [
    "Braço Esquerdo", "Braço Direito", "Sentado", "Deitado", "Em Pé", "Antes do Remédio", "Após Exercício"
  ];

  const glPresetTags = [
    "Após Acordar", "Antes do Almoço", "Após Almoço", "Antes do Jantar", "Pós Jantar", "Pré Exercício"
  ];

  // Sync state with reading prop
  useEffect(() => {
    if (reading) {
      const itemDate = new Date(reading.measuredAt);
      setDate(itemDate.toISOString().substring(0, 10));
      setTime(itemDate.toTimeString().substring(0, 5));
      setNotes(reading.notes || "");
      setTags('tags' in reading ? reading.tags || [] : []);

      if (type === 'pressure') {
        const bp = reading as BloodPressureReading;
        setSystolic(bp.systolic);
        setDiastolic(bp.diastolic);
        setPulse(bp.pulse);
      } else if (type === 'glucose') {
        const gl = reading as GlucoseReading;
        setGlucoseVal(gl.value);
        setMealState(gl.mealState);
      } else {
        const wt = reading as WeightReading;
        setWeightVal(wt.weight);
      }
    }
  }, [reading, type]);

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleAddCustomTag = () => {
    const trimmed = customTag.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setCustomTag("");
  };

  const handleSubmit = () => {
    const measuredAt = new Date(`${date}T${time}`).toISOString();
    
    if (type === 'pressure') {
      onSave(reading.id, {
        systolic,
        diastolic,
        pulse,
        notes,
        tags,
        measuredAt
      });
    } else if (type === 'glucose') {
      onSave(reading.id, {
        value: glucoseVal,
        mealState,
        notes,
        tags,
        measuredAt
      });
    } else {
      onSave(reading.id, {
        weight: weightVal,
        notes,
        tags,
        measuredAt
      });
    }
    onClose();
  };

  // Classifications matching original app rules
  const getBPClassification = (sys: number, dia: number) => {
    if (sys < 120 && dia < 80) return { label: "Muito Saudável (Ótima)", color: "text-emerald-600 bg-emerald-50 border-emerald-100" };
    if (sys < 130 && dia < 85) return { label: "Normal", color: "text-emerald-600 bg-emerald-50 border-emerald-100" };
    if (sys < 140 && dia < 90) return { label: "Limítrofe (Pré-Hipertensão)", color: "text-amber-600 bg-amber-50 border-amber-100" };
    if (sys < 160 || dia < 100) return { label: "Hipertensão Estágio 1 (Leve)", color: "text-orange-600 bg-orange-50 border-orange-100" };
    if (sys < 180 || dia < 110) return { label: "Hipertensão Estágio 2 (Moderada)", color: "text-rose-600 bg-rose-50 border-rose-100" };
    return { label: "Crise Hipertensiva (Urgência Médica)", color: "text-red-700 bg-red-50 border-red-200 font-bold" };
  };

  const getGlucoseClassification = (val: number, state: string) => {
    if (state === 'jejum') {
      if (val < 70) return { label: "Glicemia Baixa (Hipoglicemia)", color: "text-indigo-600 bg-indigo-50 border-indigo-100" };
      if (val <= 99) return { label: "Glicemia de Jejum Normal", color: "text-emerald-600 bg-emerald-50 border-emerald-100" };
      if (val <= 125) return { label: "Glicemia de Jejum Alterada (Pré-Diabetes)", color: "text-amber-600 bg-amber-50 border-amber-100" };
      return { label: "Hiperglicemia Sugestiva de Diabetes", color: "text-red-600 bg-red-50 border-red-100" };
    } else {
      if (val < 70) return { label: "Hipoglicemia", color: "text-indigo-600 bg-indigo-50 border-indigo-100" };
      if (val < 140) return { label: "Normal Pós-Refeição", color: "text-emerald-600 bg-emerald-50 border-emerald-100" };
      if (val < 200) return { label: "Glicemia pós-prandial elevada", color: "text-amber-600 bg-amber-50 border-amber-100" };
      return { label: "Pico de Hiperglicemia", color: "text-red-600 bg-red-50 border-red-100" };
    }
  };

  const bpClass = getBPClassification(systolic, diastolic);
  const glClass = getGlucoseClassification(glucoseVal, mealState);

  if (!isOpen || !reading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden animate-slideUp">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-xl ${type === 'pressure' ? 'bg-teal-50 text-teal-600' : 'bg-amber-50 text-amber-500'}`}>
              {type === 'pressure' ? <Heart className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Editar Registro do Prontuário</h3>
              <p className="text-[10px] text-slate-400">Corrige medições salvas incorretamente</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 px-1.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto max-h-[72vh] space-y-4">
          
          {type === 'pressure' ? (
            <div className="space-y-4 animate-fadeIn">
              <div className={`p-3 rounded-xl border text-xs text-center font-medium ${bpClass.color} transition-all duration-250`}>
                Diagnóstico: {bpClass.label}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                    <span>Sistólica</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={systolic}
                      onChange={(e) => setSystolic(Number(e.target.value))}
                      className="w-full text-center text-base font-bold px-3 py-2 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none"
                    />
                    <span className="absolute bottom-1 right-2 text-[8px] text-slate-400 font-mono">sys</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                    <span>Diastólica</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={diastolic}
                      onChange={(e) => setDiastolic(Number(e.target.value))}
                      className="w-full text-center text-base font-bold px-3 py-2 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none"
                    />
                    <span className="absolute bottom-1 right-2 text-[8px] text-slate-400 font-mono">dia</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                    <span>Pulso</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={pulse}
                      onChange={(e) => setPulse(Number(e.target.value))}
                      className="w-full text-center text-base font-bold px-3 py-2 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none"
                    />
                    <span className="absolute bottom-1 right-2 text-[8px] text-slate-400 font-mono">bpm</span>
                  </div>
                </div>
              </div>

              {/* Slider simulation */}
              <div className="space-y-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Variação Rápida</span>
                <input
                  type="range"
                  min="90"
                  max="190"
                  value={systolic}
                  onChange={(e) => {
                    const sys = Number(e.target.value);
                    setSystolic(sys);
                    setDiastolic(Math.round(sys * 0.65));
                  }}
                  className="w-full accent-teal-600"
                />
              </div>

              {/* Tags */}
              <div>
                <span className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center space-x-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tags de Contexto</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {bpPresetTags.map((tag) => {
                    const isSelected = tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`text-[10px] px-2.5 py-1 rounded-full border transition ${
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
          ) : type === 'glucose' ? (
            <div className="space-y-4 animate-fadeIn">
              <div className={`p-3 rounded-xl border text-xs text-center font-medium ${glClass.color} transition-all duration-250`}>
                Diagnóstico: {glClass.label}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Glicemia (Valor)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={glucoseVal}
                      onChange={(e) => setGlucoseVal(Number(e.target.value))}
                      className="w-full font-bold text-base px-3 py-2 border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
                    />
                    <span className="absolute bottom-2 right-3 text-[10px] font-bold text-slate-400 font-mono">mg/dL</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Estado</label>
                  <select
                    value={mealState}
                    onChange={(e) => setMealState(e.target.value as any)}
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 bg-white rounded-xl focus:border-amber-500 focus:outline-none"
                  >
                    <option value="jejum">Fasting / Em Jejum</option>
                    <option value="pre_prandial">Antes de comer</option>
                    <option value="pos_prandial">Após comer (2h pós)</option>
                    <option value="antes_de_dormir">Antes de dormir</option>
                    <option value="outro">Geral / Outro</option>
                  </select>
                </div>
              </div>

              {/* Slider glucose */}
              <div className="space-y-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Variação Rápida</span>
                <input
                  type="range"
                  min="50"
                  max="240"
                  value={glucoseVal}
                  onChange={(e) => setGlucoseVal(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* Preset tags glucose */}
              <div>
                <span className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center space-x-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Marcadores</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {glPresetTags.map((tag) => {
                    const isSelected = tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`text-[10px] px-2.5 py-1 rounded-full border transition ${
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
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 rounded-xl border text-xs text-center font-medium text-indigo-700 bg-indigo-50 border-indigo-100 transition-all duration-250">
                Registro de Peso
              </div>

              <div className="flex flex-col items-center">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center space-x-1">
                  <Scale className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Peso (kg)</span>
                </label>
                <div className="relative w-3/4 sm:w-1/2">
                  <input
                    type="number"
                    step="0.1"
                    value={weightVal}
                    onChange={(e) => setWeightVal(Number(e.target.value))}
                    className="w-full text-center font-black text-2xl sm:text-3xl text-indigo-700 bg-white border border-indigo-100 rounded-xl px-4 py-3 sm:py-4 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 focus:outline-none transition-all shadow-sm"
                  />
                  <span className="absolute bottom-2 sm:bottom-3 right-3 sm:right-4 text-[10px] sm:text-xs font-semibold text-indigo-400">kg</span>
                </div>
                
                <div className="w-full mt-6 space-y-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block text-center">Variação Rápida</span>
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
          )}

          {/* Add custom tag */}
          <div className="pt-2 border-t border-slate-50 space-y-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                <span>Customizar Marcadores (Tags)</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder="Nova tag..."
                  className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTag())}
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="px-3 py-1.5 bg-slate-150 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  Incluir
                </button>
              </div>
              
              {/* Active list of customized tags for easy clear deletion */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((tg) => (
                    <span 
                      key={tg}
                      onClick={() => toggleTag(tg)} 
                      className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-100/80 border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 cursor-pointer flex items-center gap-1 transition"
                      title="Clique para remover"
                    >
                      #{tg} <X className="w-2.5 h-2.5 mt-[1px]" />
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* DateTime editor */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Data da Medição</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Hora</span>
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="pt-2">
              <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center space-x-1">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>Sintomas & Observações Clínicas</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none"
                placeholder="Exemplo: Cansaço leve, após caminhada..."
              />
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition cursor-pointer"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            className={`px-5 py-2 text-xs font-bold text-white shadow-sm hover:shadow flex items-center space-x-1 rounded-xl transition cursor-pointer ${
              type === 'pressure' ? 'bg-teal-600 hover:bg-teal-700' : type === 'glucose' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar Alterações</span>
          </button>
        </div>

      </div>
    </div>
  );
}
