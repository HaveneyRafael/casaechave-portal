-- =============================================
-- MIGRATION: Ativar Row Level Security (RLS)
-- Executar no SQL Editor do Supabase Dashboard
-- =============================================

-- 1. Tabela: imoveis (leitura pública, escrita apenas autenticados)
ALTER TABLE imoveis ENABLE ROW LEVEL SECURITY;

-- Leitura pública (SELECT) para qualquer pessoa
CREATE POLICY "imoveis_select_public" ON imoveis
  FOR SELECT USING (true);

-- Insert/Update/Delete apenas para usuários autenticados
CREATE POLICY "imoveis_insert_auth" ON imoveis
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "imoveis_update_auth" ON imoveis
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "imoveis_delete_auth" ON imoveis
  FOR DELETE USING (auth.role() = 'authenticated');


-- 2. Tabela: leads (inserção pública para formulários, leitura apenas autenticados)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode criar um lead (formulário de contato)
CREATE POLICY "leads_insert_public" ON leads
  FOR INSERT WITH CHECK (true);

-- Leitura apenas para usuários autenticados (admin/corretor)
CREATE POLICY "leads_select_auth" ON leads
  FOR SELECT USING (auth.role() = 'authenticated');

-- Update/Delete apenas autenticados
CREATE POLICY "leads_update_auth" ON leads
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "leads_delete_auth" ON leads
  FOR DELETE USING (auth.role() = 'authenticated');
