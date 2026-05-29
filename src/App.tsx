import React, { useState, useEffect } from "react";
import { 
  Heart, 
  Activity, 
  TrendingUp, 
  Bell, 
  Download, 
  Trash2, 
  Search, 
  Filter, 
  Database,
  Calendar,
  Sparkles,
  RefreshCw,
  Plus,
  AlertOctagon,
  Award,
  Clock,
  Check,
  ChevronRight,
  ShieldCheck,
  Volume2,
  Pencil,
  LogIn,
  LogOut,
  X,
  Smartphone,
  Menu,
  Settings,
  User,
  Scale,
  Sliders,
  Layout,
  Fingerprint,
  Lock,
  Eye,
  EyeOff,
  Shield,
  ShieldAlert
} from "lucide-react";

import { BloodPressureReading, GlucoseReading, HabitAlert, MySQLConfig as MySQLConfigType, UserProfile, WeightReading, AppUser } from "./types";
import { exportToCSV, getMealStateLabel } from "./utils/export";

const vittabpLogo = "/src/assets/images/vittabp_white_logo_1779465910916.png";

// Import components
import AuthModal from "./components/AuthModal";
import MySQLConfig from "./components/MySQLConfig";
import AddReadingModal from "./components/AddReadingModal";
import AlertManager from "./components/AlertManager";
import InsightsPanel from "./components/InsightsPanel";
import StatsDashboard from "./components/StatsDashboard";
import EditReadingModal from "./components/EditReadingModal";
import MobileHub from "./components/MobileHub";
import ProfileView from "./components/ProfileView";
import ExportPDFModal from "./components/ExportPDFModal";
import LandingPage from "./components/LandingPage";

