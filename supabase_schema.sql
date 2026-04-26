-- Script de Criação do Banco de Dados para a CasaeChave no Supabase
-- Cole e execute este script no "SQL Editor" do painel do Supabase.

-- Habilitar a extensão UUID (caso não esteja habilitada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Imóveis
CREATE TABLE IF NOT EXISTS public.imoveis (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    titulo TEXT NOT NULL,
    bairro TEXT NOT NULL,
    tipo TEXT NOT NULL, -- Ex: Apartamento, Casa em Condomínio
    valor_venda NUMERIC(15, 2),
    valor_aluguel NUMERIC(15, 2),
    status TEXT NOT NULL, -- Ex: Lançamento, Pronto, Em Construção
    area_m2 NUMERIC(10, 2) NOT NULL,
    quartos INTEGER DEFAULT 0, -- Quantidade de quartos
    suites INTEGER NOT NULL DEFAULT 0,
    banheiros INTEGER DEFAULT 0, -- Quantidade de banheiros
    vagas INTEGER NOT NULL DEFAULT 0,
    valor_condominio NUMERIC(10, 2),
    valor_iptu NUMERIC(10, 2), -- IPTU anual
    descricao TEXT,
    infraestrutura TEXT[], -- Array de itens de infraestrutura do empreendimento
    imagens TEXT[], -- Array de URLs de imagens armazenadas no Supabase Storage
    destaque BOOLEAN DEFAULT false, -- Para mostrar na página inicial
    corretor TEXT, -- Nome do corretor responsável
    corretor_foto TEXT, -- URL da foto do corretor
    corretor_whatsapp TEXT, -- WhatsApp do corretor
    slug TEXT, -- URL amigável gerada automaticamente
    seo_titulo TEXT, -- Title tag gerado automaticamente
    seo_descricao TEXT, -- Descrição SEO gerada automaticamente (150-200 palavras)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índice único no slug para URLs amigáveis
CREATE UNIQUE INDEX IF NOT EXISTS idx_imoveis_slug ON public.imoveis (slug) WHERE slug IS NOT NULL;

-- 2. Tabela de Leads / Contatos (Para armazenar quem agenda visitas ou pergunta sobre imóveis)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT NOT NULL,
    mensagem TEXT,
    origem TEXT DEFAULT 'Desconhecida', -- Ex: Agendar Visita, Interessado
    imovel_id UUID REFERENCES public.imoveis(id) ON DELETE SET NULL, -- Qual imóvel a pessoa tem interesse
    status TEXT DEFAULT 'Novo', -- Ex: Novo, Em Atendimento, Finalizado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Configuração do Row Level Security (RLS)
-- Isso garante a segurança do banco, controlando quem pode ler e escrever os dados.

-- Ativar RLS para as tabelas
ALTER TABLE public.imoveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Políticas para 'imoveis'
-- Qualquer pessoa (usuário não autenticado no site) pode VER os imóveis
CREATE POLICY "Permitir leitura pública de imóveis" 
ON public.imoveis FOR SELECT 
USING (true);

-- Apenas usuários autenticados (admin) podem INSERIR, ATUALIZAR ou DELETAR
CREATE POLICY "Permitir alteração de imóveis apenas para autenticados" 
ON public.imoveis FOR ALL 
USING (auth.role() = 'authenticated');

-- Políticas para 'leads'
-- Qualquer pessoa pode INSERIR um lead (via formulário do site)
CREATE POLICY "Permitir inserção de leads pelo público" 
ON public.leads FOR INSERT 
WITH CHECK (true);

-- Apenas usuários autenticados (admin) podem LER, ATUALIZAR ou DELETAR leads
CREATE POLICY "Permitir visualização e edição de leads apenas para autenticados" 
ON public.leads FOR SELECT 
USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização de leads apenas para autenticados" 
ON public.leads FOR UPDATE 
USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir deleção de leads apenas para autenticados" 
ON public.leads FOR DELETE 
USING (auth.role() = 'authenticated');

-- Gatilho (Trigger) para atualizar a coluna 'updated_at' automaticamente após edição
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_imoveis_updated_at
BEFORE UPDATE ON public.imoveis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
