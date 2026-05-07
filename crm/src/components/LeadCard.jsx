import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Phone, Mail, Clock, CheckCircle, FileText } from 'lucide-react';

export default function LeadCard({ lead, index, onClick }) {
  const getPhaseStyles = (fase) => {
    switch (fase?.toLowerCase()) {
      case 'frio': return 'border-blue-400/50 bg-blue-50/10 hover:border-blue-500';
      case 'quente': return 'border-red-400/50 bg-red-50/10 hover:border-red-500';
      case 'em análise de crédito':
      case 'análise': return 'border-purple-400/50 bg-purple-50/10 hover:border-purple-500';
      case 'crédito aprovado':
      case 'aprovado': return 'border-emerald-400/50 bg-emerald-50/10 hover:border-emerald-500';
      default: return 'border-border hover:border-primary/50';
    }
  };

  const phaseStyles = getPhaseStyles(lead.fase_funil);

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(lead)}
          className={`p-4 mb-3 rounded-xl shadow-sm border-2 bg-card text-card-foreground transition-all duration-200 cursor-pointer hover:shadow-md group ${phaseStyles} ${
            snapshot.isDragging ? 'shadow-lg rotate-2 scale-105 z-50 ring-2 ring-primary/20' : ''
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{lead.nome}</h4>
            {lead.status === 'Novo' && (
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            )}
          </div>
          
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Phone className="w-3 h-3" />
              <span>{lead.telefone}</span>
            </div>
            {lead.origem && (
              <div className="flex items-center gap-2">
                <FileText className="w-3 h-3" />
                <span className="truncate">{lead.origem}</span>
              </div>
            )}
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5 text-gray-400">
                <Clock className="w-3 h-3" />
                <span>Hoje</span>
              </div>
              <div className="flex gap-1">
                {lead.fase_funil === 'Crédito Aprovado' && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
