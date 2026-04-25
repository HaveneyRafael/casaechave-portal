-- Migration: Adicionar quartos, banheiros e valor_iptu na tabela imoveis
-- Execute este script no SQL Editor do Supabase

-- Quantidade de Quartos
ALTER TABLE public.imoveis
ADD COLUMN IF NOT EXISTS quartos INTEGER DEFAULT 0;

-- Quantidade de Banheiros
ALTER TABLE public.imoveis
ADD COLUMN IF NOT EXISTS banheiros INTEGER DEFAULT 0;

-- Valor do IPTU
ALTER TABLE public.imoveis
ADD COLUMN IF NOT EXISTS valor_iptu NUMERIC(10, 2);
