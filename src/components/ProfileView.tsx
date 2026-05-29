import React, { useState } from "react";
import { User, Scale, Calendar, FileText, Sparkles, Check, Calculator, AlertCircle, Heart, Target } from "lucide-react";
import { UserProfile } from "../types";

interface ProfileViewProps {
  profile: UserProfile;
  onSave: (updated: UserProfile) => void;
}

export default function ProfileView({ profile, onSave }: ProfileViewProps) {
  // Local edit states
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name || "");
  const [birthDate, setBirthDate] = useState(profile.birthDate || "");
  const [additionalInfo, setAdditionalInfo] = useState(profile.additionalInfo || "");
  const [height, setHeight] = useState(profile.height || 0);
  const [weight, setWeight] = useState(profile.weight || 0);
  const [targetWeight, setTargetWeight] = useState<number | "">(profile.targetWeight ?? "");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state cleanly if parent profile prop updates (e.g., when a user logs in or registers)
  React.useEffect(() => {
    setName(profile.name || "");
    setBirthDate(profile.birthDate || "");
    setAdditionalInfo(profile.additionalInfo || "");
    setHeight(profile.height || 0);
    setWeight(profile.weight || 0);
    setTargetWeight(profile.targetWeight ?? "");
  }, [profile]);

  // Derive age
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

  // Derive IMC (BMI) & Ideal weight margin
  const heightInMeters = height / 100;
  const imc = heightInMeters > 0 ? (weight / (heightInMeters * heightInMeters)) : 0;
  
  // Ideal margin based on BMI between 18.5 and 24.9
  const minIdealWeight = heightInMeters > 0 ? (18.5 * (heightInMeters * heightInMeters)) : 0;
  const maxIdealWeight = heightInMeters > 0 ? (24.9 * (heightInMeters * heightInMeters)) : 0;

  // Get IMC details (category, descriptive color, advisory note)
  const getImcInfo = (val: number) => {
    if (val <= 0) return { category: "Inválido", color: "text-slate-400 bg-slate-50 border-slate-100", label: "Insira peso e altura." };
    if (val < 18.5) {
      return {
        category: "Abaixo do Peso",
        color: "text-amber-700 bg-amber-50 border-amber-200",
        badge: "bg-amber-100 text-amber-800",
        advice: "Sua massa está abaixo do recomendado. Considere avaliação profissional para acompanhamento nutricional ideal."
      };
    } else if (val >= 18.5 && val < 25) {
      return {
        category: "Peso Saudável",
        color: "text-emerald-700 bg-emerald-50 border-emerald-200",
        badge: "bg-emerald-100 text-emerald-800",
        advice: "Excelente! Você está na faixa ideal recomendada pela Organização Mundial da Saúde (OMS). Continue cuidando da alimentação e hábitos."
      };
    } else if (val >= 25 && val < 30) {
      return {
        category: "Sobrepeso (Pré-obesidade)",
        color: "text-orange-700 bg-orange-50 border-orange-200",
        badge: "bg-orange-100 text-orange-800",
        advice: "Você está um pouco acima do peso ideal. Dedicar-se a atividades preventivas e ajustes alimentares pode auxiliar no controle."
      };
    } else {
      return {
        category: "Obesidade",
        color: "text-rose-700 bg-rose-50 border-rose-200",
        badge: "bg-rose-100 text-rose-800",
        advice: "Seu IMC indica obesidade. O controle sistemático da pressão arterial e glicemia é fundamental. Sugere-se orientação médica direta."
      };
    }
  };

  const imcInfo = getImcInfo(imc);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name,
      birthDate,
      additionalInfo,
      height: Number(height),
      weight: Number(weight),
      targetWeight: targetWeight ? Number(targetWeight) : undefined
    });
    
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div id="profile-view-section" className="space-y-3 sm:space-y-4 animate-fadeIn">
      {/* Visual Banner Header */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-indigo-700 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 text-white relative overflow-hidden shadow-md">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none select-none flex items-center justify-end pr-10">
          <User className="w-56 h-56 shrink-0" />
        </div>
        
        <div className="relative z-10 space-y-2.5 sm:space-y-4">
          <div className="inline-flex items-center space-x-2 bg-white/10 px-2.5 py-1 rounded-full text-[9px] sm:text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-amber-300 animate-pulse" />
            <span>Área Médica Preventiva</span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight profile-name-text">{profile.name}</h2>
              <p className="text-white/80 text-[10px] sm:text-xs md:text-sm font-medium flex items-center gap-1.5 profile-birth-text">
                <Calendar className="w-3.5 h-3.5 text-teal-200" />
                Nasceu em {profile.birthDate ? profile.birthDate.split('-').reverse().join('/') : ''} ({age} anos)
              </p>
            </div>
            
            <button
              onClick={() => {
                setName(profile.name || "");
                setBirthDate(profile.birthDate || "");
                setAdditionalInfo(profile.additionalInfo || "");
                setHeight(profile.height || 0);
                setWeight(profile.weight || 0);
                setTargetWeight(profile.targetWeight ?? "");
                setIsEditing(!isEditing);
              }}
              className="bg-white text-teal-950 hover:bg-teal-50 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-[10px] sm:text-xs md:text-sm transition shadow-md select-none transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0 self-start sm:self-auto"
            >
              {isEditing ? "Cancelar Ajustes" : "Editar meus Dados"}
            </button>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center space-x-2.5 text-[10px] sm:text-xs md:text-sm animate-fadeIn">
          <Check className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-650 shrink-0" />
          <span className="font-bold">Seu perfil foi salvo com sucesso nos dados locais do dispositivo!</span>
        </div>
      )}

      {/* Profile Cards/Form Container */}
      <div className="space-y-3 sm:space-y-4">
        
        {/* Form is placed sequentially ABOVE the cards when editing, satisfying the requested clinical sequence */}
        {isEditing && (
          <form onSubmit={handleFormSubmit} className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-100 p-4 sm:p-6 space-y-3.5 sm:space-y-5 animate-slideUp max-w-4xl mx-auto w-full">
            <div className="pb-2.5 sm:pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-800 text-sm sm:text-base flex items-center space-x-2">
                <span className="w-2 h-5 sm:w-2.5 sm:h-6 bg-teal-600 rounded-sm"></span>
                <span>Editar Dados Clínicos</span>
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Preencha os campos abaixo de maneira precisa para atualizar o seu perfil e calcular o seu IMC.</p>
            </div>

            <div className="space-y-3 sm:space-y-4 font-sans text-slate-800">
              {/* Name Field */}
              <div>
                <label className="block text-[9.5px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nome Completo</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full text-xs pl-9 pr-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-slate-850 bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Grid with Birth Date, Height, Weight & Target Weight */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 sm:gap-4">
                
                {/* Birth Date */}
                <div>
                  <label className="block text-[9.5px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Data de Nascimento</label>
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full text-xs px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-slate-850 bg-slate-50/50"
                  />
                </div>

                {/* Height (cm) */}
                <div>
                  <label className="block text-[9.5px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Altura (cm)</span>
                    <span className="text-[9.5px] sm:text-[10px] text-teal-600 font-mono font-bold">{(height/100).toFixed(2)}m</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="50"
                    max="280"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    placeholder="Ex: 175"
                    className="w-full text-xs px-2.5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-slate-850 bg-slate-50/50 font-mono"
                  />
                </div>

                {/* Weight (kg) */}
                <div>
                  <label className="block text-[9.5px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    min="10"
                    max="400"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    placeholder="Ex: 75.4"
                    className="w-full text-xs px-2.5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-slate-850 bg-slate-50/50 font-mono"
                  />
                </div>

                {/* Target Weight (kg) */}
                <div>
                  <label className="block text-[9.5px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 text-teal-700">Meta Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="10"
                    max="400"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Opcional"
                    className="w-full text-xs px-2.5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-teal-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-teal-800 bg-teal-50/30 font-mono"
                  />
                </div>

              </div>

              {/* Bio/Additional Info */}
              <div>
                <label className="block text-[9.5px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Anotações ou Alergias Clinicas relevante</label>
                <textarea
                  rows={3}
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="Insira detalhes sobre diagnósticos, uso de medicações contínuas, orientações médicas gerais ou hábitos preventivos que gostaria de persistir neste painel."
                  className="w-full text-xs p-2 sm:p-3 rounded-lg sm:rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-slate-850 bg-slate-50/50 resize-none leading-relaxed"
                />
              </div>

            </div>

            {/* Action buttons */}
            <div className="flex gap-2.5 pt-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-1/2 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg sm:rounded-xl transition text-center select-none cursor-pointer"
              >
                Voltar
              </button>
              
              <button
                type="submit"
                className="w-1/2 py-2 sm:py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg sm:rounded-xl shadow-md shadow-teal-600/10 transition text-center select-none cursor-pointer"
              >
                Salvar Histórico
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          
          {/* Card 1: Clinical Body Stats */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 p-3 sm:p-4 space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center space-x-1.5 sm:space-x-2">
                <Scale className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-teal-600 animate-pulse" />
                <span>Medidas Corporais</span>
              </h3>
              <span className="text-[8px] sm:text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 sm:px-2 py-0.5 rounded-full">Atualizado</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
              <div className="bg-slate-50 p-2 sm:p-3.5 rounded-lg sm:rounded-xl border border-slate-100 text-center">
                <span className="block text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">Altura</span>
                <span className="block font-black text-slate-800 text-sm sm:text-lg mt-0.5">{(profile.height / 100).toFixed(2).replace('.', ',')} <span className="text-[8px] sm:text-[10px] font-bold text-slate-400">m</span></span>
                <span className="text-[8px] sm:text-[9px] text-slate-400 font-mono mt-0.5 block">{profile.height} cm</span>
              </div>

              <div className="bg-slate-50 p-2 sm:p-3.5 rounded-lg sm:rounded-xl border border-slate-100 text-center relative">
                <span className="block text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">Peso Atual</span>
                <span className="block font-black text-slate-800 text-sm sm:text-lg mt-0.5">{profile.weight.toFixed(1).replace('.', ',')} <span className="text-[8px] sm:text-[10px] font-bold text-slate-400">kg</span></span>
                {profile.targetWeight ? (
                  <span className="text-[8px] sm:text-[9px] text-teal-600 font-mono mt-0.5 block font-bold">Meta: {profile.targetWeight.toFixed(1).replace('.', ',')}</span>
                ) : (
                  <span className="text-[8px] sm:text-[9px] text-slate-400 font-mono mt-0.5 block">Kilos (kg)</span>
                )}
              </div>
            </div>

            {/* Target Weight Progress Bar */}
            {profile.targetWeight !== undefined && profile.targetWeight > 0 && (
              <div className="bg-slate-50 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-slate-100">
                <div className="flex justify-between items-center mb-1 sm:mb-1.5">
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Target className="w-3 h-3 text-teal-600"/> Progresso da Meta</span>
                  <span className="text-[9px] sm:text-[10px] font-mono text-slate-600 font-bold">{Math.abs(profile.weight - profile.targetWeight).toFixed(1).replace('.', ',')} kg {profile.weight > profile.targetWeight ? "a perder" : "a ganhar"}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 sm:h-2 overflow-hidden relative">
                  {/* Visual calculation to demonstrate progress (from an assumed starting point if we had one, but we interpolate based on current and target using a dummy delta representation, or just a simple style) */}
                  <div className="bg-teal-500 h-1.5 sm:h-2 rounded-full absolute left-0 top-0 transition-all duration-1000" style={{ width: "65%" }}></div>
                </div>
              </div>
            )}

            <div className="bg-teal-50/40 p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-teal-100/60 text-center">
              <span className="text-[8px] sm:text-[10px] text-slate-400 block font-bold uppercase">Idade Estimada</span>
              <span className="text-base sm:text-xl font-bold text-teal-950 block">{age} anos</span>
            </div>
          </div>

          {/* Card 2: Automatic IMC Calculation */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 p-3 sm:p-4 space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center space-x-1.5 sm:space-x-2">
                <Calculator className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-indigo-500" />
                <span>Calculadora de IMC</span>
              </h3>
              <span className={`text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 rounded-full font-black uppercase ${imcInfo.badge}`}>
                {imcInfo.category}
              </span>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-slate-50 border-2 sm:border-4 border-indigo-100 flex flex-col items-center justify-center shrink-0">
                <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">ÍNDICE</span>
                <span className="text-sm sm:text-lg font-black text-indigo-900 mt-0.5 sm:mt-1">{imc.toFixed(2).replace('.', ',')}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase">Faixa Recomendada</span>
                <span className="block font-bold text-slate-700 text-[10px] sm:text-xs">IMC: 18,50 a 24,90</span>
                <p className="text-[8.5px] sm:text-[10px] text-slate-400 leading-snug">Avalia proporção saudável de peso/altura.</p>
              </div>
            </div>

            {/* Ideal Margin Calculation */}
            <div className="bg-gradient-to-br from-indigo-50 to-teal-50/50 p-2.5 sm:p-4 rounded-lg sm:rounded-xl border border-indigo-100/50 space-y-1 sm:space-y-2">
              <span className="block text-[8px] sm:text-[10px] text-indigo-900 font-black uppercase tracking-wider">Peso Ideal recomendado:</span>
              <p className="text-[10px] sm:text-xs text-slate-700 leading-normal font-medium">
                Com base na altura de <span className="font-bold text-teal-800 font-mono">{(profile.height / 100).toFixed(2).replace('.', ',')}m</span>, seria:
              </p>
              <div className="flex items-center justify-between font-mono font-bold text-[10px] sm:text-xs pt-1 border-t border-indigo-100/50">
                <span className="text-slate-600">{minIdealWeight.toFixed(1).replace('.', ',')} kg</span>
                <span className="text-emerald-700 font-normal">até</span>
                <span className="text-slate-600">{maxIdealWeight.toFixed(1).replace('.', ',')} kg</span>
              </div>
            </div>
          </div>

          {/* Card 3: Additional details / Bio */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 p-3 sm:p-4 space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center space-x-1.5 sm:space-x-2">
                <FileText className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-teal-600" />
                <span>Observações do Histórico</span>
              </h3>
            </div>

            <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed bg-slate-50/50 border border-slate-100 p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl italic">
              &ldquo;{profile.additionalInfo || "Nenhuma observação ou histórico adicional cadastrado anteriormente."}&rdquo;
            </p>

            <div className="flex items-start gap-1.5 text-[8.5px] sm:text-[10px] text-slate-400 leading-normal pt-1">
              <AlertCircle className="w-3.5 h-3.5 text-teal-600 mt-0.5 shrink-0" />
              <span>Estas informações são salvas de maneira pontual e segura no navegador, garantindo total privacidade sobre seu prontuário clínico.</span>
            </div>
          </div>

        </div>

      {/* Advisory Clinical Box */}
      <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-slate-150 flex items-start gap-2 sm:gap-3 text-[11px] sm:text-xs leading-normal">
        <Heart className="w-4 sm:w-5 h-4 sm:h-5 text-teal-600 shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-1">
          <span className="font-extrabold text-slate-800 text-xs block">Importância das Métricas Clínicas Ajustadas</span>
          <p className="text-slate-500">
            A sua taxa metabólica, IMC ideal e classificação cardíaca dependem diretamente da calibração exata das variáveis de idade, altura e massa. Mantenha estes parâmetros atualizados no perfil para a interpretação correto dos alertas preventivos do diário.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
