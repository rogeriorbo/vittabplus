import React from 'react';
import { BookOpen, ArrowLeft, Activity, Heart, Info, CheckCircle2, AlertTriangle, Stethoscope } from 'lucide-react';

interface WHOGuidelinesProps {
  onBack: () => void;
}

export default function WHOGuidelines({ onBack }: WHOGuidelinesProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-100 py-4.5 px-4 sm:px-6 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 bg-gradient-to-tr from-sky-500 to-blue-400 rounded-lg flex items-center justify-center p-1.5 text-white shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-slate-950 text-base block leading-none">VittaBP</span>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-sky-600 block mt-0.5">Diretrizes da OMS</span>
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

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 md:py-16">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 md:p-12 space-y-12">
          
          {/* Hero Section */}
          <section className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Stethoscope className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Padrões Globais de <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-600">Saúde Cardiovascular.</span>
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed max-w-2xl mx-auto">
              O VittaBP utiliza como referência os parâmetros estabelecidos pela Organização Mundial da Saúde (OMS) e pela Sociedade Brasileira de Cardiologia (SBC) para classificar seus registros.
            </p>
          </section>

          <hr className="border-slate-100" />

          {/* Blood Pressure Standards */}
          <section className="space-y-6">
            <div className="flex items-center space-x-3 text-blue-600">
              <Activity className="w-6 h-6 shrink-0" />
              <h2 className="text-xl font-black text-slate-800">Pressão Arterial (Adultos)</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Normal</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 leading-tight">120 / 80</h4>
                  <p className="text-[11px] text-slate-500 mt-1">mmHg ou inferior.</p>
                </div>
                <p className="text-[10px] text-emerald-600 font-bold mt-4">Ideal para saúde do coração e longevidade.</p>
              </div>

              <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Pré-Hipertensão</span>
                    <Info className="w-4 h-4 text-amber-500" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 leading-tight">130-139 / 85-89</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Nível de atenção.</p>
                </div>
                <p className="text-[10px] text-amber-600 font-bold mt-4">Ponto de mudança de hábitos e monitoramento diário.</p>
              </div>

              <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Hipertensão</span>
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                  </div>
                  <h4 className="text-xl font-bold text-rose-900 leading-tight">≥ 140 / 90</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Estágios 1 e 2.</p>
                </div>
                <p className="text-[10px] text-rose-600 font-bold mt-4 font-black">REQUER ACOMPANHAMENTO MÉDICO IMEDIATO.</p>
              </div>
            </div>
          </section>

          {/* Heart Rate */}
          <section className="space-y-6">
            <div className="flex items-center space-x-3 text-rose-500">
              <Heart className="w-6 h-6 shrink-0" />
              <h2 className="text-xl font-black text-slate-800">Frequência Cardíaca (Repouso)</h2>
            </div>
            
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-3 flex-1">
                  <h3 className="text-lg font-bold text-slate-900">Adulto Saudável</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    A variação normal para um adulto em repouso absoluto é entre <strong>60 a 100 batimentos por minuto (bpm)</strong>. Atletas e pessoas com alto condicionamento físico podem apresentar entre 40 a 60 bpm sem riscos.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center min-w-[160px]">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Média Ideal</span>
                  <span className="text-4xl font-black text-slate-900 tabular-nums">72</span>
                  <span className="text-xs font-bold text-slate-400 block mt-1">BPM</span>
                </div>
              </div>
            </div>
          </section>

          {/* WHO Facts */}
          <section className="space-y-6">
            <div className="flex items-center space-x-3 text-sky-600">
              <Info className="w-6 h-6 shrink-0" />
              <h2 className="text-xl font-black text-slate-800">Fatos Relevantes da OMS</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-4 p-5 rounded-2xl hover:bg-slate-50 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <span className="font-black text-sm">01</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Silenciosa e Perigosa</h4>
                  <p className="text-sm text-slate-500 mt-1">A hipertensão costuma ser assintomática por anos. O monitoramento domiciliar regular é a melhor arma de prevenção.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-5 rounded-2xl hover:bg-slate-50 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <span className="font-black text-sm">02</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Redução de Sódio</h4>
                  <p className="text-sm text-slate-500 mt-1">A OMS recomenda o consumo de menos de 5g de sal por dia para reduzir o risco de doenças cardiovasculares.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-5 rounded-2xl hover:bg-slate-50 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <span className="font-black text-sm">03</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Atividade Física</h4>
                  <p className="text-sm text-slate-500 mt-1">Pelo menos 150-300 minutos de atividade aeróbica moderada por semana são essenciais para a saúde preventiva.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="p-8 bg-blue-900 border border-blue-950 rounded-[2rem] text-white flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-blue-100">
             <div className="space-y-2 text-center md:text-left">
                <h3 className="text-xl font-black">Precisa de Análise?</h3>
                <p className="text-blue-200 text-sm">Use nossa ferramenta de Laudo IA para correlacionar seus dados com estes padrões automaticamente.</p>
             </div>
             <button 
              onClick={onBack}
              className="bg-white text-blue-900 px-8 py-3 rounded-2xl font-black text-xs hover:bg-blue-50 transition-colors shadow-lg active:scale-95 shrink-0"
             >
                VOLTAR AO PAINEL
             </button>
          </section>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-100 py-10 px-4 mt-auto">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <p className="text-[11px] text-slate-400 font-bold">
            &copy; {new Date().getFullYear()} VittaBP Diário Preventivo - Déio Informática.
          </p>
          <p className="text-[10px] text-slate-350 max-w-md mx-auto leading-relaxed">
            As informações aqui contidas são apenas para fins educacionais e baseiam-se em publicações oficiais da OMS (WHO). Consulte sempre seu médico de confiança.
          </p>
        </div>
      </footer>
    </div>
  );
}
