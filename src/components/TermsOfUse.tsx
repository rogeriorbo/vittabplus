import React from 'react';
import { FileText, ArrowLeft, CheckCircle2, AlertCircle, Scale, ShieldCheck, HelpCircle } from 'lucide-react';

interface TermsOfUseProps {
  onBack: () => void;
}

export default function TermsOfUse({ onBack }: TermsOfUseProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-100 py-4.5 px-4 sm:px-6 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-400 rounded-lg flex items-center justify-center p-1.5 text-white shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-slate-950 text-base block leading-none">VittaBPlus</span>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-600 block mt-0.5">Termos de Uso</span>
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
              Contrato de Uso e <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-teal-600">Responsabilidade Médica.</span>
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xl mx-auto">
              Ao utilizar o VittaBPlus, você concorda em seguir estas diretrizes para garantir uma experiência segura e eficaz no monitoramento da sua saúde.
            </p>
          </section>

          <hr className="border-slate-100" />

          {/* Policy Content */}
          <div className="space-y-10">
            <section className="space-y-4">
              <div className="flex items-center space-x-3 text-indigo-600">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h2 className="text-lg font-black text-slate-800">1. Isenção de Responsabilidade Médica</h2>
              </div>
              <div className="text-sm text-slate-600 leading-relaxed space-y-4 p-5 bg-amber-50/50 rounded-2xl border border-amber-100">
                <p className="font-bold text-amber-900">
                  CRÍTICO: O VittaBPlus NÃO é um dispositivo médico nem um substituto para aconselhamento médico profissional.
                </p>
                <ul className="list-disc pl-5 space-y-2 marker:text-amber-500">
                  <li>Todas as análises geradas pelo "Laudo IA" são baseadas em padrões estatísticos e diretrizes gerais de saúde.</li>
                  <li><strong>Nunca</strong> altere sua medicação ou tratamento com base apenas nas informações deste aplicativo sem consultar seu médico.</li>
                  <li>Em caso de emergência (dor no peito, falta de ar, pressão extremamente alta/baixa), procure imediatamente um pronto-socorro.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center space-x-3 text-indigo-600">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <h2 className="text-lg font-black text-slate-800">2. Uso Aceitável</h2>
              </div>
              <div className="text-sm text-slate-600 leading-relaxed space-y-3">
                <p>
                  O usuário compromete-se a:
                </p>
                <ul className="list-disc pl-5 space-y-2 marker:text-indigo-500">
                  <li>Fornecer dados reais e precisos para o cálculo correto dos indicadores.</li>
                  <li>Não utilizar o serviço para fins ilícitos ou que comprometam a integridade da plataforma.</li>
                  <li>Manter suas credenciais de login em segurança, sendo responsável por todas as atividades em sua conta.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center space-x-3 text-indigo-600">
                <Scale className="w-5 h-5 shrink-0" />
                <h2 className="text-lg font-black text-slate-800">3. Propriedade Intelectual</h2>
              </div>
              <div className="text-sm text-slate-600 leading-relaxed space-y-3">
                <p>
                  O design, marca e algoritmos do VittaBPlus são de propriedade exclusiva da <strong>Déio Informática</strong>. O uso comercial não autorizado do software é estritamente proibido.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center space-x-3 text-indigo-600">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <h2 className="text-lg font-black text-slate-800">4. Modificações e Interrupções</h2>
              </div>
              <div className="text-sm text-slate-600 leading-relaxed space-y-3">
                <p>
                  Reservamo-nos o direito de atualizar as funcionalidades para melhorar a precisão clínica e segurança. Eventuais interrupções para manutenção serão comunicadas sempre que possível.
                </p>
              </div>
            </section>

            <section className="space-y-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="flex items-center space-x-3 text-slate-600">
                <HelpCircle className="w-5 h-5 shrink-0" />
                <h2 className="text-base font-black text-slate-800">Dúvidas?</h2>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Se você tiver qualquer dúvida sobre estes termos, entre em contato via nosso Suporte WhatsApp ou através do site oficial da Déio Informática.
              </p>
            </section>
          </div>

          <div className="pt-10 flex flex-col items-center space-y-6 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Versão 1.0 - Junho 2026
            </div>
            <button 
              onClick={onBack}
              className="py-3 px-10 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition duration-200 shadow-lg shadow-slate-200 active:scale-95"
            >
              Li e Aceito os Termos
            </button>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-100 py-10 px-4 mt-auto">
        <div className="max-w-4xl mx-auto text-center space-y-2">
          <p className="text-[11px] text-slate-400 font-bold">
            &copy; {new Date().getFullYear()} VittaBPlus Diário Preventivo - Déio Informática.
          </p>
          <p className="text-[10px] text-slate-350 italic">
            Monitoramento preventivo inteligente.
          </p>
        </div>
      </footer>
    </div>
  );
}
