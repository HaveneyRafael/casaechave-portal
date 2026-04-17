-- Migration: Adicionar coluna valor_aluguel na tabela imoveis
-- E coluna origem na tabela leads
-- Execute este SQL no "SQL Editor" do painel do Supabase

-- 1. Adicionar a coluna valor_aluguel (opcional/nullable)
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS valor_aluguel NUMERIC(15, 2);

-- 2. Tornar valor_venda também opcional (antes era NOT NULL)
ALTER TABLE public.imoveis ALTER COLUMN valor_venda DROP NOT NULL;

-- 3. Adicionar coluna origem na tabela leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'Desconhecida';
