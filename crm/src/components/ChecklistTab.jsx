import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, FileText, Clock, Upload, Download, Circle } from 'lucide-react';

const initialChecklists = {
  comprador: [
    { id: 'c1', label: 'RG/Passaporte ou CNH', status: 'enviado', fileName: 'rg_joao.pdf' },
    { id: 'c2', label: 'CPF e Certidão de Nascimento/Casamento', status: 'enviado', fileName: 'cpf_certidao.pdf' },
    { id: 'c3', label: 'Comprovante de Residência recente', status: 'pendente', fileName: null },
    { id: 'c4', label: 'Renda: Holerites (3 meses), Extrato e IR completo', status: 'pendente', fileName: null },
  ],
  vista: [
    { id: 'v1', label: 'Certidão de Inteiro Teor + Ônus e Condomínio', status: 'enviado', validityDays: 30, dateAdded: '2026-04-10', fileName: 'certidao_onus.pdf' },
    { id: 'v2', label: 'Matrícula Atualizada e Habite-se', status: 'pendente', validityDays: 30, fileName: null },
    { id: 'v3', label: 'Certidões de Distribuição (Cível, Trabalhista, Protesto...)', status: 'pendente', validityDays: 30, fileName: null },
    { id: 'v4', label: 'Comprovantes de Água, Energia e IPTU', status: 'pendente', fileName: null },
  ],
  financiamento: [
    { id: 'f1', label: 'Simulação e Escolha do Banco', status: 'enviado', fileName: 'simulacao_caixa.pdf' },
    { id: 'f2', label: 'Avaliação de Engenharia (Aprox. R$ 3.100)', status: 'pendente', fileName: null },
    { id: 'f3', label: 'Análise Jurídica e Assinatura (5 dias úteis)', status: 'pendente', fileName: null },
    { id: 'f4', label: 'Registro de Imóveis (15 dias úteis)', status: 'pendente', fileName: null },
  ]
};

export default function ChecklistTab({ lead }) {
  const [activeChecklist, setActiveChecklist] = useState('comprador');
  const [checklists, setChecklists] = useState(initialChecklists);

  const checkValidityAlert = (item) => {
    if (item.status !== 'enviado' || !item.validityDays || !item.dateAdded) return null;
    const added = new Date(item.dateAdded);
    const today = new Date('2026-05-03'); // Mocking current date based on context
    const diffTime = Math.abs(today - added);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    const remaining = item.validityDays - diffDays;
    
    if (remaining <= 5 && remaining >= 0) {
      return { type: 'warning', msg: `Vence em ${remaining} dias` };
    } else if (remaining < 0) {
      return { type: 'danger', msg: `Vencido há ${Math.abs(remaining)} dias` };
    }
    return { type: 'success', msg: `Válido por mais ${remaining} dias` };
  };

  const toggleStatus = (id) => {
    setChecklists(prev => {
      const next = { ...prev };
      const list = [...next[activeChecklist]];
      const index = list.findIndex(i => i.id === id);
      if(index > -1) {
        // Clone the item to avoid direct mutation
        const updatedItem = { ...list[index] };
        updatedItem.status = updatedItem.status === 'enviado' ? 'pendente' : 'enviado';
        list[index] = updatedItem;
        next[activeChecklist] = list;
      }
      return next;
    });
  };

  const handleFileUpload = (id, event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setChecklists(prev => {
      const next = { ...prev };
      const list = [...next[activeChecklist]];
      const index = list.findIndex(i => i.id === id);
      if(index > -1) {
        // Clone the item to avoid direct mutation
        const updatedItem = { ...list[index] };
        updatedItem.fileName = file.name;
        updatedItem.status = 'enviado';
        updatedItem.dateAdded = new Date().toISOString().split('T')[0];
        list[index] = updatedItem;
        next[activeChecklist] = list;
      }
      return next;
    });
  };

  const handleDownload = (fileName) => {
    // Simulação de download
    alert(`Iniciando download de: ${fileName}`);
  };

  return (
    <div className="space-y-6">
      {/* Menu do Checklist */}
      <div className="flex bg-secondary/50 p-1 rounded-lg">
        <button 
          onClick={() => setActiveChecklist('comprador')}
          className={`flex-1 text-sm font-medium py-2 px-3 rounded-md transition-all ${activeChecklist === 'comprador' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Comprador
        </button>
        <button 
          onClick={() => setActiveChecklist('vista')}
          className={`flex-1 text-sm font-medium py-2 px-3 rounded-md transition-all ${activeChecklist === 'vista' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          À Vista (30 Dias)
        </button>
        <button 
          onClick={() => setActiveChecklist('financiamento')}
          className={`flex-1 text-sm font-medium py-2 px-3 rounded-md transition-all ${activeChecklist === 'financiamento' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Financiamento Caixa
        </button>
      </div>

      {/* Lista de Itens */}
      <div className="space-y-3">
        {checklists[activeChecklist].map((item) => {
          const alert = checkValidityAlert(item);
          const isEnviado = item.status === 'enviado';
          
          return (
            <div key={item.id} className="flex flex-col gap-2 p-3 rounded-lg border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors group">
              <div className="flex items-start gap-3">
                <button type="button" onClick={() => toggleStatus(item.id)} className="mt-0.5 outline-none transition-transform hover:scale-110 active:scale-95">
                  {isEnviado ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  )}
                </button>
                <div className="flex-1">
                  <p className={`text-sm font-medium transition-colors ${isEnviado ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {item.label}
                  </p>
                  
                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm border ${isEnviado ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                      {isEnviado ? 'Enviado' : 'Pendente'}
                    </span>
                    
                    {alert && (
                      <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-sm border
                        ${alert.type === 'warning' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' : ''}
                        ${alert.type === 'danger' ? 'bg-destructive/10 text-destructive border-destructive/20' : ''}
                        ${alert.type === 'success' ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}
                      `}>
                        {alert.type === 'warning' && <AlertTriangle className="w-3 h-3" />}
                        {alert.type === 'danger' && <AlertTriangle className="w-3 h-3" />}
                        {alert.type === 'success' && <Clock className="w-3 h-3" />}
                        {alert.msg}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Ações de Documento (Upload / Download) */}
              <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border/50 pl-8">
                <div className="flex-1 flex items-center gap-1.5 overflow-hidden">
                  {item.fileName ? (
                    <>
                      <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-xs text-foreground truncate font-medium" title={item.fileName}>
                        {item.fileName}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground/50 italic">Nenhum arquivo anexado</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Botão Baixar (Sempre visível, mas desativado se não tiver arquivo) */}
                  <button 
                    type="button"
                    onClick={() => item.fileName && handleDownload(item.fileName)}
                    disabled={!item.fileName}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      item.fileName 
                        ? 'bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer' 
                        : 'bg-secondary/50 text-muted-foreground/40 cursor-not-allowed'
                    }`}
                    title={item.fileName ? "Baixar Documento" : "Nenhum documento para baixar"}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar
                  </button>
                  
                  {/* Botão Anexar (Sempre visível) */}
                  <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors shadow-sm" title={item.fileName ? "Substituir Arquivo" : "Fazer Upload"}>
                    <Upload className="w-3.5 h-3.5" />
                    Anexar
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => handleFileUpload(item.id, e)}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="pt-4 border-t border-border">
         <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary/10 text-primary font-semibold rounded-lg hover:bg-primary/20 transition-colors">
            <FileText className="w-4 h-4" />
            Adicionar Documento Extra
         </button>
      </div>
    </div>
  );
}
