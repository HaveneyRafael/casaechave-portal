-- Adicionar a coluna cidade na tabela imoveis
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS cidade text DEFAULT 'Aracaju';
