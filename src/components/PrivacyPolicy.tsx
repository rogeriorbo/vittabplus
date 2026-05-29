import React from 'react';
import { Shield, ArrowLeft, Lock, Eye, FileText, Database, Heart } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-100 py-4.5 px-4 sm:px-6 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-lg flex items-center justify-center p-1.5 text-white shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-slate-950 text-base block leading-none">VittaBP</span>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-teal-600 block mt-0.5">Políticas de Privacidade</span>
            </div>
          </div>
          
          <button 
            onClick={onBack}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-all border border-slate-200 flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            <span>Voltar</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 md:py-16">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 md:p-12 space-y-10">
          
          {/* Hero Section */}
          <section className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Sua privacidade é <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-indigo-600">nosso compromisso vital.</span>
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xl mx-auto">
              Nós entendemos a sensibilidade dos seus dados de saúde. Por isso, construímos o VittaBP com transparência e segurança desde o primeiro código.
            </p>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black border border-emerald-100">
              <Lock className="w-3 h-3" />
              <span>COMPATÍVEL COM LGPD (LEI GERAL DE PROTEÇÃO DE DADOS)</span>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Policy Content */}
          <div className="space-y-10">
            <section className="space-y-4">
              <div className="flex items-center space-x-3 text-teal-600">
                <Database className="w-5 h-5 shrink-0" />
                <h2 className="text-lg font-black text-slate-800">1. Quais dados coletamos?</h2>
              </div>
              <div className="text-sm text-slate-600 leading-relaxed space-y-3">
                <p>
                  O VittaBP coleta exclusivamente os dados necessários para o monitoramento clínico preventivo, incluindo:
                </p>
                <ul className="list-disc pl-5 space-y-2 marker:text-teal-500">
                  <li><strong>Informações de Cadastro:</strong> Nome, sobrenome, data de nascimento e e-mail.</li>
                  <li><strong>Parâmetros de Saúde:</strong> Pressão arterial (sistólica/diastólica), batimentos cardíacos (pulso), níveis de glicemia e peso corporal.</li>
                  <li><strong>Configurações Locais:</strong> Preferências de visualização e lembretes de hábitos.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center space-x-3 text-teal-600">
                <Shield className="w-5 h-5 shrink-0" />
                <h2 className="text-lg font-black text-slate-800">2. Como protegemos seus dados?</h2>
              </div>
              <div className="text-sm text-slate-600 leading-relaxed space-y-3">
                <p>
                  Adotamos medidas rigorosas de segurança, incluindo:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-teal-600" />
                      Criptografia de Sessão
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1">Os dados trafegam de forma segura entre seu navegador e nossos servidores através de protocolos SSL/TLS.</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-teal-600" />
                      Banco de Dados Isolado
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1">Os usuários podem optar pela sincronização em VPS própria via aaPanel, garantindo controle total sobre o armazenamento.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center space-x-3 text-teal-600">
                <Eye className="w-5 h-5 shrink-0" />
                <h2 className="text-lg font-black text-slate-800">3. Transparência no Uso (IA)</h2>
              </div>
              <div className="text-sm text-slate-600 leading-relaxed space-y-3">
                <p>
                  Quando você utiliza a ferramenta de "Laudo IA", enviamos apenas os parâmetros clínicos anonimizados (sem seu nome ou e-mail vinculado) para a API do Google Gemini para processamento da análise preventiva baseada em diretrizes médicas.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center space-x-3 text-teal-600">
                <FileText className="w-5 h-5 shrink-0" />
                <h2 className="text-lg font-black text-slate-800">4. Compartilhamento e Direitos</h2>
              </div>
              <div className="text-sm text-slate-600 leading-relaxed space-y-3">
                <p>
                  Você tem o direito total sobre seus dados:
                </p>
                <ul className="list-disc pl-5 space-y-2 marker:text-teal-500">
                  <li><strong>Acesso e Retificação:</strong> Você pode visualizar e editar seus registros a qualquer momento.</li>
                  <li><strong>Portabilidade:</strong> Você pode exportar seu histórico completo em PDF ou CSV para consultas médicas.</li>
                  <li><strong>Exclusão:</strong> Você tem o poder de apagar todos os seus registros de forma irreversível diretamente pelo painel de configurações.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4 p-6 bg-teal-50/30 rounded-3xl border border-teal-100/50">
              <div className="flex items-center space-x-3 text-teal-600">
                <Heart className="w-5 h-5 shrink-0" />
                <h2 className="text-base font-black text-slate-800 text-teal-800">Compromisso Ético</h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed italic">
                "Não comercializamos dados de saúde. O VittaBP nasceu para ser uma ferramenta de empoderamento do paciente e suporte à medicina preventiva, não um produto de extração de dados."
              </p>
            </section>
          </div>

          <div className="pt-10 flex flex-col items-center space-y-6 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Última atualização: Junho 2026
            </div>
            <button 
              onClick={onBack}
              className="py-3 px-10 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition duration-200 shadow-lg shadow-slate-200 active:scale-95"
            >
              Ok, entendi. Retornar ao site.
            </button>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-100 py-10 px-4 mt-auto">
        <div className="max-w-4xl mx-auto text-center space-y-2">
          <p className="text-[11px] text-slate-400 font-bold">
            &copy; {new Date().getFullYear()} VittaBP Diário Preventivo - Déio Informática.
          </p>
          <p className="text-[10px] text-slate-350">
            Dúvidas sobre sua segurança? Entre em contato com nosso suporte especializado.
          </p>
        </div>
      </footer>
    </div>
  );
}
