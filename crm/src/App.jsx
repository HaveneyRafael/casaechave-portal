import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Settings, LogOut, Search, Bell, Menu, ChevronLeft, ChevronRight, X } from 'lucide-react';
import KanbanBoard from './components/KanbanBoard';
import ChecklistTab from './components/ChecklistTab';
import ChatTab from './components/ChatTab';
import LeadsPage from './pages/LeadsPage';
import MensagensPage from './pages/MensagensPage';

function SidebarItem({ icon: Icon, label, to, isCollapsed }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      title={isCollapsed ? label : ""}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-medium transition-all overflow-hidden ${
        isActive 
          ? 'bg-primary/10 text-primary' 
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {!isCollapsed && <span className="whitespace-nowrap">{label}</span>}
    </Link>
  );
}

function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className={`relative flex flex-col border-r border-border bg-card transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-16'}`}>
        <div className="h-16 flex items-center px-4 border-b border-border">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
              C
            </div>
            {isSidebarOpen && <span className="font-bold text-lg tracking-tight whitespace-nowrap transition-opacity duration-300">CasaeChave<span className="text-primary">CRM</span></span>}
          </div>
        </div>

        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="absolute -right-3.5 top-5 p-1 bg-card border border-border shadow-sm rounded-full text-muted-foreground hover:text-foreground transition-all z-50 flex items-center justify-center"
          title={isSidebarOpen ? "Recolher Menu" : "Expandir Menu"}
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden">
          <SidebarItem to="/" icon={LayoutDashboard} label="Funil de Vendas" isCollapsed={!isSidebarOpen} />
          <SidebarItem to="/leads" icon={Users} label="Leads & Contatos" isCollapsed={!isSidebarOpen} />
          <SidebarItem to="/mensagens" icon={MessageSquare} label="Mensagens" isCollapsed={!isSidebarOpen} />
        </nav>

        <div className="p-4 border-t border-border flex flex-col gap-1">
          <button className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all overflow-hidden`} title={!isSidebarOpen ? "Configurações" : ""}>
            <Settings className="w-5 h-5 shrink-0" />
            {!isSidebarOpen && <span className="whitespace-nowrap">Configurações</span>}
            {isSidebarOpen && <span>Configurações</span>}
          </button>
          <button className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all overflow-hidden mt-1`} title={!isSidebarOpen ? "Sair" : ""}>
            <LogOut className="w-5 h-5 shrink-0" />
            {!isSidebarOpen && <span className="whitespace-nowrap">Sair</span>}
            {isSidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur flex items-center justify-between px-4 lg:px-8 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl lg:text-2xl font-semibold tracking-tight">Sistema CRM</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar lead, telefone..." 
                className="pl-9 pr-4 py-2 w-64 rounded-full bg-secondary/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              />
            </div>
            
            <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive border-2 border-card"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-6 border-l border-border">
              <div className="text-right">
                <p className="text-sm font-medium">Rafael</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                R
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Canvas Background (Aesthetic) */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />

        {/* Content Area */}
        <main className="flex-1 overflow-hidden relative z-0 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  const [selectedLead, setSelectedLead] = useState(null);
  const [activeTab, setActiveTab] = useState('perfil'); // 'perfil', 'documentos', 'chat'

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={
            <div className="h-full flex flex-col">
              {/* Toolbar */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2">
                  <button className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg shadow-sm hover:bg-primary/90 transition-colors">
                    Novo Lead
                  </button>
                  <button className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg shadow-sm hover:bg-secondary/80 border border-border transition-colors">
                    Filtros
                  </button>
                </div>
              </div>
              
              <KanbanBoard onLeadClick={setSelectedLead} />

              {/* Lead Details Modal Overlay Placeholder */}
              {selectedLead && (
                <div 
                  className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex justify-end"
                  onClick={() => setSelectedLead(null)}
                >
                  <div 
                    className="w-[600px] h-full bg-card border-l border-border shadow-2xl animate-in slide-in-from-right-full duration-300 flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-6 border-b border-border flex justify-between items-center">
                      <h2 className="text-xl font-bold">{selectedLead.nome}</h2>
                      <button 
                        onClick={() => setSelectedLead(null)}
                        className="p-2 bg-secondary/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors cursor-pointer"
                        title="Fechar (Esc)"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-6 flex-1 overflow-y-auto">
                      {/* Tabs */}
                      <div className="flex border-b border-border mb-6">
                        <button 
                          onClick={() => setActiveTab('perfil')}
                          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'perfil' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          Perfil
                        </button>
                        <button 
                          onClick={() => setActiveTab('documentos')}
                          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'documentos' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          Documentos (Checklist)
                        </button>
                        <button 
                          onClick={() => setActiveTab('chat')}
                          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'chat' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          Chat Interno
                        </button>
                      </div>
                      
                      {/* Tab Content */}
                      <div className="space-y-4">
                        {activeTab === 'perfil' && (
                          <>
                            <div className="p-4 bg-secondary/30 rounded-lg border border-border/50">
                              <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Telefone de Contato</label>
                              <p className="text-foreground mt-1 text-lg">{selectedLead.telefone}</p>
                              {selectedLead.telefone.includes('*') && (
                                <p className="text-xs text-amber-500 mt-1">Número mascarado para proteção de dados.</p>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-secondary/30 rounded-lg border border-border/50">
                                <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Fase do Funil</label>
                                <p className="text-foreground mt-1 font-medium">{selectedLead.fase_funil}</p>
                              </div>
                              <div className="p-4 bg-secondary/30 rounded-lg border border-border/50">
                                <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Origem</label>
                                <p className="text-foreground mt-1 font-medium">{selectedLead.origem}</p>
                              </div>
                            </div>
                          </>
                        )}

                        {activeTab === 'documentos' && (
                          <ChecklistTab lead={selectedLead} />
                        )}

                        {activeTab === 'chat' && (
                          <ChatTab lead={selectedLead} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          } />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/mensagens" element={<MensagensPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
