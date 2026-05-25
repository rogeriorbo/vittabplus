import { useState, useEffect } from "react";
import { Bell, Plus, Trash2, Calendar, Clock, AlertCircle, Sparkles, Check, Pencil } from "lucide-react";
import { HabitAlert } from "../types";

interface AlertManagerProps {
  alerts: HabitAlert[];
  onAddAlert: (alert: Omit<HabitAlert, 'id'>) => void;
  onUpdateAlert: (alert: HabitAlert) => void;
  onToggleAlert: (id: string) => void;
  onDeleteAlert: (id: string) => void;
  onTriggerAlarmMock: (alert: HabitAlert) => void; // Simulated trigger handler for high fidelity
}

export default function AlertManager({
  alerts,
  onAddAlert,
  onUpdateAlert,
  onToggleAlert,
  onDeleteAlert,
  onTriggerAlarmMock
}: AlertManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [time, setTime] = useState("07:00");
  const [label, setLabel] = useState("");
  const [type, setType] = useState<HabitAlert['type']>('both');
  const [sound, setSound] = useState<HabitAlert['sound']>('beep'); // Sound selector state
  const [selectedDays, setSelectedDays] = useState<string[]>(['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']);
  
  const weekdays = [
    { key: 'seg', label: 'S' },
    { key: 'ter', label: 'T' },
    { key: 'qua', label: 'Q' },
    { key: 'qui', label: 'Q' },
    { key: 'sex', label: 'S' },
    { key: 'sab', label: 'S' },
    { key: 'dom', label: 'D' }
  ];

  const presets = [
    { label: "Glicose em Jejum", time: "07:00", type: "glucose" as const, sound: "beep" as const },
    { label: "Pressão Matinal", time: "08:00", type: "pressure" as const, sound: "chime" as const },
    { label: "Glicose Pós-Almoço", time: "14:00", type: "glucose" as const, sound: "beep" as const },
    { label: "Medição de Rotina da Noite", time: "21:00", type: "both" as const, sound: "ding" as const }
  ];

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSaveOrAdd = () => {
    if (!label.trim()) return;
    if (editingId) {
      onUpdateAlert({
        id: editingId,
        time,
        label: label.trim(),
        type,
        active: true,
        days: selectedDays,
        sound
      });
      setEditingId(null);
    } else {
      onAddAlert({
        time,
        label: label.trim(),
        type,
        active: true,
        days: selectedDays,
        sound
      });
    }
    setLabel("");
    setIsAdding(false);
  };

  const handleApplyPreset = (p: typeof presets[number]) => {
    setLabel(p.label);
    setTime(p.time);
    setType(p.type);
    setSound(p.sound);
  };

  // Live Timer to detect and match scheduled habit alarms
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const currentHoursMin = now.toLocaleTimeString('pt-BR', { hour12: false }).substring(0, 5); // "HH:MM"
      
      // Get short weekday code (e.g. "seg", "ter")
      const daysMap = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
      const currentDayCode = daysMap[now.getDay()];

      // Try matching active alarms that match exact minute
      alerts.forEach(alert => {
        if (alert.active && alert.time === currentHoursMin && alert.days.includes(currentDayCode)) {
          // To prevent repeating triggering multiple times in the same minute, we track last triggered minute in session storage
          const sessionKey = `smartbp_triggered_${alert.id}_${currentHoursMin}`;
          if (!sessionStorage.getItem(sessionKey)) {
            sessionStorage.setItem(sessionKey, "true");
            onTriggerAlarmMock(alert);
          }
        }
      });
    };

    // Check every 10 seconds
    const interval = setInterval(checkAlarms, 10000);
    return () => clearInterval(interval);
  }, [alerts, onTriggerAlarmMock]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm md:text-base">Estratégias de Hábito (Alertas)</h3>
            <p className="text-xs text-slate-500">Nunca perca uma medição clínica vital</p>
          </div>
        </div>

        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingId(null);
            setLabel("");
            setTime("07:00");
          }}
          className="flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAdding ? "Fechar" : "Novo Alerta"}</span>
        </button>
      </div>

      {isAdding && (
        <div className="bg-rose-50/40 border border-rose-100 rounded-xl p-4 mb-4 space-y-3.5 animate-fadeIn">
          <h4 className="text-xs font-bold text-rose-800 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Configurar Alerta Personalizado</span>
          </h4>

          {/* Presets suggestions */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-rose-700/70 block">Sugestões Rápidas:</span>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleApplyPreset(p)}
                  className="bg-white hover:bg-rose-50 text-[10px] text-slate-700 border border-rose-200/50 px-2 py-0.5 rounded-md transition cursor-pointer"
                >
                  {p.label} ({p.time})
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Título / Hábito *</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex: Pressão após levantar"
                className="w-full text-xs px-3 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-rose-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Hora do Alerta *</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Tipo de Diário relacionado</label>
              <div className="flex items-center space-x-1 border border-slate-200 bg-white rounded-lg p-1.5">
                <button
                  onClick={() => setType('pressure')}
                  className={`flex-1 text-[10px] py-1 rounded font-medium ${type === 'pressure' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  Pressão
                </button>
                <button
                  onClick={() => setType('glucose')}
                  className={`flex-1 text-[10px] py-1 rounded font-medium ${type === 'glucose' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  Glicose
                </button>
                <button
                  onClick={() => setType('both')}
                  className={`flex-1 text-[10px] py-1 rounded font-medium ${type === 'both' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  Ambos
                </button>
              </div>
            </div>

            {/* Repeat Days Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Repetir Dias</label>
              <div className="flex justify-between bg-white border border-slate-200 rounded-lg p-1">
                {weekdays.map((day) => {
                  const isActive = selectedDays.includes(day.key);
                  return (
                    <button
                      key={day.key}
                      onClick={() => toggleDay(day.key)}
                      className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition ${
                        isActive ? "bg-rose-500 text-white" : "text-slate-400 hover:bg-slate-100"
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sound Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Som do Alerta</label>
              <select
                value={sound}
                onChange={(e) => setSound(e.target.value as any)}
                className="w-full text-xs px-3 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
              >
                <option value="beep">Bip (Padrão)</option>
                <option value="chime">Sino</option>
                <option value="ding">Din</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSaveOrAdd}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs py-2 rounded-xl font-semibold transition shadow-sm cursor-pointer"
          >
            {editingId ? "Alterar Lembrete" : "Adicionar a Rotina"}
          </button>
        </div>
      )}

      {/* List of active alerts */}
      <div className="space-y-2.5">
        {alerts.length === 0 ? (
          <div className="text-center py-7 text-slate-400 text-xs flex flex-col items-center justify-center space-y-1">
            <AlertCircle className="w-5 h-5 text-slate-300" />
            <span className="font-medium text-slate-500">Nenhum hábito de medição ativo</span>
            <span className="text-[10px] text-slate-400">Adicione um alerta acima para começar a criar rotina!</span>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center justify-between border rounded-xl p-3.5 transition-all ${
                alert.active 
                  ? "bg-rose-50/20 border-rose-100" 
                  : "bg-slate-50/40 border-slate-100 opacity-65"
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  alert.type === 'pressure'
                    ? "bg-teal-50 text-teal-600"
                    : alert.type === 'glucose'
                      ? "bg-amber-50 text-amber-600"
                      : "bg-indigo-50 text-indigo-600"
                }`}>
                  {alert.time}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700">{alert.label}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">
                      {alert.type === 'pressure' ? 'PA' : alert.type === 'glucose' ? 'Glicose' : 'Pressão + Glicose'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {alert.days.length === 7 ? "Todo dia" : alert.days.join(", ")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                {/* Simulated trigger test */}
                <button
                  onClick={() => onTriggerAlarmMock(alert)}
                  className="text-[10px] font-semibold text-rose-600 hover:underline px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 transition"
                  title="Simular teste de trigger imediatamente"
                >
                  Testar
                </button>

                {/* Editar Alerta */}
                <button
                  onClick={() => {
                    setEditingId(alert.id);
                    setLabel(alert.label);
                    setTime(alert.time);
                    setType(alert.type);
                    setSound(alert.sound || 'beep');
                    setSelectedDays(alert.days);
                    setIsAdding(true);
                  }}
                  className="p-1 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
                  title="Editar alerta"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alert.active}
                    onChange={() => onToggleAlert(alert.id)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-rose-600"></div>
                </label>

                <button
                  onClick={() => onDeleteAlert(alert.id)}
                  className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
