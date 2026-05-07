import React, { useState } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import LeadCard from './LeadCard';

const initialData = {
  columns: {
    'col-frio': { id: 'col-frio', title: 'Lead Frio', leadIds: ['lead-1', 'lead-2'] },
    'col-quente': { id: 'col-quente', title: 'Lead Quente', leadIds: ['lead-3'] },
    'col-analise': { id: 'col-analise', title: 'Em Análise de Crédito', leadIds: [] },
    'col-aprovado': { id: 'col-aprovado', title: 'Crédito Aprovado', leadIds: [] },
  },
  leads: {
    'lead-1': { id: 'lead-1', nome: 'João Silva', telefone: '***********', origem: 'Site', status: 'Novo', fase_funil: 'Frio' },
    'lead-2': { id: 'lead-2', nome: 'Maria Souza', telefone: '***********', origem: 'WhatsApp', status: 'Em Atendimento', fase_funil: 'Frio' },
    'lead-3': { id: 'lead-3', nome: 'Carlos Mendes', telefone: '79999999999', origem: 'Site', status: 'Em Atendimento', fase_funil: 'Quente' },
  },
  columnOrder: ['col-frio', 'col-quente', 'col-analise', 'col-aprovado'],
};

const colorMap = {
  'col-frio': 'border-blue-500 text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30',
  'col-quente': 'border-red-500 text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/30',
  'col-analise': 'border-purple-500 text-purple-700 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/30',
  'col-aprovado': 'border-emerald-500 text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30'
};

export default function KanbanBoard({ onLeadClick }) {
  const [data, setData] = useState(initialData);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const start = data.columns[source.droppableId];
    const finish = data.columns[destination.droppableId];

    if (start === finish) {
      const newLeadIds = Array.from(start.leadIds);
      newLeadIds.splice(source.index, 1);
      newLeadIds.splice(destination.index, 0, draggableId);

      const newColumn = { ...start, leadIds: newLeadIds };
      setData({ ...data, columns: { ...data.columns, [newColumn.id]: newColumn } });
      return;
    }

    // Moving between columns
    const startLeadIds = Array.from(start.leadIds);
    startLeadIds.splice(source.index, 1);
    const newStart = { ...start, leadIds: startLeadIds };

    const finishLeadIds = Array.from(finish.leadIds);
    finishLeadIds.splice(destination.index, 0, draggableId);
    const newFinish = { ...finish, leadIds: finishLeadIds };

    setData({
      ...data,
      columns: { ...data.columns, [newStart.id]: newStart, [newFinish.id]: newFinish },
    });
  };

  return (
    <div className="flex h-full gap-6 overflow-x-auto pb-4 pt-2 px-2 snap-x">
      <DragDropContext onDragEnd={onDragEnd}>
        {data.columnOrder.map((columnId) => {
          const column = data.columns[columnId];
          const leads = column.leadIds.map((leadId) => data.leads[leadId]);
          const themeClasses = colorMap[column.id] || '';

          return (
            <div key={column.id} className="flex flex-col min-w-[320px] max-w-[320px] bg-secondary/30 rounded-xl overflow-hidden border border-border/50 snap-center shadow-sm">
              <div className={`p-4 border-b border-t-4 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between ${themeClasses}`}>
                <h3 className="font-semibold">{column.title}</h3>
                <span className="text-xs font-bold bg-background/80 px-2.5 py-1 rounded-full shadow-sm border border-border/50">
                  {leads.length}
                </span>
              </div>
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-3 overflow-y-auto min-h-[150px] transition-colors ${
                      snapshot.isDraggingOver ? 'bg-primary/5 ring-inset ring-2 ring-primary/20' : ''
                    }`}
                  >
                    {leads.map((lead, index) => (
                      <LeadCard key={lead.id} lead={lead} index={index} onClick={onLeadClick} />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </DragDropContext>
    </div>
  );
}
