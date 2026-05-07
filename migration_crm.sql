-- migration_crm.sql
-- Script de atualização do banco de dados para o módulo CRM

-- 1. Nova tabela de Perfis (Roles) para diferenciar Admin e Corretor
CREATE TABLE IF NOT EXISTS public.perfis (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    nome TEXT NOT NULL,
    role TEXT DEFAULT 'corretor' CHECK (role IN ('admin', 'corretor')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura dos perfis apenas para autenticados" 
ON public.perfis FOR SELECT 
USING (auth.role() = 'authenticated');

-- 2. Adicionar fase_funil e corretor_id aos leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS fase_funil TEXT DEFAULT 'Frio';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS corretor_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL;

-- 3. View segura para mascarar telefone do lead (Privacidade)
-- Administradores veem o telefone real, corretores veem a máscara.
CREATE OR REPLACE VIEW public.vw_leads_seguro AS
SELECT 
    l.id,
    l.nome,
    l.email,
    -- Lógica: Se o usuário logado for admin, mostra telefone. Senão, mostra máscara.
    CASE 
        WHEN (SELECT role FROM public.perfis WHERE id = auth.uid()) = 'admin' THEN l.telefone
        ELSE '***********'
    END as telefone_visivel,
    l.mensagem,
    l.origem,
    l.imovel_id,
    l.status,
    l.fase_funil,
    l.corretor_id,
    l.created_at
FROM public.leads l;

-- 4. Checklists de Documentos
CREATE TABLE IF NOT EXISTS public.lead_documentos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    tipo_processo TEXT NOT NULL, -- Ex: 'Documentos do Comprador', 'Pagamento à Vista', 'Financiamento'
    concluido BOOLEAN DEFAULT false,
    data_vencimento DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.lead_documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados gerenciam documentos" 
ON public.lead_documentos FOR ALL 
USING (auth.role() = 'authenticated');

-- 5. Interações (Chat Interno e Notas)
CREATE TABLE IF NOT EXISTS public.lead_interacoes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    corretor_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
    tipo TEXT DEFAULT 'nota', -- 'nota' ou 'whatsapp'
    mensagem TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.lead_interacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados gerenciam interacoes" 
ON public.lead_interacoes FOR ALL 
USING (auth.role() = 'authenticated');

-- 6. Atualização para Arquivos no Checklist
ALTER TABLE public.lead_documentos ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado'));
ALTER TABLE public.lead_documentos ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE public.lead_documentos ADD COLUMN IF NOT EXISTS file_url TEXT;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('lead_documents', 'lead_documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Permitir upload para usuarios autenticados" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'lead_documents');

CREATE POLICY "Permitir leitura para usuarios autenticados" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'lead_documents');
