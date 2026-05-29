import { useState, useEffect } from "react";
import { Server, Settings, Check, RefreshCw, AlertCircle, Database, ShieldAlert } from "lucide-react";
import { MySQLConfig as MySQLConfigType, SyncStatus, BloodPressureReading, GlucoseReading } from "../types";

interface MySQLConfigProps {
  config: MySQLConfigType;
  onUpdateConfig: (config: MySQLConfigType) => void;
  bpReadings: BloodPressureReading[];
  glucoseReadings: GlucoseReading[];
  onSyncComplete: (syncedBp: BloodPressureReading[], syncedGl: GlucoseReading[]) => void;
  currentUserEmail: string;
}

export default function MySQLConfig({
  config,
  onUpdateConfig,
  bpReadings,
  glucoseReadings,
  onSyncComplete,
  currentUserEmail
}: MySQLConfigProps) {
  const [host, setHost] = useState(config.host || "");
  const [port, setPort] = useState(config.port || 3306);
  const [database, setDatabase] = useState(config.database || "");
  const [user, setUser] = useState(config.user || "");
  const [password, setPassword] = useState(config.password || "");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setHost(config.host || "");
    setPort(config.port || 3306);
    setDatabase(config.database || "");
    setUser(config.user || "");
    setPassword(config.password || "");
  }, [config]);

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMsg, setTestMsg] = useState("");
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSyncAt: localStorage.getItem("smartbp_last_sync_at") || null,
    status: 'idle',
    errorMessage: null
  });

  const handleTestConnection = async () => {
    if (!host || !user || !database) {
      setTestStatus('error');
      setTestMsg("Por favor, preencha Host, Usuário e Banco de Dados para testar.");
      return;
    }

    setTestStatus('testing');
    setTestMsg("Conectando à sua VPS Privada...");

    try {
      const response = await fetch("/api/mysql/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host, port, user, password, database })
      });

      const data = await response.json();

      if (data.success) {
        setTestStatus('success');
        setTestMsg(data.message);
        onUpdateConfig({
          host,
          port,
          database,
          user,
          password,
          isConfigured: true
        });
      } else {
        setTestStatus('error');
        setTestMsg(data.message || "Erro desconhecido ao conectar com a VPS.");
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMsg(`Falha na API de teste: ${err.message || err}`);
    }
  };

  const handleSyncNow = async () => {
    if (!config.isConfigured) {
      setSyncStatus({ status: 'error', errorMessage: "Sincronização impossível: Configuração MySQL não ativa. Realize um teste de conexão com sucesso primeiro.", lastSyncAt: syncStatus.lastSyncAt });
      return;
    }

    setSyncStatus(prev => ({ ...prev, status: 'syncing', errorMessage: null }));

    try {
      const response = await fetch("/api/mysql/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          bpReadings,
          glucoseReadings,
          userId: currentUserEmail
        })
      });

      const data = await response.json();

      if (data.success) {
        const nowStr = new Date().toLocaleString("pt-BR");
        localStorage.setItem("smartbp_last_sync_at", nowStr);
        setSyncStatus({
          status: 'success',
          lastSyncAt: nowStr,
          errorMessage: null
        });
        onSyncComplete(data.bpReadings, data.glucoseReadings);
      } else {
        setSyncStatus(prev => ({
          ...prev,
          status: 'error',
          errorMessage: data.message || "Erro desconhecido durante o sync."
        }));
      }
    } catch (err: any) {
      setSyncStatus(prev => ({
        ...prev,
        status: 'error',
        errorMessage: `Falha na requisição de sincronização: ${err.message || err}`
      }));
    }
  };

  const handleSaveOnly = () => {
    onUpdateConfig({
      host,
      port,
      database,
      user,
      password,
      isConfigured: host && user && database ? true : false
    });
    setTestStatus('idle');
    setTestMsg("Configuração salva localmente. Faça 'Testar Conexão' para validar na VPS.");
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <Database className="w-5 h-5" id="mysql-icon" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm md:text-base">Sincronização VPS MySQL</h3>
            <p className="text-xs text-slate-500">Habilite o backup privado do seu aaPanel</p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition"
          title="Configurações do Banco de Dados"
        >
          <Settings className={`w-5 h-5 transition-transform duration-300 ${isOpen ? "rotate-90 text-teal-600" : ""}`} />
        </button>
      </div>

      {/* Succeeded Connection Status Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-slate-50 rounded-xl p-3 text-xs">
        <div className="flex items-center space-x-2">
          <div className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.isConfigured ? "bg-teal-400" : "bg-amber-400"}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${config.isConfigured ? "bg-teal-500" : "bg-amber-500"}`}></span>
          </div>
          <span className="font-medium text-slate-700">
            {config.isConfigured ? `Conectado a ${config.host}` : "Operando no modo 100% Local (Offline)"}
          </span>
        </div>

        {config.isConfigured && (
          <button
            onClick={handleSyncNow}
            disabled={syncStatus.status === 'syncing'}
            className="flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${syncStatus.status === 'syncing' ? "animate-spin" : ""}`} />
            <span>{syncStatus.status === 'syncing' ? "Sincronizando..." : "Sincronizar"}</span>
          </button>
        )}
      </div>

      {syncStatus.lastSyncAt && (
        <div className="mt-1.5 text-right text-[10px] text-slate-400">
          Último Backup: <span className="font-semibold">{syncStatus.lastSyncAt}</span>
        </div>
      )}

      {syncStatus.errorMessage && (
        <div className="mt-2.5 flex items-start space-x-1.5 bg-red-50 text-[11px] text-red-600 p-2.5 rounded-lg border border-red-100">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{syncStatus.errorMessage}</span>
        </div>
      )}

      {isOpen && (
        <div className="mt-5 pt-4 border-t border-slate-100 space-y-3.5 animate-fadeIn">
          <div className="bg-teal-50/50 rounded-xl p-3 border border-teal-100/60 flex items-start space-x-2">
            <Server className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-teal-800 leading-normal">
              Insira os dados do seu banco MySQL criado no <strong>aaPanel</strong> da sua VPS. O VittaBPlus criará de forma 100% autônoma duas tabelas otimizadas sem que você precise digitar código SQL.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Host / IP VPS *</label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="Ex: 198.51.100.42"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Porta MySQL</label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                placeholder="3306"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1 font-mono">Nome do Banco de Dados *</label>
              <input
                type="text"
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                placeholder="Ex: smartbp_db"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Usuário MySQL *</label>
              <input
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="Ex: smartbp_user"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Senha MySQL</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1.5">
            <button
              onClick={handleTestConnection}
              disabled={testStatus === 'testing'}
              className="flex-1 bg-teal-50 hover:bg-teal-100 disabled:opacity-50 text-teal-700 text-xs py-2 rounded-xl font-medium transition cursor-pointer"
            >
              {testStatus === 'testing' ? "Testando..." : "Testar Conexão e Auto-Configurar"}
            </button>
            <button
              onClick={handleSaveOnly}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs py-2 px-3 rounded-xl font-medium transition cursor-pointer"
            >
              Salvar
            </button>
          </div>

          {testMsg && (
            <div className={`text-[11px] p-3 rounded-xl border flex items-start space-x-2 ${
              testStatus === 'success' 
                ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                : testStatus === 'error'
                  ? "bg-rose-50 text-rose-800 border-rose-100"
                  : "bg-slate-50 text-slate-700 border-slate-100"
            }`}>
              {testStatus === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              )}
              <span className="leading-tight">{testMsg}</span>
            </div>
          )}

          {/* Instruction on how to enable remote connection in aaPanel */}
          <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100/60 space-y-1">
            <div className="flex items-center space-x-1">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <h4 className="text-[11px] font-semibold text-amber-800">Liberar VPS MySQL no aaPanel:</h4>
            </div>
            <ol className="list-decimal list-inside text-[10px] text-amber-700 space-y-0.5 leading-tight">
              <li>No aaPanel, acesse a aba <strong>Databases</strong>.</li>
              <li>Procure pelo seu Banco e mude a coluna <strong>Permission</strong> de <em>"Localhost"</em> para <em>"Everyone"</em> ou adicione o IP público.</li>
              <li>Verifique se o Firewall da VPS permite conexões externas na porta <strong>3306</strong>.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
