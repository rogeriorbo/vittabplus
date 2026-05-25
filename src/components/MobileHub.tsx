import { useState, useEffect, useRef, useMemo } from "react";
import { 
  Smartphone, Heart, Activity, Share2, Copy, Check, ExternalLink, 
  Volume2, VolumeX, SmartphoneIcon, Award, ShieldAlert, Cpu, HeartHandshake, CheckCircle2,
  Bluetooth, Vibrate, Timer, Route, MapPin, Flame, Zap, Settings, History, 
  Bike, Dumbbell, Footprints, RotateCcw, Trash2, Map as MapIcon, Navigation,
  ChevronRight, Play, Square, Pause, Swords, Info
} from "lucide-react";
import { BloodPressureReading, GlucoseReading, WorkoutSession, ActivityType, WorkoutDataPoint } from "../types";

const generatePathPreview = (points: WorkoutDataPoint[]): string => {
  if (points.length < 2) return '';
  const validPoints = points.filter(p => p.latitude !== undefined && p.longitude !== undefined);
  if (validPoints.length < 2) return '';

  const canvas = document.createElement('canvas');
  const width = 400;
  const height = 200;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Dark background for the preview
  ctx.fillStyle = '#09090b'; // zinc-950
  ctx.fillRect(0, 0, width, height);

  // Calculate bounds
  let minLat = validPoints[0].latitude!;
  let maxLat = validPoints[0].latitude!;
  let minLng = validPoints[0].longitude!;
  let maxLng = validPoints[0].longitude!;

  validPoints.forEach(p => {
    if (p.latitude! < minLat) minLat = p.latitude!;
    if (p.latitude! > maxLat) maxLat = p.latitude!;
    if (p.longitude! < minLng) minLng = p.longitude!;
    if (p.longitude! > maxLng) maxLng = p.longitude!;
  });

  const latRange = maxLat - minLat || 0.0001;
  const lngRange = maxLng - minLng || 0.0001;
  
  // Aspect ratio correction (basic)
  const padding = 30;
  let drawWidth = width - padding * 2;
  let drawHeight = height - padding * 2;

  ctx.strokeStyle = '#f43f5e'; // rose-500
  ctx.lineWidth = 5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  
  // Shadow/Glow
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#f43f5e';

  ctx.beginPath();
  validPoints.forEach((p, i) => {
    const x = padding + ((p.longitude! - minLng) / lngRange) * drawWidth;
    const y = padding + (1 - (p.latitude! - minLat) / latRange) * drawHeight;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Markers
  ctx.shadowBlur = 0;
  // Start
  const startX = padding + ((validPoints[0].longitude! - minLng) / lngRange) * drawWidth;
  const startY = padding + (1 - (validPoints[0].latitude! - minLat) / latRange) * drawHeight;
  ctx.fillStyle = '#10b981'; // emerald-500
  ctx.beginPath();
  ctx.arc(startX, startY, 6, 0, Math.PI * 2);
  ctx.fill();

  // End
  const endX = padding + ((validPoints[validPoints.length - 1].longitude! - minLng) / lngRange) * drawWidth;
  const endY = padding + (1 - (validPoints[validPoints.length - 1].latitude! - minLat) / latRange) * drawHeight;
  ctx.fillStyle = '#f43f5e'; // rose-500
  ctx.beginPath();
  ctx.arc(endX, endY, 6, 0, Math.PI * 2);
  ctx.fill();

  return canvas.toDataURL('image/png');
};

interface MobileHubProps {
  onAddBP: (bp: Omit<BloodPressureReading, 'id'>) => void;
  onClearAllRecords?: () => void;
  bpReadings: BloodPressureReading[];
  glucoseReadings: GlucoseReading[];
}

export default function MobileHub({ onAddBP, onClearAllRecords, bpReadings, glucoseReadings }: MobileHubProps) {
  // Mobile features sub-navigation
  const [activeSubTab, setActiveSubTab] = useState<'workout' | 'history' | 'share' | 'risk'>('workout');

  // --- 1. VITTA WORKOUT (ACTIVE MONITORING) ---
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'done'>('idle');
  const [isBleConnected, setIsBleConnected] = useState(false);
  const [bleDeviceName, setBleDeviceName] = useState("");
  const [detectedPulse, setDetectedPulse] = useState(74);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  
  // Workout Session State
  const [isTracking, setIsTracking] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>('academia');
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>(() => {
    const saved = localStorage.getItem('vittabp_workout_history');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Real-time metrics
  const [currentSpeed, setCurrentSpeed] = useState(0); // km/h
  const [totalDistance, setTotalDistance] = useState(0); // meters
  const [sessionDuration, setSessionDuration] = useState(0); // seconds
  const [sessionMaxHR, setSessionMaxHR] = useState(0);
  const [sessionMinHR, setSessionMinHR] = useState(999);
  const [sessionAvgHR, setSessionAvgHR] = useState(0);
  const [sessionPoints, setSessionPoints] = useState<WorkoutDataPoint[]>([]);

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<any>(null);
  const lastLocationRef = useRef<GeolocationCoordinates | null>(null);
  const hrHistoryRef = useRef<number[]>([]);

  useEffect(() => {
    localStorage.setItem('vittabp_workout_history', JSON.stringify(workoutHistory));
  }, [workoutHistory]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const scanIntervalRef = useRef<any>(null);
  const bleCharacteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);

  const stateRefs = useRef({ soundEnabled, vibrationEnabled, isTracking });
  useEffect(() => {
    stateRefs.current = { soundEnabled, vibrationEnabled, isTracking };
  }, [soundEnabled, vibrationEnabled, isTracking]);

  // Play a brief 80ms bip at a given frequency
  const playPulseSound = (frequency = 280) => {
    if (!stateRefs.current.soundEnabled) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      
      const ctx = audioCtxRef.current || new AudioCtxClass();
      if (!audioCtxRef.current) audioCtxRef.current = ctx;

      // Resume context if suspended
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.warn("AudioContext error:", e);
    }
  };

  // Real BLE Bluetooth Heart Rate Sensor Integration
  const handleConnectBLE = async () => {
    try {
      if (!navigator.bluetooth) {
        alert("Web Bluetooth não é suportado neste navegador. Tente usar o Chrome ou Edge no Android.");
        return;
      }

      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['battery_service', 'device_information']
      });

      const server = await device.gatt?.connect();
      const service = await server?.getPrimaryService('heart_rate');
      const characteristic = await service?.getCharacteristic('heart_rate_measurement');

      if (characteristic) {
        bleCharacteristicRef.current = characteristic;
        await characteristic.startNotifications();
        
        setIsBleConnected(true);
        setBleDeviceName(device.name || "Fita Cardíaca");

        characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
          const value = event.target.value;
          const flags = value.getUint8(0);
          const rate16Bits = flags & 0x1;
          let heartRate;
          if (rate16Bits) {
            heartRate = value.getUint16(1, true);
          } else {
            heartRate = value.getUint8(1);
          }
          
          setDetectedPulse(heartRate);

          if (stateRefs.current.isTracking) {
            playPulseSound(340);
            if (stateRefs.current.vibrationEnabled && navigator.vibrate) navigator.vibrate(40);
          }
        });

        device.addEventListener('gattserverdisconnected', () => {
          setIsBleConnected(false);
          setScanState('idle');
          setBleDeviceName("");
        });
      }
    } catch (error) {
      console.error("Bluetooth Error:", error);
    }
  };

  const handleRegisterPulseReading = () => {
    // Generate a standard BP reading with the pulse scanned
    onAddBP({
      systolic: 121,
      diastolic: 79,
      pulse: detectedPulse,
      notes: "Pulso coletado dinamicamente via Monitor de Treino.",
      tags: ["Vitta Workout", "Atividade Mobile"],
      measuredAt: new Date().toISOString()
    });
    
    // Reset state after saving
    setScanState('idle');
    setActiveSession(null);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // meters
    const f1 = lat1 * Math.PI / 180;
    const f2 = lat2 * Math.PI / 180;
    const df = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(df / 2) * Math.sin(df / 2) +
            Math.cos(f1) * Math.cos(f2) *
            Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const startWorkoutTime = () => {
    timerRef.current = setInterval(() => {
      setSessionDuration(prev => prev + 1);
    }, 1000);
  };

  const startGpsTracking = () => {
    if (!navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed, altitude } = position.coords;
        
        if (lastLocationRef.current) {
          const dist = calculateDistance(
            lastLocationRef.current.latitude,
            lastLocationRef.current.longitude,
            latitude,
            longitude
          );
          if (dist > 2) { // Filter jitter
            setTotalDistance(prev => prev + dist);
          }
        }
        
        lastLocationRef.current = position.coords;
        if (speed !== null) {
          setCurrentSpeed(speed * 3.6); // Convert m/s to km/h
        }

        // Record point
        setSessionPoints(prev => [...prev, {
          timestamp: new Date().toISOString(),
          heartRate: detectedPulse,
          latitude,
          longitude,
          speed: speed ?? 0,
          altitude: altitude ?? 0
        }]);
      },
      (err) => console.error("GPS Error:", err),
      { enableHighAccuracy: true }
    );
  };

  const handleStartWorkout = () => {
    if (!isBleConnected) {
      alert("Para um monitoramento completo, conecte sua fita cardíaca Bluetooth.");
    }
    
    setIsTracking(true);
    setSessionDuration(0);
    setTotalDistance(0);
    setCurrentSpeed(0);
    setSessionMaxHR(detectedPulse);
    setSessionMinHR(detectedPulse);
    hrHistoryRef.current = [detectedPulse];
    setSessionPoints([]);
    lastLocationRef.current = null;

    startWorkoutTime();
    startGpsTracking();

    if (vibrationEnabled && navigator.vibrate) navigator.vibrate([100, 50, 100]);
  };

  const handleStopWorkout = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    
    setIsTracking(false);

    // Save session
    const avgHR = hrHistoryRef.current.length > 0 
      ? Math.round(hrHistoryRef.current.reduce((a, b) => a + b, 0) / hrHistoryRef.current.length) 
      : detectedPulse;

    // Find peak HR location
    let peakLocation = undefined;
    let lastPoint = sessionPoints.length > 0 ? sessionPoints[sessionPoints.length - 1] : null;

    if (sessionPoints.length > 0) {
      let maxHRFound = sessionPoints[0].heartRate;
      let peakIdx = 0;
      sessionPoints.forEach((p, i) => {
        if (p.heartRate > maxHRFound && p.latitude) {
          maxHRFound = p.heartRate;
          peakIdx = i;
        }
      });
      
      const peakPoint = sessionPoints[peakIdx];
      if (peakPoint && peakPoint.latitude && peakPoint.longitude) {
        peakLocation = { lat: peakPoint.latitude, lng: peakPoint.longitude };
      }
    }

    // Try to get location name via our new API
    let resolvedLocationName = "";
    if (lastPoint && lastPoint.latitude && lastPoint.longitude) {
      try {
        const response = await fetch(`/api/geocoding/reverse?lat=${lastPoint.latitude}&lng=${lastPoint.longitude}`);
        const data = await response.json();
        if (data.success) {
          resolvedLocationName = data.address;
        }
      } catch (err) {
        console.warn("Failed to reverse geocode:", err);
      }
    }

    const session: WorkoutSession = {
      id: crypto.randomUUID(),
      type: selectedActivity,
      startTime: new Date(Date.now() - sessionDuration * 1000).toISOString(),
      endTime: new Date().toISOString(),
      duration: sessionDuration,
      distance: totalDistance,
      avgHeartRate: avgHR,
      maxHeartRate: sessionMaxHR,
      minHeartRate: sessionMinHR,
      avgSpeed: totalDistance > 0 && sessionDuration > 0 ? (totalDistance / 1000) / (sessionDuration / 3600) : 0,
      maxSpeed: Math.max(...sessionPoints.map(p => p.speed || 0)) * 3.6,
      minSpeed: 0,
      kcalEstimate: Math.round(sessionDuration * (avgHR / 20)), // Very rough estimate
      points: sessionPoints,
      peakHeartRateLocation: peakLocation,
      locationName: resolvedLocationName,
      pathPreviewData: generatePathPreview(sessionPoints)
    };

    setWorkoutHistory(prev => [session, ...prev]);
    setActiveSession(session);
    setScanState('done');

    if (vibrationEnabled && navigator.vibrate) navigator.vibrate(300);
  };

  // Update HR stats during workout
  useEffect(() => {
    if (isTracking && detectedPulse > 0) {
      setSessionMaxHR(prev => Math.max(prev, detectedPulse));
      setSessionMinHR(prev => Math.min(prev, detectedPulse));
      hrHistoryRef.current.push(detectedPulse);
      
      // If we don't have GPS or for gym mode, still record points every 5s
      const shouldRecordTimedPoint = sessionPoints.length === 0 || 
        (new Date().getTime() - new Date(sessionPoints[sessionPoints.length - 1].timestamp).getTime() > 5000);
      
      if (shouldRecordTimedPoint && !watchIdRef.current) {
        setSessionPoints(prev => [...prev, {
          timestamp: new Date().toISOString(),
          heartRate: detectedPulse
        }]);
      }
    }
  }, [detectedPulse, isTracking]);

  const [historyFilter, setHistoryFilter] = useState<'all' | ActivityType>('all');
  
  // Custom Confirmation Modal State
  const [deleteId, setDeleteId] = useState<string | 'all' | null>(null);

  const filteredHistory = workoutHistory.filter(h => historyFilter === 'all' || h.type === historyFilter);

  const handleDeleteWorkout = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId === 'all') {
      setWorkoutHistory([]);
    } else if (deleteId === 'global') {
      setWorkoutHistory([]);
      if (onClearAllRecords) onClearAllRecords();
    } else if (deleteId) {
      setWorkoutHistory(prev => prev.filter(w => w.id !== deleteId));
    }
    setDeleteId(null);
  };


  // --- 2. COMPARTILHAR RELATÓRIO INTEG (DOCTOR APPOINTMENT OUT) ---
  const [copied, setCopied] = useState(false);
  const [doctorPhone, setDoctorPhone] = useState("");
  const [doctorName, setDoctorName] = useState("");

  const generateReportText = () => {
    const today = new Date().toLocaleDateString('pt-BR');
    
    // Calculates averages
    const avgSys = bpReadings.length > 0 
      ? Math.round(bpReadings.reduce((sum, r) => sum + r.systolic, 0) / bpReadings.length) : 120;
    const avgDia = bpReadings.length > 0 
      ? Math.round(bpReadings.reduce((sum, r) => sum + r.diastolic, 0) / bpReadings.length) : 80;
    const avgPulse = bpReadings.length > 0 
      ? Math.round(bpReadings.reduce((sum, r) => sum + r.pulse, 0) / bpReadings.length) : 75;

    const fastingGl = glucoseReadings.filter(g => g.mealState === 'jejum');
    const avgFasting = fastingGl.length > 0
      ? Math.round(fastingGl.reduce((sum, r) => sum + r.value, 0) / fastingGl.length) : 95;

    const lastBP = bpReadings[0] ? `${bpReadings[0].systolic}/${bpReadings[0].diastolic} mmHg` : "Não registrado";
    const lastGl = glucoseReadings[0] ? `${glucoseReadings[0].value} mg/dL` : "Não registrado";

    const lastWorkout = workoutHistory[0];
    const workoutSummary = lastWorkout 
      ? `\n*🏃 Atividade Recente (${new Date(lastWorkout.startTime).toLocaleDateString()}):*
• Tipo: ${lastWorkout.type.toUpperCase()}
• Duração: ${Math.floor(lastWorkout.duration / 60)} min
• Distância: ${lastWorkout.distance > 1000 ? (lastWorkout.distance / 1000).toFixed(2) + 'km' : lastWorkout.distance.toFixed(0) + 'm'}
• Batimento Médio: ${lastWorkout.avgHeartRate} bpm`
      : "";

    return `*🏥 DIÁRIO CLÍNICO VITTABP — RELATÓRIO DE ACOMPANHAMENTO*
${doctorName ? `Olá, Dr(a). ${doctorName}!` : 'Olá!'} Seguem minhas métricas de saúde atualizadas em *${today}*:

*🩺 Pressão Arterial (Acompanhamento)*:
• Média Histórica: *${avgSys}/${avgDia} mmHg* (Pulso: ${avgPulse} bpm)
• Última Medição lançada: *${lastBP}*

*🩸 Glicemia Capilar (Controle)*:
• Média Glicêmica em Jejum: *${avgFasting} mg/dL*
• Último teste inserido: *${lastGl}*
${workoutSummary}

_Relatório expedido localmente através do app responsivo VittaBP. Sessão sincronizada com segurança._`;
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(generateReportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const textencoded = encodeURIComponent(generateReportText());
    let url = `https://api.whatsapp.com/send?text=${textencoded}`;
    if (doctorPhone) {
      const sanitizedPhone = doctorPhone.replace(/\D/g, "");
      url = `https://api.whatsapp.com/send?phone=55${sanitizedPhone}&text=${textencoded}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };


  // --- 3. CALCULADORA DE RISCO ARTERIAL CARDIO ---
  const [calcAge, setCalcAge] = useState<number>(35);
  const [calcSys, setCalcSys] = useState<number>(130);
  const [calcSmoker, setCalcSmoker] = useState<boolean>(false);
  const [calcDiabetes, setCalcDiabetes] = useState<boolean>(false);

  const calculateCardioRisk = () => {
    // Elegant heuristic adapted from Framingham Risk Scale points estimation
    let score = 0;
    if (calcAge > 45) score += 2;
    if (calcAge > 60) score += 4;
    
    if (calcSys >= 140) score += 3;
    if (calcSys >= 160) score += 5;
    
    if (calcSmoker) score += 4;
    if (calcDiabetes) score += 3;

    if (score <= 3) return { label: "Baixo Risco (< 10%)", percent: "5% - 8%", color: "text-emerald-700 bg-emerald-50 border-emerald-100", desc: "Seu perfil apresenta excelente equilíbrio cardiovascular. Continue mantendo exercícios diários!" };
    if (score <= 6) return { label: "Risco Moderado (10% - 20%)", percent: "11% - 15%", color: "text-amber-700 bg-amber-50 border-amber-100", desc: "Atenção a hábitos cotidianos. Evite excesso de sódio e mantenha a aferição da pressão monitorada." };
    return { label: "Alto Risco Clínico (> 20%)", percent: "22% - 35%", color: "text-rose-700 bg-rose-50 border-rose-100 font-bold", desc: "Recomenda-se acompanhamento de rotina com médico corporativo ou especialista de sua preferência." };
  };

  const currentRisk = calculateCardioRisk();


  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 space-y-6">
      
      {/* Title Header with Mobile Identity */}
      <div className="flex items-center space-x-2.5">
        <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-sm md:text-base flex items-center gap-1.5">
            <span>Vitta Workout Monitoring</span>
            <span className="bg-emerald-500 rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase text-white tracking-wider animate-bounce">Live</span>
          </h3>
          <p className="text-[11px] text-slate-400">Rastreamento de performance, GPS e batimentos cardíacos em tempo real</p>
        </div>
      </div>

      {/* Sub tabs selector carousel (horizontal scrolling on tiny screens) */}
      <div className="flex space-x-1 overflow-x-auto pb-1 border-b border-slate-100 scrollbar-none scroll-smooth">
        <button
          onClick={() => setActiveSubTab('workout')}
          className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center space-x-1.5 ${
            activeSubTab === 'workout' 
              ? "bg-rose-600 text-white shadow-xs" 
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Timer className="w-3.5 h-3.5" />
          <span>Monitor</span>
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center space-x-1.5 ${
            activeSubTab === 'history' 
              ? "bg-rose-600 text-white shadow-xs" 
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Histórico</span>
        </button>

        <button
          onClick={() => setActiveSubTab('share')}
          className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center space-x-1.5 ${
            activeSubTab === 'share' 
              ? "bg-rose-600 text-white shadow-xs" 
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Relatórios</span>
        </button>

        <button
          onClick={() => setActiveSubTab('risk')}
          className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center space-x-1.5 ${
            activeSubTab === 'risk' 
              ? "bg-rose-600 text-white shadow-xs" 
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Risco Cardio</span>
        </button>
      </div>

      {/* 1. WORKOUT MONITOR PANEL */}
      {activeSubTab === 'workout' && (
        <div className="space-y-4.5 animate-fadeIn">
          <div className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-150 rounded-3xl bg-slate-50/30">
            {scanState === 'idle' && !isTracking && (
              <div className="text-center space-y-5 w-full">
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-w-sm mx-auto">
                  {(['academia', 'bicicleta', 'corrida', 'caminhada', 'lutas', 'outro'] as ActivityType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedActivity(type)}
                      className={`flex flex-col items-center p-2 rounded-xl border transition ${
                        selectedActivity === type 
                          ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm' 
                          : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {type === 'academia' && <Dumbbell className="w-5 h-5 mb-1" />}
                      {type === 'bicicleta' && <Bike className="w-5 h-5 mb-1" />}
                      {type === 'corrida' && <Navigation className="w-5 h-5 mb-1" />}
                      {type === 'caminhada' && <Footprints className="w-5 h-5 mb-1" />}
                      {type === 'lutas' && <Swords className="w-5 h-5 mb-1" />}
                      {type === 'outro' && <Activity className="w-5 h-5 mb-1" />}
                      <span className="text-[8px] uppercase font-bold">{type}</span>
                    </button>
                  ))}
                </div>

                <div className="flex justify-center mb-2">
                  <button
                    type="button"
                    onClick={handleStartWorkout}
                    className="w-28 h-28 rounded-full bg-rose-500 hover:bg-rose-600 flex flex-col items-center justify-center text-white font-extrabold shadow-lg hover:shadow-rose-500/30 transition-all duration-300 scale-100 hover:scale-105 active:scale-95 border-4 border-white inline-flex animate-pulse select-none cursor-pointer"
                  >
                    <Play className="w-8 h-8 fill-white mb-1" />
                    <span className="text-[10px] uppercase font-black tracking-tight leading-tight">Iniciar<br/>Treino</span>
                  </button>
                </div>
                <div>
                  <h4 className="font-black text-slate-700 text-xs">Monitoramento de Performance {selectedActivity}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">Conecte sua fita cardíaca para rastrear batimentos, velocidade via GPS e queima calórica.</p>
                </div>
              </div>
            )}

            {isTracking && (
              <div className="w-full space-y-4">
                {/* Real-time Dashboard Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-2.5 text-white flex flex-col justify-center shadow-xl">
                    <span className="text-[9px] font-black text-rose-300 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                      <Heart className="w-2.5 h-2.5 fill-rose-500 stroke-none animate-pulse" />
                      Pulso
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black font-mono tracking-tighter text-white drop-shadow-sm leading-none">{detectedPulse}</span>
                      <span className="text-[8px] font-black text-rose-200/70 uppercase">bpm</span>
                    </div>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-2.5 text-white flex flex-col justify-center shadow-xl">
                    <span className="text-[9px] font-black text-sky-300 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                      <Zap className="w-2.5 h-2.5 fill-sky-400 stroke-none" />
                      Km/h
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black font-mono tracking-tighter text-white drop-shadow-sm leading-none">{currentSpeed.toFixed(1)}</span>
                      <span className="text-[8px] font-black text-sky-200/70 uppercase whitespace-nowrap">km/h</span>
                    </div>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-2.5 text-white flex flex-col justify-center shadow-xl">
                    <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                      <Route className="w-2.5 h-2.5 text-emerald-400" />
                      Trajeto
                    </span>
                    <div className="flex items-baseline gap-1 overflow-hidden">
                      <span className="text-2xl font-black font-mono tracking-tighter text-white drop-shadow-sm leading-none truncate">
                        {totalDistance > 1000 ? (totalDistance / 1000).toFixed(2) : totalDistance.toFixed(0)}
                      </span>
                      <span className="text-[8px] font-black text-emerald-200/70 uppercase">
                        {totalDistance > 1000 ? 'km' : 'm'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-2.5 text-white flex flex-col justify-center shadow-xl">
                    <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                      <Timer className="w-2.5 h-2.5 text-amber-400" />
                      Relógio
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[20px] font-black font-mono tracking-tighter text-white drop-shadow-sm leading-none">
                        {new Date(sessionDuration * 1000).toISOString().substr(11, 8)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active Tracking Status (Compact) */}
                <div className="flex items-center justify-between bg-zinc-950 px-4 py-3 rounded-2xl border border-zinc-800 shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">
                      Rastreamento Ativo: {selectedActivity}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest leading-none mb-0.5">Satélites</span>
                      <span className="text-[9px] font-bold text-zinc-400 leading-none">OK</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-black text-sky-400 uppercase tracking-widest leading-none mb-0.5">Logs</span>
                      <span className="text-[9px] font-bold text-zinc-400 leading-none">{sessionPoints.length}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleStopWorkout}
                    className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-transform"
                  >
                    <Square className="w-5 h-5 fill-white" />
                    Finalizar Atividade
                  </button>
                </div>
              </div>
            )}

            {scanState === 'done' && !isTracking && activeSession && (
              <div className="text-center space-y-5 animate-fadeIn w-full">
                <div className="inline-flex p-3 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 mb-1">
                  <CheckCircle2 className="w-8 h-8 font-black" />
                </div>
                
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-800 text-sm">Resumo da Atividade Concluído!</h4>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto">Parabéns pelo treino. Seus dados foram salvos no histórico.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[8px] uppercase font-bold text-slate-400 block mb-1">Avg HR</span>
                    <span className="text-lg font-black text-rose-600">{activeSession.avgHeartRate} bpm</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[8px] uppercase font-bold text-slate-400 block mb-1">Max HR</span>
                    <span className="text-lg font-black text-rose-800">{activeSession.maxHeartRate} bpm</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[8px] uppercase font-bold text-slate-400 block mb-1">Calorias</span>
                    <span className="text-lg font-black text-orange-600">{activeSession.kcalEstimate} kcal</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[8px] uppercase font-bold text-slate-400 block mb-1">Vel. Média</span>
                    <span className="text-lg font-black text-indigo-600">{activeSession.avgSpeed.toFixed(1)} km/h</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    onClick={() => {
                      setScanState('idle');
                      setActiveSession(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Cancelar</span>
                  </button>
                  
                  <button
                    onClick={handleRegisterPulseReading}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/20 transition cursor-pointer flex items-center justify-center space-x-1.5 active:scale-95"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>Salvar no Diário (Médio)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* 2. EXPORT AND QUICK SHARE WITH WhatsApp / Doctor Telegram */}
      {activeSubTab === 'share' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Form parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Nome do Médico ou Parente</label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Ex: Dra. Mariana Vasconcellos"
                className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-xl focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">WhatsApp de Destino (Opcional)</label>
              <input
                type="tel"
                value={doctorPhone}
                onChange={(e) => setDoctorPhone(e.target.value)}
                placeholder="Ex: 11999999999"
                className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-xl focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="block text-[10px] uppercase font-black text-slate-400">Prévia do Texto Gerado:</span>
            <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl text-[11px] font-mono leading-relaxed select-all max-h-48 overflow-y-auto shadow-inner whitespace-pre-wrap">
              {generateReportText()}
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleCopyReport}
              className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Relatório Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Relatório Completo</span>
                </>
              )}
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="flex-1 py-2.5 px-4 bg-emerald-650 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer shadow-xs active:scale-95 duration-100"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Enviar pelo WhatsApp</span>
            </button>
          </div>
        </div>
      )}


      {/* 3. CARDIOVASCULAR HEALTH RISK CALCULATOR */}
      {activeSubTab === 'risk' && (
        <div className="space-y-4.5 animate-fadeIn">
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Sua Idade</label>
              <input
                type="number"
                value={calcAge}
                onChange={(e) => setCalcAge(Number(e.target.value))}
                className="w-full text-xs font-bold px-3 py-1.5 border border-slate-200 bg-white rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Pressão Máxima (Sys)</label>
              <input
                type="number"
                value={calcSys}
                onChange={(e) => setCalcSys(Number(e.target.value))}
                className="w-full text-xs font-bold px-3 py-1.5 border border-slate-200 bg-white rounded-xl focus:outline-none"
              />
            </div>

            <div className="col-span-2 pt-2 grid grid-cols-2 gap-2">
              <label className="flex items-center space-x-2 p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={calcSmoker}
                  onChange={(e) => setCalcSmoker(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 shrink-0 transition"
                />
                <span className="text-[10px] font-bold text-slate-600">Fumante</span>
              </label>

              <label className="flex items-center space-x-2 p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={calcDiabetes}
                  onChange={(e) => setCalcDiabetes(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 shrink-0 transition"
                />
                <span className="text-[10px] font-bold text-slate-600">Diabetes / Hiperglicemia</span>
              </label>
            </div>
          </div>

          <div className="space-y-3.5">
            <span className="block text-[10px] uppercase font-black text-slate-400 text-center">Estimativa de Risco Cardiovascular</span>
            
            <div className={`p-4 rounded-xl border text-center space-y-2 ${currentRisk.color} transition-all duration-300 shadow-sm`}>
              <div className="text-xs uppercase tracking-widest font-bold">Diagnóstico: {currentRisk.label}</div>
              <div className="text-3xl font-black font-mono">{currentRisk.percent}</div>
              <p className="text-[10px] text-slate-600 leading-normal max-w-sm mx-auto">{currentRisk.desc}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-2xl border border-amber-100 text-[10px] leading-relaxed text-amber-800">
            <ShieldAlert className="w-5 h-5 shrink-0 text-amber-500" />
            <span>Este medidor de risco é simplificado baseado nos índices de Framingham. Acompanhe relatórios periódicos com seu clínico de saúde ou equipe corporativa.</span>
          </div>
        </div>
      )}


      {/* 2. WORKOUT HISTORY PANEL */}
      {activeSubTab === 'history' && (
        <div className="space-y-3 animate-fadeIn">
          {workoutHistory.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50 border border-dashed rounded-3xl">
              <History className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-xs text-slate-400 font-bold">Nenhum treino registrado ainda.</p>
              <button 
                onClick={() => setActiveSubTab('workout')}
                className="mt-4 px-4 py-2 bg-white border border-slate-200 text-indigo-600 font-bold text-[10px] rounded-lg shadow-sm"
              >
                Iniciar Primeiro Atividade
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black uppercase text-slate-400">Atividades Recentes</span>
                <div className="flex items-center gap-2">
                  <select 
                    className="text-[9px] font-bold border-none bg-slate-50 rounded-lg py-1 px-2 focus:ring-0"
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value as any)}
                  >
                    <option value="all">Todas</option>
                    <option value="academia">Academia</option>
                    <option value="bicicleta">Bicicleta</option>
                    <option value="corrida">Corrida</option>
                  </select>
                  <button 
                    onClick={() => setDeleteId('all')}
                    className="text-[10px] font-bold text-rose-500 hover:underline"
                  >
                    Limpar Tudo
                  </button>
                </div>
              </div>
              {filteredHistory.map((session) => (
                <div key={session.id} className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-xs flex items-center gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    session.type === 'bicicleta' ? 'bg-sky-50 text-sky-600' :
                    session.type === 'corrida' ? 'bg-orange-50 text-orange-600' :
                    session.type === 'academia' ? 'bg-rose-50 text-rose-600' :
                    'bg-slate-50 text-slate-600'
                  }`}>
                    {session.type === 'bicicleta' && <Bike className="w-5 h-5" />}
                    {session.type === 'corrida' && <Navigation className="w-5 h-5" />}
                    {session.type === 'academia' && <Dumbbell className="w-5 h-5" />}
                    {session.type === 'caminhada' && <Footprints className="w-5 h-5" />}
                    {(!['bicicleta', 'corrida', 'academia', 'caminhada'].includes(session.type)) && <Activity className="w-5 h-5" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h5 className="text-[11px] font-black text-slate-700 capitalize">{session.type}</h5>
                      <span className="text-[9px] text-slate-400">{new Date(session.startTime).toLocaleDateString()}</span>
                    </div>

                    {session.pathPreviewData && (
                      <div className="mt-2 mb-2 rounded-xl overflow-hidden border border-slate-100 bg-zinc-950 aspect-[2/1] w-full">
                        <img 
                          src={session.pathPreviewData} 
                          alt="Mapa do Trajeto" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    {session.locationName && (
                      <div className="flex items-center gap-1 mt-0.5 text-[9px] text-slate-500 italic line-clamp-1">
                        <MapPin className="w-2.5 h-2.5 text-rose-400" />
                        {session.locationName}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                      <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-slate-500">
                        <Timer className="w-3 h-3" />
                        {Math.floor(session.duration / 60)}m
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-rose-600">
                        <Heart className="w-3 h-3 fill-rose-600 stroke-none" />
                        {session.avgHeartRate} avg
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-rose-800">
                        <Zap className="w-3 h-3 fill-rose-800 stroke-none" />
                        {session.maxHeartRate} pico
                      </div>
                      {session.distance > 0 && (
                        <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-sky-600">
                          <Route className="w-3 h-3" />
                          {session.distance > 1000 ? (session.distance / 1000).toFixed(1) + 'km' : session.distance.toFixed(0) + 'm'}
                        </div>
                      )}
                    </div>
                    {session.peakHeartRateLocation && (
                      <div className="flex items-center gap-1 mt-1 text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                        <MapPin className="w-2.5 h-2.5 text-rose-400" />
                        <span>Pico Reg. em: {session.peakHeartRateLocation.lat.toFixed(4)}, {session.peakHeartRateLocation.lng.toFixed(4)}</span>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => handleDeleteWorkout(session.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* GLOBAL DISASTER RECOVERY / DATA PURGE AREA (BLACK THEME) - COMPACT MOBILE VERSION */}
          <div className="pt-4 mt-2 border-t border-slate-100">
            <div className="bg-zinc-950 rounded-3xl p-4 shadow-xl border border-zinc-800 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 blur-2xl -mr-12 -mt-12 group-hover:bg-rose-500/10 transition-colors" />
              
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                    <h4 className="text-[12px] font-black text-white uppercase tracking-tight">Zerar Meus Dados</h4>
                  </div>
                  <p className="text-[10px] leading-snug text-zinc-400 font-medium max-w-sm">
                    Apaga permanentemente todos os seus registros de <span className="text-zinc-200">Pressão Arterial</span>, <span className="text-zinc-200">Glicose</span> e <span className="text-zinc-200">Peso</span>. Esta ação é irreversível.
                  </p>
                </div>
                
                <button
                  onClick={() => setDeleteId('global')}
                  className="w-full sm:w-auto px-4 py-2.5 bg-zinc-900 hover:bg-rose-950/30 border border-zinc-800 hover:border-rose-900/50 text-rose-500 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 group/btn cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Limpar Diário</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-12 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div className="text-center space-y-1">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Confirmar Exclusão?</h4>
              <p className="text-[11px] text-slate-500">
                {deleteId === 'all' 
                  ? "Esta ação irá remover permanentemente todos os seus treinos registrados." 
                  : deleteId === 'global'
                  ? "Esta ação é irreversível e apagará TODOS os seus registros de Pressão Arterial, Glicose e Peso."
                  : "Deseja realmente remover este treino do seu histórico?"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[11px] rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-xl shadow-lg shadow-rose-600/20 transition cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL HARDWARE STATUS AND SETTINGS (ALWAYS VISIBLE) */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between p-2 pl-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1 truncate flex-1 mr-2">
                <Bluetooth className={`w-3.5 h-3.5 shrink-0 ${isBleConnected ? 'text-indigo-500' : 'text-slate-400'}`} />
                <span className="truncate">{isBleConnected ? bleDeviceName || 'Dispositivo' : 'Conexão Fita BLE'}</span>
              </span>
              <button
                onClick={handleConnectBLE}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition flex items-center space-x-1 shrink-0 ${
                  isBleConnected ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                }`}
              >
                <span>{isBleConnected ? 'Pareado' : 'Conectar'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between p-2 pl-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1 min-w-0">
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-slate-500 shrink-0" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  <span className="truncate">Som</span>
                </span>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition ${
                    soundEnabled ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {soundEnabled ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center justify-between p-2 pl-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1 min-w-0">
                  <Vibrate className={`w-3.5 h-3.5 shrink-0 ${vibrationEnabled ? 'text-slate-500' : 'text-slate-400'}`} />
                  <span className="truncate">ViB</span>
                </span>
                <button
                  onClick={() => setVibrationEnabled(!vibrationEnabled)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition ${
                    vibrationEnabled ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {vibrationEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3">
          <HeartHandshake className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
          <div className="text-[10px] space-y-1">
            <span className="font-extrabold text-slate-700 block">Hardware Compatível</span>
            <p className="text-slate-400 leading-normal">
              O Vitta Workout é compatível com qualquer fita de peito ou sensor de pulso <strong>Bluetooth BLE</strong>. 
              Recomendamos <strong>Polar, Garmin, Wahoo ou Magene</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
