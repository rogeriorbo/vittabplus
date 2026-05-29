import React, { useState } from 'react';
import { AppUser } from '../types';
import { 
  Heart, 
  Activity, 
  ShieldCheck, 
  FileText, 
  Database, 
  Sparkles, 
  Lock, 
  Mail, 
  User, 
  Calendar, 
  ArrowRight,
  Eye,
  EyeOff,
  UserCheck,
  MessageCircle
} from 'lucide-react';

interface LandingPageProps {
  onLogin: (email: string, password: string) => Promise<void> | void;
  onRegister: (user: AppUser) => Promise<void> | void;
  onDemoSignIn: () => void;
  onShowPrivacy: () => void;
  onShowTerms: () => void;
  onShowWHO: () => void;
  authLoading?: boolean;
}

export default function LandingPage({ onLogin, onRegister, onDemoSignIn, onShowPrivacy, onShowTerms, onShowWHO, authLoading = false }: LandingPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Login inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register inputs
  const [regName, setRegName] = useState('');
  const [regSurname, setRegSurname] = useState('');
  const [regBirthDate, setRegBirthDate] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regHeight, setRegHeight] = useState('');
  const [regWeight, setRegWeight] = useState('');

  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (mode === 'login') {
      if (!loginEmail || !loginPassword) {
        setFormError('Por favor, preencha todos os campos.');
        return;
      }
      try {
        await onLogin(loginEmail, loginPassword);
      } catch (err: any) {
        setFormError(err.message || 'Falha ao entrar na conta.');
      }
    } else {
      if (!regName || !regSurname || !regBirthDate || !regEmail || !regPassword) {
        setFormError('Por favor, preencha todos os campos obrigatórios.');
        return;
      }
      try {
        await onRegister({
          id: 'u-' + Date.now(),
          name: regName,
          surname: regSurname,
          birthDate: regBirthDate,
          email: regEmail,
          password: regPassword,
          height: regHeight ? Number(regHeight) : undefined,
          weight: regWeight ? Number(regWeight) : undefined,
        });
      } catch (err: any) {
        setFormError(err.message || 'Falha ao criar conta.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans selection:bg-teal-500 selection:text-slate-950">
      
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-100 py-4.5 px-4 sm:px-6 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-tr from-teal-600 to-emerald-500 rounded-xl flex items-center justify-center p-2 text-white shadow-sm">
              <Heart className="w-4.5 h-4.5 md:w-5 md:h-5 animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-slate-950 text-base md:text-lg block leading-none">VittaBPlus</span>
              <span className="text-[8px] md:text-[9px] uppercase tracking-wider font-extrabold text-teal-600 block mt-0.5">Prontuário Preventivo</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
          </div>
        </div>
      </header>

      {/* Main Content Arena */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 md:py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-14 items-center">
        
        {/* Left Hand: Product Pitch & Presentation */}
        <div className="lg:col-span-7 space-y-6 md:space-y-8 flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="space-y-2 md:space-y-3">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight">
              <span className="text-teal-600">VittaBPlus:</span> Seu diário clínico e <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-indigo-600">prontuário preventivo</span> inteligente.
            </h1>
            
            <p className="text-sm md:text-base text-slate-500 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Monitore de forma ágil e interativa sinais vitais como pressão arterial e glicemia, com laudos preventivos enriquecidos com IA do Google Gemini.
            </p>
          </div>

          {/* Core App Feature Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-start space-x-3.5 text-left">
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-800 tracking-tight">Monitoramento Vital</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">Pressão Arterial e Glicemia integrados em uma linha do tempo intuitiva.</p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-start space-x-3.5 text-left">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-800 tracking-tight">Laudos com IA</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">Avaliações automatizadas baseadas nas diretrizes clínicas da OMS.</p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-start space-x-3.5 text-left">
              <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-800 tracking-tight">Relatórios PDF</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">Exporte seu prontuário clínico completo para apresentar em consultas médicas.</p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-start space-x-3.5 text-left">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-800 tracking-tight">Privacidade Total</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">Seus dados são armazenados localmente e protegidos conforme a LGPD.</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-200/60 pt-5 w-full flex justify-center lg:justify-start">
            <div className="flex items-center space-x-5 text-slate-400 text-xs">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4.5 h-4.5 text-teal-500" />
                <span>Compatível com LGPD</span>
              </div>
              <div>•</div>
              <div>Versão Clinica v2.5</div>
            </div>
          </div>
        </div>

        {/* Right Hand: Embedded Login / Register Form Card */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2.5xl border border-slate-200/80 shadow-xl p-6 md:p-8 space-y-6">
            
            <div className="space-y-1 text-center">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {mode === 'login' ? 'Bem-vindo ao VittaBPlus' : 'Sua Nova Ficha Clínica'}
              </h2>
              <p className="text-xs text-slate-400">
                {mode === 'login' 
                  ? 'Acesse seu prontuário ou crie um novo cadastro' 
                  : 'Preencha seus parâmetros básicos para começar'
                }
              </p>
            </div>

            {/* Embedded Switcher Header */}
            <div className="p-1 bg-slate-50 border border-slate-100 rounded-xl grid grid-cols-2 gap-1 overflow-hidden">
              <button
                type="button"
                onClick={() => { setMode('login'); setFormError(''); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'login' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Acessar Minha Conta
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setFormError(''); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'register' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Criar Nova Ficha
              </button>
            </div>

            {formError && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold">
                {formError}
              </div>
            )}

            {/* Real Submission Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' ? (
                // Full registration context
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Primeiro Nome</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Ex: João" 
                          value={regName} 
                          onChange={e => setRegName(e.target.value)} 
                          required 
                          className="w-full text-xs p-3.5 pl-10 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none" 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Sobrenome</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Silva" 
                        value={regSurname} 
                        onChange={e => setRegSurname(e.target.value)} 
                        required 
                        className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Data de Nascimento</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="date" 
                        value={regBirthDate} 
                        onChange={e => setRegBirthDate(e.target.value)} 
                        required 
                        className="w-full text-xs p-3.5 pl-10 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Altura (cm)</label>
                      <input 
                        type="number" 
                        placeholder="Ex: 175" 
                        value={regHeight} 
                        onChange={e => setRegHeight(e.target.value)} 
                        className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none" 
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Peso Inicial (kg)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        placeholder="Ex: 78.5" 
                        value={regWeight} 
                        onChange={e => setRegWeight(e.target.value)} 
                        className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Seu E-mail Clínico</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="email" 
                        placeholder="Ex: joao@gmail.com" 
                        value={regEmail} 
                        onChange={e => setRegEmail(e.target.value)} 
                        required 
                        className="w-full text-xs p-3.5 pl-10 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Definir Senha de Acesso</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        value={regPassword} 
                        onChange={e => setRegPassword(e.target.value)} 
                        required 
                        className="w-full text-xs p-3.5 pl-10 pr-10 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Login credentials inputs only
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Seu E-mail Cadastrado</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="email" 
                        placeholder="Ex: joao@gmail.com" 
                        value={loginEmail} 
                        onChange={e => setLoginEmail(e.target.value)} 
                        required 
                        className="w-full text-xs p-3.5 pl-10 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none animate-fadeIn" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Senha de Segurança</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        value={loginPassword} 
                        onChange={e => setLoginPassword(e.target.value)} 
                        required 
                        className="w-full text-xs p-3.5 pl-10 pr-10 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Trigger Actions */}
              <button 
                type="submit" 
                disabled={authLoading}
                className={`w-full py-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold cursor-pointer transition-all flex items-center justify-center space-x-2 text-xs uppercase tracking-wider relative group ${
                  authLoading ? 'opacity-80 cursor-wait' : ''
                }`}
              >
                {authLoading ? (
                  <span>Carregando...</span>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Acessar Meu Prontuário' : 'Concluir Cadastro Clínico'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-all" />
                  </>
                )}
              </button>
            </form>

            <div className="relative flex py-2 items-center text-[10px] text-slate-350 uppercase select-none font-bold">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-3">Acesso sem Conta</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <button 
              type="button"
              onClick={onDemoSignIn}
              className="w-full py-3 bg-slate-50 hover:bg-slate-100/80 text-slate-700 font-bold border border-slate-150 rounded-xl text-xs transition duration-150"
            >
              Usar Demonstração do Diário (Bypass)
            </button>

            <a 
              href="https://wa.me/5521979776578" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition duration-150 flex items-center justify-center space-x-2 shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Suporte via WhatsApp</span>
            </a>
          </div>
        </div>
      </main>

      {/* Elegant minimalist clinical footer */}
      <footer className="bg-white border-t border-slate-100 py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-400 space-y-3.5 md:space-y-0">
          <div>
            <span>&copy; {new Date().getFullYear()} VittaBPlus Diário Preventivo - <a href="http://www.deioinfo.com.br" target="_blank" rel="noopener noreferrer" className="font-bold border-b border-dotted border-slate-300 hover:text-teal-600 hover:border-teal-400 transition-colors uppercase pr-1">Déio Informática</a>.</span>
          </div>
          <div className="flex space-x-4">
            <span 
              onClick={onShowPrivacy}
              className="hover:text-slate-600 transition cursor-pointer"
            >
              Privacidade
            </span>
            <span>•</span>
            <span 
              onClick={onShowTerms}
              className="hover:text-slate-600 transition cursor-pointer"
            >
              Termos de Uso
            </span>
            <span>•</span>
            <span 
              onClick={onShowWHO}
              className="hover:text-slate-600 transition cursor-pointer"
            >
              Diretrizes da OMS
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