export default function App() {
  // 1. Core clinical logs state
  const [bpReadings, setBpReadings] = useState<BloodPressureReading[]>([]);
  const [glucoseReadings, setGlucoseReadings] = useState<GlucoseReading[]>([]);
  const [weightReadings, setWeightReadings] = useState<WeightReading[]>([]);
  
  // 2. Alert & Habit states
  const [alerts, setAlerts] = useState<HabitAlert[]>([]);
  
  // 3. MySQL VPS Remote configuration
  const [mysqlConfig, setMysqlConfig] = useState<MySQLConfigType>({
    host: "",
    port: 3306,
    database: "",
    user: "",
    password: "",
    isConfigured: false
  });

  // 4. UI Filters and Search
  const [searchTerm, setSearchTerm] = useState("");
  const [diaryFilter, setDiaryFilter] = useState<'all' | 'pressure' | 'glucose' | 'weight'>('all');

  // 5. Active Alarm simulated banner state
  const [activeNotification, setActiveNotification] = useState<HabitAlert | null>(null);

  // 6. User authentication state
  const [allUsers, setAllUsers] = useState<AppUser[]>(() => {
    const cached = localStorage.getItem("vittabp_users");
    return cached ? JSON.parse(cached) : [];
  });
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const cached = localStorage.getItem("vittabp_current_user");
    return cached ? JSON.parse(cached) : null;
  });
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(!localStorage.getItem("vittabp_current_user"));
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  
  const currentUserEmail = currentUser ? currentUser.email : "";

  // Automated Admin identification shortcut
  const handleAdminSignIn = (email = "deiorbo@gmail.com", name = "deiorbo") => {
    let user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      user = {
        id: 'u-admin-' + Date.now(),
        name,
        surname: 'Administrador',
        birthDate: '1988-06-15',
        email,
        password: 'admin-simulated',
        height: 175,
        weight: 75
      };
      setAllUsers(prev => {
        const next = [...prev, user!];
        localStorage.setItem("vittabp_users", JSON.stringify(next));
        return next;
      });
    }
    setCurrentUser(user);
    localStorage.setItem("vittabp_current_user", JSON.stringify(user));
    setIsAuthModalOpen(false);
  };

  // Automated anonymous patient demonstration shortcut (Bypass)
  const handleDemoSignIn = () => {
    const email = "paciente.demo@vittabp.com.br";
    const name = "Carlos";
    const surname = "Menezes";
    let user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      user = {
        id: 'u-demo-' + Date.now(),
        name,
        surname,
        birthDate: '1990-04-12',
        email,
        password: 'demo-simulated',
        height: 178,
        weight: 82
      };
      setAllUsers(prev => {
        const next = [...prev, user!];
        localStorage.setItem("vittabp_users", JSON.stringify(next));
        return next;
      });
    }
    setCurrentUser(user);
    localStorage.setItem("vittabp_current_user", JSON.stringify(user));
    setIsAuthModalOpen(false);
  };

  // Edit reading states
  const [editingReading, setEditingReading] = useState<any | null>(null);
  const [editingType, setEditingType] = useState<'pressure' | 'glucose' | 'weight'>('pressure');
  const [isEditOpen, setIsEditOpen] = useState(false);

  // 7. Mobile and stationary dashboard active tab (dashboard, adicionar, historico, configuracoes, mobile, perfil, menu)
  const [activeMobileTab, setActiveMobileTab] = useState<'dashboard' | 'adicionar' | 'historico' | 'configuracoes' | 'mobile' | 'perfil' | 'menu'>('dashboard');
  const [isExportPDFOpen, setIsExportPDFOpen] = useState(false);

  // Close Login & Profile Dropdowns when active menu/tab changes
  useEffect(() => {
    setIsAuthModalOpen(false);
    setIsProfileOpen(false);
  }, [activeMobileTab]);

  // User Preference: Footer layout strategy (Fixed to screen bottom vs flowing in place)
  const [isFooterFixed, setIsFooterFixed] = useState<boolean>(() => {
    const stored = localStorage.getItem('isFooterFixed');
    return stored !== 'false'; // defaults to true (fixed)
  });

  const [activeTheme, setActiveTheme] = useState<'teal' | 'ocean' | 'rose' | 'violet' | 'emerald' | 'midnight'>(() => {
    const storedTheme = localStorage.getItem('vittabp_theme') as any;
    return storedTheme || 'teal';
  });
  const [pendingTheme, setPendingTheme] = useState<'teal' | 'ocean' | 'rose' | 'violet' | 'emerald' | 'midnight' | null>(null);

  useEffect(() => {
    if (activeTheme === 'teal') {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", activeTheme);
    }
  }, [activeTheme]);

  const handleSetTheme = (theme: 'teal' | 'ocean' | 'rose' | 'violet' | 'emerald' | 'midnight') => {
    // Apply temporarily
    if (theme === 'teal') {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
    setPendingTheme(theme);
  };

  const confirmThemeChange = () => {
    if (pendingTheme) {
      setActiveTheme(pendingTheme);
      localStorage.setItem('vittabp_theme', pendingTheme);
      setPendingTheme(null);
    }
  };

  const cancelThemeChange = () => {
    // Revert to active theme
    if (activeTheme === 'teal') {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", activeTheme);
    }
    setPendingTheme(null);
  };

  const [activeSettingsSubTab, setActiveSettingsSubTab] = useState<'preferencias' | 'lembretes' | 'banco'>('preferencias');

  const handleToggleFooterFixed = () => {
    setIsFooterFixed(prev => {
      const next = !prev;
      localStorage.setItem('isFooterFixed', String(next));
      return next;
    });
  };

  // Safety confirmation dialog state for record deletion
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    id: string;
    type: 'pressure' | 'glucose' | 'weight';
    valueText: string;
    secText: string;
    measuredAt: string;
  } | null>(null);

  // Safety confirmation dialog state for clearing all data
  const [clearAllConfirmation, setClearAllConfirmation] = useState(false);

  // User Profile state
  const [profile, setProfile] = useState<UserProfile>({
    name: "Paciente Exemplo",
    birthDate: "1988-06-15",
    additionalInfo: "Histórico preventivo de controle de pressão arterial. Prática de exercícios regulares de intensidade moderada.",
    height: 175,
    weight: 75
  });

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

  const getStorageKey = (baseKey: string) => {
    return currentUserEmail ? `${baseKey}_${currentUserEmail}` : baseKey;
  };

  // Initialize data on mount and when currentUserEmail changes from localStorage
  useEffect(() => {
    const cachedBp = localStorage.getItem(getStorageKey("smartbp_bp_readings"));
    const cachedGl = localStorage.getItem(getStorageKey("smartbp_glucose_readings"));
    const cachedWeight = localStorage.getItem(getStorageKey("smartbp_weight_readings"));
    const cachedAlerts = localStorage.getItem(getStorageKey("smartbp_alerts"));
    const cachedMysql = localStorage.getItem(getStorageKey("smartbp_mysql_config"));
    const cachedProfile = localStorage.getItem(getStorageKey("smartbp_user_profile"));

    // Securely retrieve the exact active user object from registration or login cache
    const activeUser = (() => {
      const cached = localStorage.getItem("vittabp_current_user");
      return cached ? JSON.parse(cached) : null;
    })();

    if (cachedBp) setBpReadings(JSON.parse(cachedBp));
    else {
      // Default placeholder data only for guest, empty for logged in users
      const initialBp: BloodPressureReading[] = currentUserEmail ? [] : [
        { id: "bp-1", systolic: 120, diastolic: 80, pulse: 72, notes: "Medição de rotina matinal", tags: ["Braço Esquerdo", "Matutino"], measuredAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString() },
        { id: "bp-2", systolic: 135, diastolic: 88, pulse: 78, notes: "Após o café da manhã", tags: ["Deitado", "Pós-Exercício"], measuredAt: new Date().toISOString() }
      ];
      setBpReadings(initialBp);
      localStorage.setItem(getStorageKey("smartbp_bp_readings"), JSON.stringify(initialBp));
    }

    if (cachedGl) setGlucoseReadings(JSON.parse(cachedGl));
    else {
      const initialGl: GlucoseReading[] = currentUserEmail ? [] : [
        { id: "gl-1", value: 92, mealState: "jejum", notes: "Medido logo após acordar", tags: ["Após Acordar"], measuredAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString() },
        { id: "gl-2", value: 138, mealState: "pos_prandial", notes: "Excelente controle", tags: ["Após Almoço"], measuredAt: new Date().toISOString() }
      ];
      setGlucoseReadings(initialGl);
      localStorage.setItem(getStorageKey("smartbp_glucose_readings"), JSON.stringify(initialGl));
    }

    if (cachedWeight) setWeightReadings(JSON.parse(cachedWeight));
    else {
      let initialWeight: WeightReading[] = [];
      if (activeUser && activeUser.weight) {
        initialWeight = [
          {
            id: `wt-${Date.now()}`,
            weight: Number(activeUser.weight),
            notes: "Peso inicial transferido automaticamente do cadastro",
            measuredAt: new Date().toISOString()
          }
        ];
      } else if (!activeUser) {
        initialWeight = [
          { id: "wt-1", weight: 75.5, notes: "Peso inicial", measuredAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString() },
          { id: "wt-2", weight: 74.8, notes: "Após exercícios da semana", measuredAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString() },
          { id: "wt-3", weight: 74.2, notes: "Manhã em jejum", measuredAt: new Date().toISOString() }
        ];
      }
      setWeightReadings(initialWeight);
      localStorage.setItem(getStorageKey("smartbp_weight_readings"), JSON.stringify(initialWeight));
    }

    if (cachedAlerts) setAlerts(JSON.parse(cachedAlerts));
    else {
      const initialAlerts: HabitAlert[] = [
        { id: "al-1", time: "07:30", label: "Medição em Jejum (Começar o Dia)", type: "both", active: true, days: ["seg", "ter", "qua", "qui", "sex", "sab", "dom"] },
        { id: "al-2", time: "21:00", label: "Controle de Pressão Noturna", type: "pressure", active: true, days: ["seg", "ter", "qua", "qui", "sex"] }
      ];
      setAlerts(initialAlerts);
      localStorage.setItem(getStorageKey("smartbp_alerts"), JSON.stringify(initialAlerts));
    }

    if (cachedMysql) {
      setMysqlConfig(JSON.parse(cachedMysql));
    } else {
      setMysqlConfig({
        host: "",
        port: 3306,
        database: "",
        user: "",
        password: "",
        isConfigured: false
      });
    }

    // Fetch the shared remote VPS configuration from backend server so all machines/browsers stay synchronized
    fetch("/api/mysql/config")
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.config) {
          // If the server configuration has host details, prefer server configuration
          if (data.config.host) {
            setMysqlConfig(data.config);
            localStorage.setItem(getStorageKey("smartbp_mysql_config"), JSON.stringify(data.config));
          }
        }
      })
      .catch(err => {
        console.error("Error loading shared VPS MySQL config from server:", err);
      });
    
    if (cachedProfile) {
      setProfile(JSON.parse(cachedProfile));
    } else {
      const initialProfile = {
        name: activeUser 
          ? `${activeUser.name} ${activeUser.surname}`.trim() 
          : (currentUserEmail ? currentUserEmail.substring(0, currentUserEmail.indexOf("@")) : "Paciente Exemplo"),
        birthDate: activeUser?.birthDate || "1988-06-15",
        additionalInfo: activeUser 
          ? "Ficha de prontuário clínico preventivo iniciada automaticamente no cadastro do usuário." 
          : "Histórico preventivo de controle de pressão arterial. Prática de exercícios regulares de intensidade moderada.",
        height: activeUser?.height ? Number(activeUser.height) : 175,
        weight: activeUser?.weight ? Number(activeUser.weight) : 75
      };
      setProfile(initialProfile);
      localStorage.setItem(getStorageKey("smartbp_user_profile"), JSON.stringify(initialProfile));
    }
  }, [currentUserEmail]);

  // Background auto-sync 
  const triggerBackgroundSync = (updatedBp?: BloodPressureReading[], updatedGl?: GlucoseReading[]) => {
    if (mysqlConfig.isConfigured && currentUserEmail) {
      fetch("/api/mysql/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: mysqlConfig,
          bpReadings: updatedBp || bpReadings,
          glucoseReadings: updatedGl || glucoseReadings,
          userId: currentUserEmail
        })
      }).catch(err => console.error("Auto-sync failed:", err));
    }
  };

  // Persist states
  const saveBpReadings = (updated: BloodPressureReading[], skipSync = false) => {
    setBpReadings(updated);
    localStorage.setItem(getStorageKey("smartbp_bp_readings"), JSON.stringify(updated));
    if (!skipSync) triggerBackgroundSync(updated, undefined);
  };

  const saveGlucoseReadings = (updated: GlucoseReading[], skipSync = false) => {
    setGlucoseReadings(updated);
    localStorage.setItem(getStorageKey("smartbp_glucose_readings"), JSON.stringify(updated));
    if (!skipSync) triggerBackgroundSync(undefined, updated);
  };

  const saveWeightReadings = (updated: WeightReading[]) => {
    setWeightReadings(updated);
    localStorage.setItem(getStorageKey("smartbp_weight_readings"), JSON.stringify(updated));
  };

  const saveAlerts = (updated: HabitAlert[]) => {
    setAlerts(updated);
    localStorage.setItem(getStorageKey("smartbp_alerts"), JSON.stringify(updated));
  };

  const saveProfile = (updated: UserProfile) => {
    setProfile(updated);
    localStorage.setItem(getStorageKey("smartbp_user_profile"), JSON.stringify(updated));

    // Also sync changes back to the active user account credentials dynamically
    if (currentUser) {
      const parts = updated.name.trim().split(/\s+/);
      const updatedName = parts[0] || currentUser.name;
      const updatedSurname = parts.slice(1).join(" ") || currentUser.surname;

      const updatedUser: AppUser = {
        ...currentUser,
        name: updatedName,
        surname: updatedSurname,
        birthDate: updated.birthDate || currentUser.birthDate,
        height: updated.height || currentUser.height,
        weight: updated.weight || currentUser.weight,
      };

      setCurrentUser(updatedUser);
      localStorage.setItem("vittabp_current_user", JSON.stringify(updatedUser));

      setAllUsers(prev => {
        const next = prev.map(u => u.email.toLowerCase() === currentUser.email.toLowerCase() ? updatedUser : u);
        localStorage.setItem("vittabp_users", JSON.stringify(next));
        return next;
      });
    }
  };

  // Actions

  const handleAddBP = (bp: Omit<BloodPressureReading, 'id'>) => {
    const newReading: BloodPressureReading = {
      ...bp,
      id: "bp-" + Date.now() + Math.random().toString(36).substring(2, 5)
    };
    const updated = [newReading, ...bpReadings];
    saveBpReadings(updated);
  };

  const handleAddGlucose = (gl: Omit<GlucoseReading, 'id'>) => {
    const newReading: GlucoseReading = {
      ...gl,
      id: "gl-" + Date.now() + Math.random().toString(36).substring(2, 5)
    };
    const updated = [newReading, ...glucoseReadings];
    saveGlucoseReadings(updated);
  };

  const handleAddWeight = (wt: Omit<WeightReading, 'id'>) => {
    const newReading: WeightReading = {
      ...wt,
      id: "wt-" + Date.now() + Math.random().toString(36).substring(2, 5)
    };
    const updated = [newReading, ...weightReadings];
    saveWeightReadings(updated);
    
    // Auto update profile weight
    const updatedProfile = { ...profile, weight: wt.weight };
    saveProfile(updatedProfile);
  };

  const triggerRemoteDelete = (id: string, type: 'pressure' | 'glucose') => {
    if (mysqlConfig.isConfigured && currentUserEmail) {
      fetch("/api/mysql/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: mysqlConfig,
          id,
          type,
          userId: currentUserEmail
        })
      }).catch(err => console.error("Remote delete failed:", err));
    }
  };

  const handleDeleteBP = (id: string) => {
    const updated = bpReadings.filter(r => r.id !== id);
    saveBpReadings(updated);
    triggerRemoteDelete(id, 'pressure');
  };

  const handleDeleteGlucose = (id: string) => {
    const updated = glucoseReadings.filter(r => r.id !== id);
    saveGlucoseReadings(updated);
    triggerRemoteDelete(id, 'glucose');
  };

  const handleDeleteWeight = (id: string) => {
    const updated = weightReadings.filter(r => r.id !== id);
    saveWeightReadings(updated);
  };

  const handleClearAllData = () => {
    saveBpReadings([]);
    saveGlucoseReadings([]);
    saveWeightReadings([]);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmation) return;
    const { id, type } = deleteConfirmation;
    if (type === 'pressure') {
      handleDeleteBP(id);
    } else if (type === 'glucose') {
      handleDeleteGlucose(id);
    } else {
      handleDeleteWeight(id);
    }
    setDeleteConfirmation(null);
  };

  // Authentication Actions
  const handleRegister = async (newUser: AppUser) => {
     setAllUsers(prev => {
        const next = [...prev, newUser];
        localStorage.setItem("vittabp_users", JSON.stringify(next));
        return next;
    });
    setCurrentUser(newUser);
    localStorage.setItem("vittabp_current_user", JSON.stringify(newUser));
    setIsAuthModalOpen(false);
  };

  const handleLogin = async (email: string, password: string) => {
    const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (user) {
        setCurrentUser(user);
        localStorage.setItem("vittabp_current_user", JSON.stringify(user));
        setIsAuthModalOpen(false);
    } else {
        alert("Credenciais inválidas");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("vittabp_current_user");
    setIsAuthModalOpen(true);
  };

  // Edit Reading handlers
  const handleStartEdit = (id: string, type: 'pressure' | 'glucose' | 'weight') => {
    if (type === 'pressure') {
      const bObj = bpReadings.find(b => b.id === id);
      if (bObj) {
        setEditingReading(bObj);
        setEditingType('pressure');
        setIsEditOpen(true);
      }
    } else if (type === 'glucose') {
      const gObj = glucoseReadings.find(g => g.id === id);
      if (gObj) {
        setEditingReading(gObj);
        setEditingType('glucose');
        setIsEditOpen(true);
      }
    } else {
      const wObj = weightReadings.find(w => w.id === id);
      if (wObj) {
        setEditingReading(wObj);
        setEditingType('weight');
        setIsEditOpen(true);
      }
    }
  };

  const handleSaveEdit = (id: string, updatedFields: any) => {
    if (editingType === 'pressure') {
      const updated = bpReadings.map(b => b.id === id ? { ...b, ...updatedFields } : b);
      saveBpReadings(updated);
    } else if (editingType === 'glucose') {
      const updated = glucoseReadings.map(g => g.id === id ? { ...g, ...updatedFields } : g);
      saveGlucoseReadings(updated);
    } else {
      const updated = weightReadings.map(w => w.id === id ? { ...w, ...updatedFields } : w);
      saveWeightReadings(updated);
    }
    setIsEditOpen(false);
    setEditingReading(null);
  };

  const handleAddAlert = (alert: Omit<HabitAlert, 'id'>) => {
    const newAlert: HabitAlert = {
      ...alert,
      id: "al-" + Date.now()
    };
    const updated = [...alerts, newAlert];
    saveAlerts(updated);
  };

  const handleUpdateAlert = (updatedAlert: HabitAlert) => {
    const updated = alerts.map(a => a.id === updatedAlert.id ? updatedAlert : a);
    saveAlerts(updated);
  };

  const handleToggleAlert = (id: string) => {
    const updated = alerts.map(a => a.id === id ? { ...a, active: !a.active } : a);
    saveAlerts(updated);
  };

  const handleDeleteAlert = (id: string) => {
    const updated = alerts.filter(a => a.id !== id);
    saveAlerts(updated);
  };

  const handleUpdateMysqlConfig = (newConfig: MySQLConfigType) => {
    setMysqlConfig(newConfig);
    localStorage.setItem(getStorageKey("smartbp_mysql_config"), JSON.stringify(newConfig));

    // Persist to the server-side JSON file so all machines and users can obtain this remote MySQL path automatically
    fetch("/api/mysql/config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(newConfig)
    })
    .then(res => res.json())
    .then(data => {
      console.log("MySQL connection path synchronized and saved securely on the central server.", data);
    })
    .catch(err => {
      console.error("Failed to persist shared VPS MySQL configuration server-side:", err);
    });
  };

  // Executed on dual-sync completion
  const handleSyncComplete = (syncedBp: BloodPressureReading[], syncedGl: GlucoseReading[]) => {
    saveBpReadings(syncedBp, true);
    saveGlucoseReadings(syncedGl, true);
  };

  // Triggered when Simulated Alert matches current time inside AlertManager.tsx
  const handleTriggerAlarm = (alert: HabitAlert) => {
    setActiveNotification(alert);
    
    // Play audio helper
    const playSound = (sound: string | undefined) => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        const soundType = sound || 'beep';
        
        if (soundType === 'beep') {
          osc.type = "sine";
          osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
        } else if (soundType === 'chime') {
          osc.type = "triangle";
          osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5 note
        } else { // ding
          osc.type = "square";
          osc.frequency.setValueAtTime(1046.5, audioCtx.currentTime); // C6 note
        }
        
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch (e) {
        console.log("Audio contexts trigger supported on click interactions only.");
      }
    };

    // Play first immediately
    playSound(alert.sound);

    // Set interval to repeat every 3s
    const interval = setInterval(() => {
      playSound(alert.sound);
    }, 3000);
    
    // Set timeout to clear everything after 10 mins
    const timeout = setTimeout(() => {
      stopAlarm();
    }, 10 * 60 * 1000);

    // Save timers
    (window as any).activeAlarmInterval = interval;
    (window as any).activeAlarmTimeout = timeout;
  };

  const stopAlarm = () => {
    setActiveNotification(null);
    if ((window as any).activeAlarmInterval) {
      clearInterval((window as any).activeAlarmInterval);
      (window as any).activeAlarmInterval = null;
    }
    if ((window as any).activeAlarmTimeout) {
      clearTimeout((window as any).activeAlarmTimeout);
      (window as any).activeAlarmTimeout = null;
    }
  };

  // Combined clinical history timeline
  const timelineItems = [
    ...bpReadings.map(bp => {
      const getBpStatus = () => {
        if (bp.systolic >= 140 || bp.diastolic >= 90) return { label: "Hipertensão", color: "bg-rose-50 border-rose-150 text-rose-700 font-bold" };
        if (bp.systolic >= 130 || bp.diastolic >= 85) return { label: "Limítrofe", color: "bg-amber-50 border-amber-100 text-amber-800 font-black" };
        if (bp.systolic < 90 || bp.diastolic < 60) return { label: "Hipotensão", color: "bg-blue-50 border-blue-100 text-blue-700 font-bold" };
        return { label: "Normal", color: "bg-teal-50/50 border-teal-100 text-teal-700 font-bold" };
      };
      return {
        id: bp.id,
        type: 'pressure' as const,
        title: "Pressão Arterial",
        valueText: `${bp.systolic}/${bp.diastolic} mmHg`,
        secText: `Pulso: ${bp.pulse} bpm`,
        tags: bp.tags,
        notes: bp.notes,
        measuredAt: bp.measuredAt,
        status: getBpStatus()
      };
    }),
    ...glucoseReadings.map(gl => {
      const getGlucoseStatus = () => {
        if (gl.value < 70) return { label: "Hipoglicemia", color: "bg-red-50 border-red-150 text-red-700 font-black animate-pulse" };
        if (gl.mealState === "jejum" && gl.value >= 126) return { label: "Alta (Jejum)", color: "bg-rose-50 border-rose-150 text-rose-700 font-bold" };
        if (gl.mealState === "jejum" && gl.value >= 100) return { label: "Alterada", color: "bg-amber-50 border-amber-100 text-amber-700 font-bold" };
        if (gl.mealState !== "jejum" && gl.value >= 200) return { label: "Crítica", color: "bg-rose-100 border-rose-200 text-rose-800 font-black animate-pulse" };
        if (gl.mealState !== "jejum" && gl.value >= 140) return { label: "Elevada", color: "bg-amber-50 border-amber-100 text-amber-750 font-bold" };
        return { label: "Normal", color: "bg-emerald-50/50 border-emerald-100 text-emerald-750 font-bold" };
      };
      return {
        id: gl.id,
        type: 'glucose' as const,
        title: "Glicemia",
        valueText: `${gl.value} mg/dL`,
        secText: `Momento: ${getMealStateLabel(gl.mealState)}`,
        tags: gl.tags,
        notes: gl.notes,
        measuredAt: gl.measuredAt,
        status: getGlucoseStatus()
      };
    }),
    ...weightReadings.map(wt => {
      const getWeightStatus = () => {
        // Ideal logic would compare to a goal, here we just show standard styling
        return { label: "Registro Geral", color: "bg-indigo-50/50 border-indigo-100 text-indigo-750 font-bold" };
      };
      return {
        id: wt.id,
        type: 'weight' as const,
        title: "Peso Corporal",
        valueText: `${wt.weight.toFixed(1).replace('.', ',')} kg`,
        secText: `Registro de Evolução`,
        tags: [],
        notes: wt.notes,
        measuredAt: wt.measuredAt,
        status: getWeightStatus()
      };
    })
  ].sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime());

  // Search & Type Filtering
  const filteredTimeline = timelineItems.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.valueText.includes(searchTerm);

    const matchesType = 
      diaryFilter === 'all' || 
      (diaryFilter === 'pressure' && item.type === 'pressure') ||
      (diaryFilter === 'glucose' && item.type === 'glucose') ||
      (diaryFilter === 'weight' && item.type === 'weight');

    return matchesSearch && matchesType;
  });

  if (!currentUser) {
    return (
      <LandingPage
        onLogin={handleLogin}
        onRegister={handleRegister}
        onAdminSignIn={() => handleAdminSignIn("deiorbo@gmail.com", "deiorbo")}
        onDemoSignIn={handleDemoSignIn}
        authLoading={authLoading}
      />
    );
  }

  return (
    <>
    <div className={`min-h-screen bg-slate-50/50 ${isFooterFixed ? 'pb-24 md:pb-16' : 'pb-6'} font-sans`}>
      <AuthModal isOpen={isAuthModalOpen} onLogin={handleLogin} onRegister={handleRegister} />
      
      {/* Main Container */}
      <div className={`max-w-7xl mx-auto px-2 sm:px-4 mt-4 md:mt-8 space-y-6 md:space-y-8 ${isAuthModalOpen ? 'opacity-20 pointer-events-none' : ''}`}>
          {/* Dynamic Simulated Alarm banner overlay */}
      {activeNotification && (
        <div id="delete-confirmation-modal" className="fixed bottom-36 md:bottom-20 right-4 left-4 md:left-auto md:right-6 z-60 max-w-sm bg-slate-900 text-white rounded-2xl shadow-2xl p-4 border border-rose-500/20 animate-shake">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Hábito Clínico VittaBP</span>
              <h4 className="text-sm font-semibold text-slate-100">{activeNotification.label}</h4>
              <p className="text-xs text-slate-300 mt-0.5">Está na hora! Crie o hábito de preencher seu prontuário clínico preventivo.</p>
              
              <div className="mt-3 flex items-center space-x-2">
                <button
                  onClick={() => {
                    stopAlarm();
                    // Open the correct tab on mobile
                    setActiveMobileTab('adicionar');
                    // Scroll to add reading forms
                    setTimeout(() => {
                      document.getElementById("add-reading-section")?.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                  }}
                  className="bg-teal-500 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold transition hover:bg-teal-400 cursor-pointer"
                >
                  Registrar Agora
                </button>
                <button
                  onClick={() => stopAlarm()}
                  className="bg-white/10 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/15 transition cursor-pointer"
                >
                  Adiar 10min
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <header className="bg-white border-b border-slate-100 py-3 md:py-4 sticky top-0 z-40 shadow-[0_2px_12px_rgba(30,41,59,0.02)]">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center gap-2">
          <div 
            onClick={() => {
              setActiveMobileTab('dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center space-x-2 sm:space-x-3 min-w-0 cursor-pointer group select-none hover:opacity-90 transition active:scale-[0.98]"
            title="Ir para Home"
          >
            {/* Logo directly (removed wrapper/card background, size increased) */}
            <img 
              src={vittabpLogo} 
              alt="VittaBP Logo" 
              className="w-11 h-11 md:w-14 md:h-14 object-contain shrink-0 transition-all duration-300 group-hover:scale-105" 
              referrerPolicy="no-referrer" 
            />
            
            <div className="min-w-0">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <h1 className="text-base md:text-xl font-black text-slate-800 tracking-tight leading-none group-hover:text-teal-600 transition-colors">VittaBP</h1>
                <span className="text-[8px] md:text-[9px] uppercase font-black tracking-widest px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded-md">Diário</span>
              </div>
              <p className="text-[10px] md:text-xs text-slate-400 truncate mt-0.5 hidden xs:block">
                <span className="font-bold stats-patient-name">{profile.name}</span> • <span className="stats-patient-age">{calculateAge(profile.birthDate)} anos</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setIsExportPDFOpen(true)}
              className="hidden md:flex items-center justify-center p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs transition cursor-pointer"
              title="Exportar Prontuário (PDF)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-semibold text-[11px] ml-1">Exportar PDF</span>
            </button>



            {/* User Session Profile Menu Button */}
            <div className="relative">
              {currentUser ? (
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 p-1.5 hover:bg-slate-50 border border-slate-200 rounded-full transition duration-200 cursor-pointer text-xs"
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-extrabold shadow-sm ${
                    currentUser.email === "deiorbo@gmail.com" 
                      ? "bg-gradient-to-tr from-teal-650 to-teal-500" 
                      : "bg-gradient-to-tr from-indigo-500 to-indigo-400"
                  }`}>
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  
                  <span className="font-bold text-slate-700 hidden xs:inline pr-1 max-w-[100px] truncate">
                    {currentUser.name}
                  </span>

                  {currentUser.email === "deiorbo@gmail.com" && (
                    <span className="hidden sm:inline bg-teal-600 text-[8px] uppercase tracking-wider font-extrabold text-white px-1.5 py-0.5 rounded-full shrink-0 mr-1 shadow-xs">
                      Admin
                    </span>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl text-[11px] font-black transition shadow-xs cursor-pointer duration-200 active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5 shrink-0" />
                  <span>Acessar Conta</span>
                </button>
              )}

              {/* Account Dropdown Details Card */}
              {isProfileOpen && currentUser && (
                <>
                  {/* Invisible screen backdrop to capture click-outside */}
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setIsProfileOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2.5 w-76 bg-white border border-slate-150 rounded-2xl shadow-xl p-4 space-y-4.5 z-50 text-xs text-slate-700 animate-fadeIn">
                    <div className="text-center pb-3 border-b border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Sessão Ativa</span>
                      
                      <div className="flex justify-center mb-2">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-black shadow-md ${
                          currentUser?.email === "deiorbo@gmail.com" 
                            ? "bg-gradient-to-tr from-teal-600 to-teal-400" 
                            : "bg-gradient-to-tr from-indigo-505 to-indigo-400"
                        }`}>
                          {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                        </div>
                      </div>
                      
                      <h4 className="font-bold text-sm text-slate-800">{currentUser?.name || "Usuário"}</h4>
                      <span className="text-[11px] text-slate-400 font-mono block truncate">{currentUser?.email}</span>
                      
                      <div className="mt-2 inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-bold border border-emerald-100/50">
                        <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span>Sessão Ativa Segura</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <button
                        onClick={handleLogout}
                        className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer duration-150"
                      >
                        <LogOut className="w-3.5 h-3.5 shrink-0" />
                        <span>Sair da Conta</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 mt-4 md:mt-8 space-y-6 md:space-y-8">
        
        {/* Row 2: General Stats & Graphics visualization */}
        <div className={activeMobileTab === 'dashboard' ? 'block animate-fadeIn' : 'hidden'}>
          <StatsDashboard bpReadings={bpReadings} glucoseReadings={glucoseReadings} weightReadings={weightReadings} profile={profile} />
        </div>

        {/* Row 3: Actionable AI Insights */}
        <div className={activeMobileTab === 'dashboard' ? 'block mt-6 animate-fadeIn' : 'hidden'}>
          <InsightsPanel bpReadings={bpReadings} glucoseReadings={glucoseReadings} profile={profile} />
        </div>

        {/* Row 4: Custom Input registration Forms */}
        <div className={activeMobileTab === 'adicionar' ? 'block animate-fadeIn max-w-2xl mx-auto w-full' : 'hidden'} id="add-reading-section">
          <AddReadingModal onAddBP={handleAddBP} onAddGlucose={handleAddGlucose} onAddWeight={handleAddWeight} />
        </div>

        {/* Row 4B: Habits & Alert setups */}
        <div className={activeMobileTab === 'configuracoes' ? 'block animate-fadeIn' : 'hidden'}>
          <div className="space-y-4">
            
            {/* Elegant Context-Aware Settings Sub-navigation Bar */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 p-3 sm:p-4 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight">Painel de Configurações</h2>
                  <p className="text-[10px] sm:text-xs text-slate-400">Ajuste aparências, gerencie alertas e gerencie sincronizações privadas</p>
                </div>

                {/* Sub-tab segmented pill selector */}
                <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto sm:overflow-visible shrink-0 select-none scrollbar-none gap-0.5">
                  <button
                    onClick={() => setActiveSettingsSubTab('preferencias')}
                    className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      activeSettingsSubTab === 'preferencias'
                        ? "bg-white text-teal-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5 shrink-0" />
                    <span>Aparência</span>
                  </button>

                  <button
                    onClick={() => setActiveSettingsSubTab('lembretes')}
                    className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      activeSettingsSubTab === 'lembretes'
                        ? "bg-white text-teal-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
                    }`}
                  >
                    <Bell className="w-3.5 h-3.5 shrink-0" />
                    <span>Lembretes</span>
                  </button>

                  {currentUserEmail === "deiorbo@gmail.com" && (
                    <button
                      onClick={() => setActiveSettingsSubTab('banco')}
                      className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        activeSettingsSubTab === 'banco'
                          ? "bg-white text-teal-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
                      }`}
                    >
                      <Database className="w-3.5 h-3.5 shrink-0" />
                      <span>Sincronização</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sub-tab Panels */}
            <div className="transition-all duration-300">
              {activeSettingsSubTab === 'preferencias' && (
                <div className="animate-fadeIn space-y-4 text-left">
                  {/* Visual Preferences Panel */}
                  <div id="visual-preferences-panel" className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                          <Sliders className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-xs sm:text-sm">Preferências Visual</h3>
                          <p className="text-[10px] sm:text-xs text-slate-500">Comportamento da interface de usuário</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Theme Confirmation Modal UI */}
                    {pendingTheme && (
                      <div className="bg-indigo-600 rounded-xl p-4 text-white flex items-center justify-between shadow-lg animate-fadeIn border border-indigo-400">
                        <p className="text-xs font-bold">Aplicar novo tema?</p>
                        <div className="flex gap-2">
                          <button onClick={cancelThemeChange} className="bg-white/10 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer">Voltar</button>
                          <button onClick={confirmThemeChange} className="bg-white text-indigo-700 px-3 py-1 rounded-lg text-xs font-bold cursor-pointer">Confirmar</button>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 p-3.5 bg-slate-50/50 rounded-xl border border-slate-150">
                      <div className="space-y-1">
                        <span className="font-extrabold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                          <Layout className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600 shrink-0" />
                          <span>Rodapé de Navegação Fixo</span>
                        </span>
                        <p className="text-[10px] sm:text-xs text-slate-500 leading-normal max-w-xl">
                          Ao ativar, a barra de navegação fica permanentemente flutuando na parte inferior da tela durante a rolagem. Desativado, repousa ao fim da rolagem.
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto pt-1 sm:pt-0">
                        <button
                          type="button"
                          onClick={handleToggleFooterFixed}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isFooterFixed ? 'bg-teal-600' : 'bg-slate-200'
                          }`}
                          aria-label="Toggle Fixed Footer Option"
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isFooterFixed ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${
                          isFooterFixed ? 'text-teal-600' : 'text-slate-400'
                        }`}>
                          {isFooterFixed ? 'Ativado' : 'Desativado'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3.5 p-3.5 bg-slate-50/50 rounded-xl border border-slate-150 mt-4">
                      <div className="space-y-1">
                        <span className="font-extrabold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                          <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gradient-to-tr from-teal-400 to-indigo-500 shrink-0" />
                          <span>Tema Visual do Aplicativo</span>
                        </span>
                        <p className="text-[10px] sm:text-xs text-slate-500 leading-normal">
                          Personalize as cores de destaque e a aparência geral do VittaBP ao seu gosto.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap pt-2">
                        {[
                          { id: 'teal', name: 'Clássico', color: 'bg-teal-500' },
                          { id: 'ocean', name: 'Oceano', color: 'bg-blue-500' },
                          { id: 'rose', name: 'Rubi', color: 'bg-rose-500' },
                          { id: 'violet', name: 'Ametista', color: 'bg-violet-500' },
                          { id: 'emerald', name: 'Esmeralda', color: 'bg-emerald-500' },
                          { id: 'midnight', name: 'Modo Escuro', color: 'bg-slate-900' }
                        ].map(theme => (
                          <button
                            key={theme.id}
                            onClick={() => handleSetTheme(theme.id as any)}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                              activeTheme === theme.id 
                                ? 'border-teal-500 bg-white shadow-sm ring-1 ring-teal-500/20' 
                                : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <span className={`w-3 h-3 rounded-full ${theme.color} ${activeTheme === theme.id ? 'ring-2 ring-offset-1 ring-teal-400' : ''}`} />
                            <span className={`text-[10px] sm:text-xs font-bold ${activeTheme === theme.id ? 'text-teal-700' : 'text-slate-600'}`}>
                              {theme.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3.5 p-4 bg-red-50/50 rounded-xl border border-red-100 mt-4">
                      <div className="space-y-1">
                         <span className="font-extrabold text-red-800 text-xs sm:text-sm flex items-center gap-1.5">
                           <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 shrink-0" />
                           <span>Zerar Meus Dados</span>
                         </span>
                         <p className="text-[10px] sm:text-xs text-red-600/80 leading-normal">
                           Apaga permanentemente todos os seus registros de Pressão Arterial, Glicose e Peso do aplicativo. Esta ação é irreversível.
                         </p>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={() => setClearAllConfirmation(true)}
                          className="flex items-center w-fit gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] sm:text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Apagar Tudo Permanentemente</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {activeSettingsSubTab === 'lembretes' && (
                <div className="animate-fadeIn">
                  <AlertManager 
                    alerts={alerts}
                    onAddAlert={handleAddAlert}
                    onUpdateAlert={handleUpdateAlert}
                    onToggleAlert={handleToggleAlert}
                    onDeleteAlert={handleDeleteAlert}
                    onTriggerAlarmMock={handleTriggerAlarm}
                  />
                </div>
              )}

              {activeSettingsSubTab === 'banco' && (
                <div className="animate-fadeIn text-left">
                  {currentUserEmail === "deiorbo@gmail.com" ? (
                    <MySQLConfig 
                      config={mysqlConfig}
                      onUpdateConfig={handleUpdateMysqlConfig}
                      bpReadings={bpReadings}
                      glucoseReadings={glucoseReadings}
                      onSyncComplete={handleSyncComplete}
                      currentUserEmail={currentUserEmail}
                    />
                  ) : (
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs transition-all duration-300">
                      <div className="flex items-start sm:items-center space-x-3 text-slate-500">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 bg-teal-50/50 shrink-0">
                          <Database className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-700 block text-xs md:text-sm">Configuração MySQL Premium Oculta</span>
                          <p className="text-[10px] sm:text-[11px] text-slate-450 text-slate-400 leading-normal">
                            Este recurso foi programaticamente privado pelo administrador do sistema para fins de segurança e privacidade dos dados.
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleAdminSignIn("deiorbo@gmail.com", "deiorbo")}
                        className="px-2.5 sm:px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-[10px] sm:text-[11px] rounded-lg font-bold transition cursor-pointer shrink-0 w-full sm:w-auto"
                      >
                        Identificar Administrador
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 4C: Vitta Workout - Physical Performance Tracking */}
        <div className={activeMobileTab === 'mobile' ? 'block animate-fadeIn max-w-2xl mx-auto w-full' : 'hidden'}>
          <MobileHub 
            onAddBP={handleAddBP} 
            onClearAllRecords={handleClearAllData}
            bpReadings={bpReadings} 
            glucoseReadings={glucoseReadings} 
          />
        </div>

        {/* Row 4D: Profile View & Management Panel (Portuguese "Perfil") */}
        <div className={activeMobileTab === 'perfil' ? 'block animate-fadeIn' : 'hidden'}>
          <ProfileView profile={profile} onSave={saveProfile} />
        </div>

        {/* Row 4E: Full-page Menu View */}
        {activeMobileTab === 'menu' && (
          <div className="animate-fadeIn max-w-2xl mx-auto w-full space-y-6 pb-24">
            {/* Menu Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Menu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm md:text-base tracking-tight">Menu Principal</h3>
                  <p className="text-[11px] text-slate-400">Acesse configurações, perfil e ferramentas</p>
                </div>
              </div>
            </div>

            {/* Profile Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5 bg-slate-50/50 border-b border-slate-100">
                {currentUser ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-sm border-2 border-white">
                        {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div>
                        <span className="block font-black text-slate-800 text-sm">{currentUser.name}</span>
                        <span className="block text-[10px] text-slate-400 font-mono italic">{currentUser.email}</span>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold rounded-lg transition"
                    >
                      Sair
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center py-2 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-700">Conta não conectada</p>
                      <p className="text-[10px] text-slate-400 max-w-[200px]">Faça login ou crie uma conta para sincronização segura dos seus dados.</p>
                    </div>
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="w-full max-w-[200px] py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition flex items-center justify-center space-x-2"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Fazer Login / Cadastrar</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Navigation Links */}
              <div className="p-2 grid grid-cols-1 gap-1">
                <button
                  onClick={() => {
                    setActiveMobileTab('perfil');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition active:scale-[0.99]"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <span className="block font-black text-slate-800 text-xs uppercase tracking-tight">Perfil do Paciente</span>
                      <span className="text-[10px] text-slate-400">Dados biométricos e biografia</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>

                <button
                  onClick={() => {
                    setActiveMobileTab('configuracoes');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition active:scale-[0.99]"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <span className="block font-black text-slate-800 text-xs uppercase tracking-tight">Configurações</span>
                      <span className="text-[10px] text-slate-400">Preferências e integrações MySQL</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>

                <button
                  onClick={() => {
                    setIsExportPDFOpen(true);
                  }}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition active:scale-[0.99]"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                      <Download className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <span className="block font-black text-slate-800 text-xs uppercase tracking-tight">Relatório PDF</span>
                      <span className="text-[10px] text-slate-400">Exportar histórico completo</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              </div>

              {/* Branding Footer */}
              <div className="p-6 bg-slate-50/50 border-t border-slate-100 text-center space-y-2">
                 <div className="flex items-center justify-center gap-2 mb-1">
                    <img src={vittabpLogo} alt="VittaBP" className="w-5 h-5 opacity-40 grayscale" />
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">VittaBP v2.5</span>
                 </div>
                 <p className="text-[9px] text-slate-300 max-w-xs mx-auto leading-relaxed">Sua saúde monitorada com precisão clínica e tecnologia de ponta sincronizada.</p>
              </div>
            </div>
          </div>
        )}

        {/* Row 5: Consolidated Timeline Logs List */}
        <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 animate-fadeIn ${activeMobileTab === 'historico' ? 'block' : 'hidden'}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-secondary-50">
            <div>
              <h3 className="font-bold text-slate-800 text-sm md:text-base">Registros e Visão de Prontuário</h3>
              <p className="text-xs text-slate-500">Histórico cronológico detalhado por exames</p>
            </div>

            {/* Timeline filtration controls */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto justify-between sm:justify-start gap-1">
                <button
                  onClick={() => setDiaryFilter('all')}
                  className={`px-3 py-2 rounded-lg transition-all flex-1 sm:flex-none flex flex-col items-center justify-center min-w-[55px] sm:min-w-[65px] ${
                    diaryFilter === 'all' 
                      ? "bg-white text-slate-800 shadow-xs" 
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  }`}
                >
                  <span className="text-[11px] tracking-tight font-extrabold leading-none">Tudo</span>
                  <span className="text-[10px] opacity-80 font-mono mt-1 font-bold">({timelineItems.length})</span>
                </button>
                <button
                  onClick={() => setDiaryFilter('pressure')}
                  className={`px-3 py-2 rounded-lg transition-all flex-1 sm:flex-none flex flex-col items-center justify-center min-w-[55px] sm:min-w-[65px] ${
                    diaryFilter === 'pressure' 
                      ? "bg-white text-teal-600 shadow-xs" 
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  }`}
                >
                  <span className="text-[11px] tracking-tight font-extrabold leading-none">Pressão</span>
                  <span className="text-[10px] opacity-80 font-mono mt-1 font-bold">({bpReadings.length})</span>
                </button>
                <button
                  onClick={() => setDiaryFilter('glucose')}
                  className={`px-3 py-2 rounded-lg transition-all flex-1 sm:flex-none flex flex-col items-center justify-center min-w-[55px] sm:min-w-[65px] ${
                    diaryFilter === 'glucose' 
                      ? "bg-white text-amber-600 shadow-xs" 
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  }`}
                >
                  <span className="text-[11px] tracking-tight font-extrabold leading-none">Glicose</span>
                  <span className="text-[10px] opacity-80 font-mono mt-1 font-bold">({glucoseReadings.length})</span>
                </button>
                <button
                  onClick={() => setDiaryFilter('weight')}
                  className={`px-3 py-2 rounded-lg transition-all flex-1 sm:flex-none flex flex-col items-center justify-center min-w-[55px] sm:min-w-[65px] ${
                    diaryFilter === 'weight' 
                      ? "bg-white text-indigo-600 shadow-xs" 
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  }`}
                >
                  <span className="text-[11px] tracking-tight font-extrabold leading-none">Peso</span>
                  <span className="text-[10px] opacity-80 font-mono mt-1 font-bold">({weightReadings.length})</span>
                </button>
              </div>

              {/* Tag search bar */}
              <div className="relative w-full sm:w-auto">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filtrar por tag ou nota..."
                  className="text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none w-full sm:w-56"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {filteredTimeline.length === 0 ? (
              <div className="text-center py-20 bg-slate-50/50 rounded-xl border border-dashed text-slate-400 text-xs">
                Nenhum exame corresponde aos filtros de busca atuais. Experimente adicionar novas medições acima!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTimeline.map((item) => {
                  const itemDate = new Date(item.measuredAt);
                  const isPressure = item.type === 'pressure';
                  
                  return (
                     <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
                      <div className="flex items-start space-x-3 sm:space-x-4 min-w-0">
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isPressure 
                            ? "bg-teal-50 text-teal-600 border border-teal-100" 
                            : item.type === 'glucose' 
                              ? "bg-amber-50 text-amber-500 border border-amber-100"
                              : "bg-indigo-50 text-indigo-500 border border-indigo-100"
                        }`}>
                          {isPressure ? <Heart className="w-5 h-5" /> : item.type === 'glucose' ? <Activity className="w-5 h-5" /> : <Scale className="w-5 h-5" />}
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="text-xs font-black text-slate-800">{item.valueText}</span>
                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium font-mono truncate">
                              {itemDate.toLocaleDateString('pt-BR')} {itemDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className={`text-[8px] sm:text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md ${
                              isPressure ? "bg-teal-50 text-teal-700" : item.type === 'glucose' ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-indigo-700"
                            }`}>
                              {isPressure ? "Pressão" : item.type === 'glucose' ? "Glicose" : "Peso"}
                            </span>
                            {item.status && (
                              <span className={`text-[8px] sm:text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-md border ${item.status.color}`}>
                                {item.status.label}
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] sm:text-xs text-slate-500 leading-normal">
                            <span className="font-semibold text-slate-600">{item.secText}</span>
                            {item.notes && <span className="ml-1 text-slate-450 block sm:inline text-slate-400">— "{item.notes}"</span>}
                          </div>

                          {item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {item.tags.map((tg, i) => (
                                <span key={i} className="text-[9px] bg-slate-100 rounded px-1.5 py-0.5 text-slate-500">
                                  #{tg}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                        <button
                          onClick={() => handleStartEdit(item.id, item.type)}
                          className="p-1 px-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition shrink-0 cursor-pointer"
                          title="Editar este registro"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmation({
                            id: item.id,
                            type: item.type,
                            valueText: item.valueText,
                            secText: item.secText,
                            measuredAt: item.measuredAt
                          })}
                          className="p-1 px-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition shrink-0 cursor-pointer"
                          title="Remover este registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Floating disclaimer footer */}
        <div className="bg-slate-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-200 text-xs text-slate-500 leading-normal mb-8">
          <div className="flex items-start sm:items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5 sm:mt-0" />
            <span>VittaBP é focado no acompanhamento de hábitos e controle do diário. Não altere automedicações sem avaliação profissional de seu médico corporativo ou clínico.</span>
          </div>
          <span className="text-[10px] text-slate-400 shrink-0">VittaBP v2.5 Prontuário</span>
        </div>
        
      {/* Dynamic Tabbed Bottom Navigation Bar (Fixed or static based on user setting) */}
      <nav 
        id="footer-navigation" 
        className={`${
          isFooterFixed 
            ? "fixed bottom-0 left-0 right-0 sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 z-50" 
            : "relative mt-10 mb-6 mx-auto w-[94%] border"
        } sm:w-fit sm:min-w-[580px] sm:max-w-2xl sm:rounded-2xl rounded-xl sm:shadow-lg sm:px-6 sm:border border-slate-150 bg-white/90 backdrop-blur-md py-1.5 shadow-[0_-4px_22px_rgba(30,41,59,0.06)] flex justify-around sm:justify-between items-center transition-all duration-300`}
      >
        <button
          onClick={() => {
            setActiveMobileTab('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col sm:flex-row items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
            activeMobileTab === 'dashboard' 
              ? "text-teal-600 bg-teal-50/50 font-bold" 
              : "text-slate-400 hover:text-slate-600 font-medium"
          }`}
        >
          <TrendingUp className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-1.5" />
          <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-0 font-medium">Métricas</span>
        </button>

        <button
          onClick={() => {
            setActiveMobileTab('adicionar');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col sm:flex-row items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
            activeMobileTab === 'adicionar' 
              ? "text-teal-600 bg-teal-50/50 font-bold" 
              : "text-slate-400 hover:text-slate-600 font-medium"
          }`}
        >
          <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-1.5" />
          <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-0 font-medium font-bold">Lançar</span>
        </button>

        <button
          onClick={() => {
            setActiveMobileTab('historico');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col sm:flex-row items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
            activeMobileTab === 'historico' 
              ? "text-teal-600 bg-teal-50/50 font-bold" 
              : "text-slate-400 hover:text-slate-600 font-medium"
          }`}
        >
          <Calendar className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-1.5" />
          <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-0 font-medium font-bold">Prontuário</span>
        </button>

        <button
          onClick={() => {
            setActiveMobileTab('mobile');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col sm:flex-row items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
            activeMobileTab === 'mobile' 
              ? "text-rose-600 bg-rose-50/50 font-bold font-black" 
              : "text-slate-400 hover:text-slate-600 font-medium"
          }`}
        >
          <Activity className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-1.5" />
          <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-0 font-medium">Vitta Workout</span>
        </button>

        <button
          onClick={() => {
            setActiveMobileTab('menu');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col sm:flex-row items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
            activeMobileTab === 'menu' 
              ? "text-indigo-600 bg-indigo-50/50 font-bold" 
              : "text-slate-400 hover:text-slate-600 font-medium"
          }`}
        >
          <Menu className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-1.5" />
          <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-0 font-medium tracking-tight">Menu</span>
        </button>
      </nav>

      {/* Export configured PDF Report Modal */}
      <ExportPDFModal
        isOpen={isExportPDFOpen}
        onClose={() => setIsExportPDFOpen(false)}
        bpReadings={bpReadings}
        glucoseReadings={glucoseReadings}
        weightReadings={weightReadings}
        profile={profile}
      />

      {/* Edit Reading Modal Overlay */}
      <EditReadingModal
        isOpen={isEditOpen}
        reading={editingReading}
        type={editingType}
        onSave={handleSaveEdit}
        onClose={() => {
          setIsEditOpen(false);
          setEditingReading(null);
        }}
      />

      {/* Safety confirmation dialog state for record deletion */}
      {deleteConfirmation && (
        <div id="delete-confirmation-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-150 w-full max-w-md overflow-hidden animate-slideUp p-5 sm:p-6 space-y-4">
            
            {/* Header with visual alert icon */}
            <div className="flex items-start space-x-3.5 pt-1 text-left">
              <div className="p-2 sm:p-3 bg-red-50 text-red-600 rounded-xl sm:rounded-2xl border border-red-100 shrink-0">
                <AlertOctagon className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight">Confirmar Exclusão</h3>
                <p className="text-[10px] sm:text-xs text-slate-500 leading-normal">
                  Você está prestes a remover permanentemente um registro de saúde do seu histórico. Essa ação não poderá ser desfeita.
                </p>
              </div>
            </div>

            {/* Inner Details Container */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-150 text-slate-800 space-y-2 text-left">
              <span className="block text-[9px] uppercase font-black text-slate-400 tracking-wider">Detalhes da Medição</span>
              
              <div className="flex items-center space-x-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                  deleteConfirmation.type === 'pressure' 
                    ? "bg-teal-50 text-teal-600 border border-teal-100" 
                    : "bg-amber-50 text-amber-500 border border-amber-100"
                }`}>
                  {deleteConfirmation.type === 'pressure' ? <Heart className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                </div>
                <div className="min-w-0">
                  <span className="block font-black text-xs sm:text-sm text-slate-850">{deleteConfirmation.valueText}</span>
                  <span className="block text-[10px] text-slate-500 leading-normal font-semibold">
                    {deleteConfirmation.secText}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-150 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-400 font-mono font-bold">
                <span>Registrado em:</span>
                <span>
                  {new Date(deleteConfirmation.measuredAt).toLocaleDateString('pt-BR')} {new Date(deleteConfirmation.measuredAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Warning Message */}
            <div className="text-[10px] sm:text-xs bg-red-50/50 p-2.5 rounded-lg border border-red-100/50 flex items-start gap-1.5 text-red-800 leading-normal text-left">
              <span className="font-extrabold text-sm leading-none shrink-0 mt-0.5">•</span>
              <span>Esta medição é importante para o monitoramento clínico. Ao apagar, as médias, tendências e relatórios PDF omitirão este dado histórico.</span>
            </div>

            {/* Action buttons with proper sizing and touch targets */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                className="w-1/2 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg sm:rounded-xl transition text-center select-none cursor-pointer"
              >
                Voltar / Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="w-1/2 py-2 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg sm:rounded-xl shadow-md shadow-red-600/10 transition text-center select-none cursor-pointer"
              >
                Remover Registro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {clearAllConfirmation && (
        <><div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-150 w-full max-w-md overflow-hidden animate-slideUp p-5 sm:p-6 space-y-4">
            
            <div className="flex items-start space-x-3.5 pt-1 text-left">
              <div className="p-2 sm:p-3 bg-red-50 text-red-600 rounded-xl sm:rounded-2xl border border-red-100 shrink-0">
                <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-800 tracking-tight">
                  Apagar TODOS os registros?
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1 leading-normal pr-4">
                  Esta ação é irreversível.
                </p>
              </div>
            </div>

            <div className="flex bg-rose-50 text-rose-700 p-3 sm:p-4 rounded-xl border border-rose-100 text-[10px] sm:text-xs">
              <span className="font-extrabold text-sm leading-none shrink-0 mt-0.5">•</span>
              <span>Todos os dados de pressão arterial, glicose e peso serão apagados permanentemente deste dispositivo e não poderão ser recuperados.</span>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setClearAllConfirmation(false)}
                className="w-1/2 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg sm:rounded-xl transition text-center select-none cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  handleClearAllData();
                  setClearAllConfirmation(false);
                }}
                className="w-1/2 py-2 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg sm:rounded-xl shadow-md shadow-red-600/10 transition text-center select-none cursor-pointer"
              >
                Apagar Tudo
              </button>
            </div>
          </div>
        </div></>
      )}
    </div>
    </div>
    </div>
    </>
  );
}
