import React, { useState } from 'react';
import { UserPlus, Search, Filter } from 'lucide-react';

const mockLeads = [
  { id: '1', nome: 'João Silva', telefone: '***********', origem: 'Site', fase: 'Frio', corretor_id: null },
  { id: '2', nome: 'Maria Souza', telefone: '***********', origem: 'WhatsApp', fase: 'Morno', corretor_id: 'c1' },
  { id: '3', nome: 'Carlos Mendes', telefone: '79999999999', origem: 'Instagram', fase: 'Quente', corretor_id: null },
  { id: '4', nome: 'Ana Costa', telefone: '***********', origem: 'Indicação', fase: 'Análise', corretor_id: 'c2' },
];

const mockCorretores = [
  { id: 'me', nome: 'Atribuir para Mim (Admin)' },
  { id: 'c1', nome: 'Corretor Bruno' },
  { id: 'c2', nome: 'Corretora Letícia' },
];

export default function LeadsPage() {
  const [leads, setLeads] = useState(mockLeads);

  const handleAssign = (leadId, novoCorretorId) => {
    setLeads(leads.map(lead => 
      lead.id === leadId ? { ...lead, corretor_id: novoCorretorId } : lead
    ));
    // Aqui chamaria a API do Supabase no futuro
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Leads & Contatos</h2>
          <p className="text-muted-foreground">Gerencie a distribuição e atribuição de leads para a equipe.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg shadow-sm hover:bg-secondary/50 transition-colors">
            <Filter className="w-4 h-4" /> Filtros
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-sm hover:bg-primary/90 transition-colors font-medium">
            <UserPlus className="w-4 h-4" /> Importar Leads
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-secondary/30 flex items-center gap-4">
           <div className="relative flex-1 max-w-md">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
             <input type="text" placeholder="Buscar por nome, origem ou fase..." className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
           </div>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-semibold">Nome do Lead</th>
                <th className="px-6 py-4 font-semibold">Telefone</th>
                <th className="px-6 py-4 font-semibold">Fase do Funil</th>
                <th className="px-6 py-4 font-semibold">Origem</th>
                <th className="px-6 py-4 font-semibold">Atribuição (Corretor)</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                  <td className="px-6 py-4 font-medium">{lead.nome}</td>
                  <td className="px-6 py-4 text-muted-foreground">{lead.telefone}</td>
                  <td className="px-6 py-4">
                    <span className="bg-secondary px-2.5 py-1 rounded-full text-xs font-medium border border-border/50">
                      {lead.fase}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{lead.origem}</td>
                  <td className="px-6 py-4">
                    <select 
                      value={lead.corretor_id || ''} 
                      onChange={(e) => handleAssign(lead.id, e.target.value)}
                      className={`w-full max-w-[200px] border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer ${lead.corretor_id ? 'bg-primary/5 border-primary/30 text-primary font-medium' : 'bg-background border-border text-muted-foreground'}`}
                    >
                      <option value="" disabled>Roleta (Não atribuído)</option>
                      {mockCorretores.map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
