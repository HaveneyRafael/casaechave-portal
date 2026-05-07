import { Send, Lock, User, MoreVertical, Mic, Play, Pause } from 'lucide-react';

export default function ChatTab({ lead }) {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Olá, tenho interesse em ver os imóveis na Barra dos Coqueiros.', sender: 'lead', time: '10:00 AM' },
    { id: 2, text: 'Bom dia! Claro, temos ótimas opções. Qual a faixa de valor que o senhor procura?', sender: 'corretor', time: '10:05 AM' },
    { id: 3, type: 'audio', duration: '0:14', sender: 'lead', time: '10:10 AM' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setMessages([...messages, {
      id: Date.now(),
      text: input,
      sender: 'corretor',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[500px] border border-border rounded-lg overflow-hidden bg-background">
      {/* Header do Chat (Aviso de Privacidade) */}
      <div className="bg-secondary/50 p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">{lead.nome}</h4>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="w-3 h-3 text-amber-500" />
              <span>Número oculto pela plataforma</span>
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-secondary rounded-full transition-colors">
          <MoreVertical className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-secondary/10">
        <div className="text-center">
           <span className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground">Hoje</span>
        </div>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'corretor' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
              msg.sender === 'corretor' 
                ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                : 'bg-card border border-border text-foreground rounded-tl-sm shadow-sm'
            }`}>
              {msg.type === 'audio' ? (
                <div className="flex items-center gap-3 min-w-[180px] py-1">
                  <button className={`w-8 h-8 rounded-full flex items-center justify-center ${msg.sender === 'corretor' ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground'}`}>
                    <Play className="w-4 h-4 ml-0.5" />
                  </button>
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="h-1 bg-current/20 rounded-full overflow-hidden">
                      <div className="h-full bg-current w-1/3 rounded-full opacity-50"></div>
                    </div>
                    <span className="text-[10px] opacity-70">Áudio • {msg.duration}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm">{msg.text}</p>
              )}
              <p className={`text-[10px] mt-1 text-right ${msg.sender === 'corretor' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input de Mensagem */}
      <form onSubmit={handleSend} className="p-3 bg-card border-t border-border flex items-center gap-2">
        <button type="button" className="p-2.5 text-muted-foreground hover:text-primary hover:bg-secondary rounded-full transition-all">
          <Mic className="w-5 h-5" />
        </button>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite uma mensagem..." 
          className="flex-1 bg-secondary/50 border border-border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
        <button 
          type="submit"
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </form>
      
      <div className="bg-amber-500/10 text-amber-600 p-2 text-[10px] text-center border-t border-amber-500/20 flex items-center justify-center gap-1.5">
        <Lock className="w-3 h-3" />
        <span>Mensagem será enviada pela API Oficial. O número do lead não será revelado.</span>
      </div>
    </div>
  );
}
