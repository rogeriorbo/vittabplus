import React, { useState } from 'react';
import { AppUser } from '../types';
import { Eye, EyeOff, Lock, User, Mail, Calendar } from 'lucide-react';

interface AuthModalProps {
  onLogin: (email: string, password: string) => void;
  onRegister: (user: AppUser) => void;
  isOpen: boolean;
}

export default function AuthModal({ onLogin, onRegister, isOpen }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // State for login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // State for registration
  const [regName, setRegName] = useState('');
  const [regSurname, setRegSurname] = useState('');
  const [regBirthDate, setRegBirthDate] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regHeight, setRegHeight] = useState('');
  const [regWeight, setRegWeight] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      onLogin(loginEmail, loginPassword);
    } else {
      onRegister({
        id: 'u-' + Date.now(),
        name: regName,
        surname: regSurname,
        birthDate: regBirthDate,
        email: regEmail,
        password: regPassword,
        height: regHeight ? Number(regHeight) : undefined,
        weight: regWeight ? Number(regWeight) : undefined,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 animate-fadeIn">
        <h2 className="text-2xl font-black text-slate-900 mb-6">
          {mode === 'login' ? 'Acessar Conta' : 'Criar Conta'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Nome" value={regName} onChange={e => setRegName(e.target.value)} required className="w-full p-3 border rounded-xl" />
                <input type="text" placeholder="Sobrenome" value={regSurname} onChange={e => setRegSurname(e.target.value)} required className="w-full p-3 border rounded-xl" />
              </div>
              <input type="date" value={regBirthDate} onChange={e => setRegBirthDate(e.target.value)} required className="w-full p-3 border rounded-xl" />
              <input type="text" placeholder="Altura (cm - opcional)" value={regHeight} onChange={e => setRegHeight(e.target.value)} className="w-full p-3 border rounded-xl" />
              <input type="text" placeholder="Peso (kg - opcional)" value={regWeight} onChange={e => setRegWeight(e.target.value)} className="w-full p-3 border rounded-xl" />
            </>
          )}
          
          <input type="email" placeholder="E-mail" value={mode === 'login' ? loginEmail : regEmail} onChange={e => mode === 'login' ? setLoginEmail(e.target.value) : setRegEmail(e.target.value)} required className="w-full p-3 border rounded-xl" />
          <input type="password" placeholder="Senha" value={mode === 'login' ? loginPassword : regPassword} onChange={e => mode === 'login' ? setLoginPassword(e.target.value) : setRegPassword(e.target.value)} required className="w-full p-3 border rounded-xl" />
          
          <button type="submit" className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer">
            {mode === 'login' ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>
        
        <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="w-full mt-4 text-slate-500 hover:text-slate-800 text-sm">
          {mode === 'login' ? 'Não tem conta? Cadastrar' : 'Já tem conta? Entrar'}
        </button>
      </div>
    </div>
  );
}
