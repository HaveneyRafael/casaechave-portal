// =============================================
// SEO UTILS — Geração automática de metadados SEO
// para cada imóvel da plataforma CasaeChave
// =============================================

(function() {
    'use strict';

    // Utilitário: remover acentos e normalizar texto
    function removerAcentos(str) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    // Utilitário: truncar texto em um limite de caracteres sem cortar palavras
    function truncar(texto, max) {
        if (texto.length <= max) return texto;
        const cortado = texto.substring(0, max);
        const ultimoEspaco = cortado.lastIndexOf(' ');
        return cortado.substring(0, ultimoEspaco > 0 ? ultimoEspaco : max);
    }

    // Utilitário: formatar preço
    function formatarPreco(valor) {
        if (!valor) return null;
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 0
        }).format(valor);
    }

    // ==========================================
    // 1. TITLE TAG (máx. 60 caracteres)
    // Formato: [Tipologia] no [Bairro] – Aracaju | CasaeChave
    // ==========================================
    function gerarTitleTag(imovel) {
        const tipo = imovel.tipo || '';
        const bairro = imovel.bairro || '';
        const cidade = imovel.cidade || 'Aracaju';

        // Tenta o formato completo primeiro
        let title = `${tipo} no ${bairro} – ${cidade} | CasaeChave`;

        if (title.length > 60) {
            // Tenta sem a cidade
            title = `${tipo} no ${bairro} | CasaeChave`;
        }
        if (title.length > 60) {
            // Usa só titulo do imóvel
            title = `${imovel.titulo || tipo} | CasaeChave`;
        }

        return truncar(title, 60);
    }

    // ==========================================
    // 2. META DESCRIPTION (máx. 155 caracteres)
    // Incluindo tipo, bairro, área, suítes, vagas e valor.
    // Terminando com CTA curto.
    // ==========================================
    function gerarMetaDescription(imovel) {
        const partes = [];

        if (imovel.tipo) partes.push(imovel.tipo);
        if (imovel.bairro) partes.push(`no ${imovel.bairro}`);
        if (imovel.area_m2) partes.push(`${imovel.area_m2}m²`);
        if (imovel.suites) partes.push(`${imovel.suites} suíte${imovel.suites > 1 ? 's' : ''}`);
        if (imovel.vagas) partes.push(`${imovel.vagas} vaga${imovel.vagas > 1 ? 's' : ''}`);

        // Preço
        if (imovel.valor_venda) {
            partes.push(formatarPreco(imovel.valor_venda));
        } else if (imovel.valor_aluguel) {
            partes.push(formatarPreco(imovel.valor_aluguel) + '/mês');
        }

        const cidade = imovel.cidade || 'Aracaju';
        const uf = imovel.uf || 'SE';
        let desc = partes.join(' • ') + `. ${cidade}/${uf}.`;

        // Adiciona CTA se couber
        const cta = ' Agende uma visita pela CasaeChave.';
        if ((desc + cta).length <= 155) {
            desc += cta;
        }

        return truncar(desc, 155);
    }

    // ==========================================
    // 3. H1 DA PÁGINA (máx. 70 caracteres)
    // Diferente do title tag, mais descritivo
    // ==========================================
    function gerarH1(imovel) {
        const partes = [];

        if (imovel.tipo) partes.push(imovel.tipo);

        // Detalhes compactos
        const detalhes = [];
        if (imovel.suites) detalhes.push(`${imovel.suites} Suíte${imovel.suites > 1 ? 's' : ''}`);
        if (imovel.area_m2) detalhes.push(`${imovel.area_m2}m²`);
        if (detalhes.length > 0) partes.push(detalhes.join(', '));

        const cidade = imovel.cidade || 'Aracaju';
        if (imovel.bairro) partes.push(`– ${imovel.bairro}, ${cidade}`);

        let h1 = partes.join(' ');

        if (h1.length > 70) {
            // Versão mais curta
            h1 = `${imovel.tipo || ''} ${imovel.suites ? imovel.suites + ' Suítes' : ''} – ${imovel.bairro || cidade}`.trim();
        }
        if (h1.length > 70) {
            h1 = imovel.titulo || h1;
        }

        return truncar(h1, 70);
    }

    // ==========================================
    // 4. SLUG DA URL
    // Formato: tipologia-bairro-Xm2-aracaju
    // ==========================================
    function gerarSlug(imovel) {
        const partes = [];

        const cidade = imovel.cidade || 'aracaju';

        if (imovel.tipo) partes.push(imovel.tipo);
        if (imovel.bairro) partes.push(imovel.bairro);
        if (imovel.area_m2) partes.push(`${Math.round(imovel.area_m2)}m2`);
        partes.push(cidade);

        let slug = partes.join('-');

        // Normalizar: minúsculas, sem acentos, só letras/números/hífens
        slug = removerAcentos(slug)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')  // qualquer caracter especial vira hífen
            .replace(/-+/g, '-')           // múltiplos hífens viram um só
            .replace(/^-|-$/g, '');        // remove hífens no início/fim

        return slug;
    }

    // ==========================================
    // 5. DESCRIÇÃO SEO (150 a 200 palavras)
    // Palavras-chave locais, baseada na descrição do corretor
    // ==========================================
    function gerarDescricaoSEO(imovel) {
        const tipo = imovel.tipo || 'Imóvel';
        const bairro = imovel.bairro || '';
        const cidade = imovel.cidade || 'Aracaju';
        const uf = imovel.uf || 'Sergipe';
        const area = imovel.area_m2 ? `${imovel.area_m2}m²` : '';
        const suites = imovel.suites || 0;
        const vagas = imovel.vagas || 0;
        const status = imovel.status || '';
        const descricaoBase = imovel.descricao || '';

        // Determinar tipo de negócio
        let negocio = '';
        if (imovel.valor_venda && imovel.valor_aluguel) {
            negocio = 'disponível para venda e locação';
        } else if (imovel.valor_aluguel) {
            negocio = 'disponível para locação';
        } else {
            negocio = 'disponível para venda';
        }

        // Parágrafo 1: Apresentação do imóvel com localização
        let p1 = `${tipo} ${negocio} no bairro ${bairro}, em ${cidade}, ${uf}.`;
        if (area) p1 += ` Com ${area} de área privativa`;
        if (suites > 0) p1 += `, ${suites} suíte${suites > 1 ? 's' : ''}`;
        if (vagas > 0) p1 += ` e ${vagas} vaga${vagas > 1 ? 's' : ''} de garagem`;
        p1 += '.';

        if (status) {
            const statusMap = {
                'Lançamento': 'Este é um lançamento imobiliário na região',
                'Pronto': 'O imóvel está pronto para morar',
                'Em Construção': 'O empreendimento está em fase de construção'
            };
            p1 += ` ${statusMap[status] || ''}.`;
        }

        // Parágrafo 2: Descrição arquitetônica (resumida da descrição do corretor)
        let p2 = '';
        if (descricaoBase) {
            // Pega as primeiras 2-3 frases da descrição do corretor
            const frases = descricaoBase
                .replace(/\n+/g, '. ')
                .split(/[.!?]+/)
                .map(f => f.trim())
                .filter(f => f.length > 10);

            if (frases.length > 0) {
                const frasesUsadas = frases.slice(0, 3).join('. ');
                p2 = frasesUsadas + '.';
            }
        }

        // Parágrafo 3: Valor e localização
        let p3 = '';
        if (imovel.valor_venda) {
            p3 += `Valor de venda: ${formatarPreco(imovel.valor_venda)}.`;
        }
        if (imovel.valor_aluguel) {
            p3 += (p3 ? ' ' : '') + `Valor do aluguel: ${formatarPreco(imovel.valor_aluguel)} por mês.`;
        }
        if (imovel.valor_condominio) {
            p3 += ` Condomínio: ${formatarPreco(imovel.valor_condominio)}.`;
        }

        // Parágrafo 4: Localização e CTA
        const regiaoDesc = cidade.toLowerCase() === 'aracaju' ? 'capital sergipana' : cidade;
        let p4 = `Localizado no bairro ${bairro} em ${cidade}, uma das regiões mais valorizadas da ${regiaoDesc}.`;
        p4 += ` Entre em contato com a CasaeChave para agendar uma visita e conhecer este ${tipo.toLowerCase()} pessoalmente.`;

        // Montar texto completo
        const paragrafos = [p1, p2, p3, p4].filter(p => p.length > 0);
        let textoFinal = paragrafos.join(' ');

        // Limitar a ~200 palavras
        const palavras = textoFinal.split(/\s+/);
        if (palavras.length > 200) {
            textoFinal = palavras.slice(0, 200).join(' ') + '.';
        }

        return textoFinal;
    }

    // ==========================================
    // 6. APLICAR SEO NA PÁGINA (para detalhe-script.js)
    // ==========================================
    function aplicarSEONaPagina(imovel) {
        // Title tag
        document.title = gerarTitleTag(imovel);

        // Meta description (criar se não existir)
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        metaDesc.content = gerarMetaDescription(imovel);

        // Canonical URL com slug
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
        }
        canonical.href = window.location.href;

        // Open Graph tags para compartilhamento em redes sociais
        const ogTags = {
            'og:title': gerarTitleTag(imovel),
            'og:description': gerarMetaDescription(imovel),
            'og:type': 'website',
            'og:url': window.location.href
        };

        // Adicionar imagem OG se tiver
        if (imovel.imagens && imovel.imagens.length > 0) {
            ogTags['og:image'] = imovel.imagens[0];
        }

        Object.entries(ogTags).forEach(([prop, content]) => {
            let tag = document.querySelector(`meta[property="${prop}"]`);
            if (!tag) {
                tag = document.createElement('meta');
                tag.setAttribute('property', prop);
                document.head.appendChild(tag);
            }
            tag.content = content;
        });

        // JSON-LD Structured Data (Schema.org)
        const schemaData = {
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            "name": imovel.titulo || gerarH1(imovel),
            "description": gerarMetaDescription(imovel),
            "url": window.location.href
        };

        // Offers (preço de venda e/ou aluguel)
        if (imovel.valor_venda) {
            schemaData.offers = {
                "@type": "Offer",
                "priceCurrency": "BRL",
                "price": imovel.valor_venda
            };
        } else if (imovel.valor_aluguel) {
            schemaData.offers = {
                "@type": "Offer",
                "priceCurrency": "BRL",
                "price": imovel.valor_aluguel
            };
        }

        // Imagens
        if (imovel.imagens && imovel.imagens.length > 0) {
            schemaData.image = imovel.imagens;
        }

        // Detalhes do imóvel
        if (imovel.suites) {
            schemaData.numberOfRooms = imovel.suites;
        }
        if (imovel.area_m2) {
            schemaData.floorSize = {
                "@type": "QuantitativeValue",
                "value": imovel.area_m2,
                "unitCode": "MTK"
            };
        }

        // Endereço
        const cidade = imovel.cidade || 'Aracaju';
        const uf = imovel.uf || 'SE';
        schemaData.address = {
            "@type": "PostalAddress",
            "addressLocality": cidade,
            "addressRegion": uf,
            "addressCountry": "BR",
            "streetAddress": imovel.bairro || ''
        };

        let scriptLD = document.getElementById('schema-imovel');
        if (!scriptLD) {
            scriptLD = document.createElement('script');
            scriptLD.type = 'application/ld+json';
            scriptLD.id = 'schema-imovel';
            document.head.appendChild(scriptLD);
        }
        scriptLD.textContent = JSON.stringify(schemaData);
    }

    // ==========================================
    // 7. GERAR CAMPOS SEO PARA SALVAR NO BANCO
    //    (para admin-script.js / admin-editar-script.js)
    // ==========================================
    function gerarCamposSEO(imovel) {
        return {
            slug: gerarSlug(imovel),
            seo_titulo: gerarTitleTag(imovel),
            seo_descricao: gerarDescricaoSEO(imovel)
        };
    }

    // Exportar funções globalmente
    window.SEO = {
        gerarTitleTag,
        gerarMetaDescription,
        gerarH1,
        gerarSlug,
        gerarDescricaoSEO,
        aplicarSEONaPagina,
        gerarCamposSEO
    };

})();
