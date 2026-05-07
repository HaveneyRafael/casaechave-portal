import React, { useState } from 'react';
import { Search, Filter, MessageSquare, CheckCircle2, User, Clock, Mic, Play, Pause } from 'lucide-react';

const mockChats = [
  { id: '1', leadName: 'Maria Souza', corretorName: 'Corretor Bruno', lastMessage: '🎤 Áudio (0:12)', time: '10:45', unread: 0, status: 'ativo' },
  { id: '2', leadName: 'João Silva', corretorName: 'Corretora Letícia', lastMessage: 'Qual o valor do condomínio?', time: '09:30', unread: 2, status: 'aguardando' },
  { id: '3', leadName: 'Ana Costa', corretorName: 'Corretor Bruno', lastMessage: 'Enviei a documentação para análise.', time: 'Ontem', unread: 0, status: 'ativo' },
];

const mockHistory = [
  { id: 1, sender: 'lead', text: 'Bom dia, gostaria de agendar uma visita.', time: '09:00', date: 'Hoje' },
  { id: 2, sender: 'corretor', text: 'Bom dia, Maria! Claro, qual seria o melhor dia para você?', time: '09:05', date: 'Hoje' },
  { id: 3, type: 'audio', duration: '0:12', sender: 'lead', time: '09:15', date: 'Hoje' },
  { id: 4, sender: 'corretor', text: 'Perfeito, agendado para amanhã às 14h. Nos encontramos na portaria do condomínio.', time: '10:45', date: 'Hoje' },
  { id: 5, sender: 'admin', type: 'internal', text: 'Bruno, ofereça a unidade do 5º andar, o cliente parece decidido.', time: '11:00', date: 'Hoje' },
];

export default function MensagensPage() {
  const [activeChat, setActiveChat] = useState(mockChats[0]);
  const [showInput, setShowInput] = useState(false);
  const [isWhisper, setIsWhisper] = useState(false);

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Monitoramento de Mensagens</h2>
          <p className="text-muted-foreground">Acompanhe as conversas entre corretores e leads em tempo real.</p>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex">
        {/* Painel Esquerdo: Lista de Chats */}
        <div className="w-1/3 border-r border-border flex flex-col bg-secondary/10">
          <div className="p-4 border-b border-border bg-background/50">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Buscar lead ou corretor..." className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="flex gap-2 mt-3">
              <button className="text-xs font-medium bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20">Todos</button>
              <button className="text-xs font-medium text-muted-foreground hover:bg-secondary px-3 py-1.5 rounded-full border border-transparent transition-colors">Aguardando Resposta</button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {mockChats.map(chat => (
              <div 
                key={chat.id} 
                onClick={() => setActiveChat(chat)}
                className={`p-4 border-b border-border cursor-pointer transition-colors hover:bg-secondary/40 ${activeChat?.id === chat.id ? 'bg-secondary/60 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-semibold text-sm">{chat.leadName}</h4>
                  <span className="text-xs text-muted-foreground">{chat.time}</span>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  <User className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">{chat.corretorName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground truncate max-w-[80%]">{chat.lastMessage}</p>
                  {chat.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Painel Direito: Histórico do Chat */}
        <div className="flex-1 flex flex-col bg-background">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="h-16 border-b border-border bg-card/50 flex items-center justify-between px-6">
                <div>
                  <h3 className="font-semibold text-lg">{activeChat.leadName}</h3>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Atendido por: <span className="text-foreground">{activeChat.corretorName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { setShowInput(true); setIsWhisper(true); }}
                    className="px-3 py-1.5 text-xs font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200 rounded-md border border-amber-200 transition-colors"
                  >
                    Aviso ao Corretor
                  </button>
                  <button 
                    onClick={() => { setShowInput(true); setIsWhisper(false); }}
                    className="px-3 py-1.5 text-xs font-semibold bg-secondary hover:bg-secondary/80 rounded-md border border-border transition-colors"
                  >
                    Intervir na Conversa
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-95">
                <div className="flex justify-center">
                  <span className="text-xs font-medium bg-secondary text-muted-foreground px-3 py-1 rounded-full shadow-sm border border-border/50">
                    Hoje
                  </span>
                </div>
                
                {mockHistory.map((msg) => (
                  <React.Fragment key={msg.id}>
                    {msg.type === 'internal' ? (
                      <div className="flex justify-center my-4 animate-in fade-in zoom-in duration-300">
                        <div className="max-w-[80%] bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-lg shadow-sm text-sm flex flex-col gap-1 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                          <span className="font-bold text-[10px] uppercase tracking-widest text-amber-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Aviso Interno (O Cliente não vê)
                          </span>
                          <p className="italic font-medium">{msg.text}</p>
                          <span className="text-[10px] text-amber-600/70 self-end mt-1">{msg.time}</span>
                        </div>
                      </div>
                    ) : (
                      <div className={`flex ${msg.sender === 'corretor' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[65%] rounded-2xl px-4 py-2.5 shadow-sm ${
                          msg.sender === 'corretor' 
                            ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                            : 'bg-card border border-border text-foreground rounded-tl-sm'
                        }`}>
                          {msg.sender === 'corretor' && (
                            <p className="text-[10px] uppercase font-bold text-primary-foreground/70 mb-1 tracking-wider">{activeChat.corretorName}</p>
                          )}
                          {msg.sender === 'lead' && (
                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">{activeChat.leadName}</p>
                          )}
                          
                          {msg.type === 'audio' ? (
                            <div className="flex items-center gap-3 min-w-[200px] py-1">
                              <button className={`w-8 h-8 rounded-full flex items-center justify-center ${msg.sender === 'corretor' ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground'}`}>
                                <Play className="w-4 h-4 ml-0.5" />
                              </button>
                              <div className="flex-1 flex flex-col gap-1.5">
                                <div className="h-1 bg-current/20 rounded-full overflow-hidden">
                                  <div className="h-full bg-current w-1/4 rounded-full opacity-50"></div>
                                </div>
                                <span className="text-[10px] opacity-70">Áudio • {msg.duration}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                          )}

                          <div className={`flex justify-end items-center gap-1 mt-1.5 text-[10px] ${msg.sender === 'corretor' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            <span>{msg.time}</span>
                            {msg.sender === 'corretor' && <CheckCircle2 className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
              
              {/* Chat Footer */}
              <div className="p-4 bg-card border-t border-border">
                {showInput ? (
                  <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between">
                       <span className={`text-xs font-bold uppercase tracking-wider ${isWhisper ? 'text-amber-600' : 'text-primary'}`}>
                         {isWhisper ? 'Mandando Aviso ao Corretor...' : 'Intervindo na Conversa...'}
                       </span>
                       <button onClick={() => setShowInput(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
                    </div>
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        autoFocus
                        placeholder={isWhisper ? "Sua mensagem para o corretor (o cliente não verá)..." : "Sua mensagem para o cliente..."}
                        className={`flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 ${isWhisper ? 'border-amber-200 focus:ring-amber-200 bg-amber-50/30' : 'border-border focus:ring-primary/20'}`} 
                      />
                      <button className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${isWhisper ? 'bg-amber-400 text-amber-950 hover:bg-amber-500' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
                        Enviar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-3 border border-dashed border-border rounded-lg bg-secondary/30">
                    <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      Modo Leitura: Você está visualizando o histórico como Administrador.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
              <p>Selecione uma conversa para visualizar o histórico.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
