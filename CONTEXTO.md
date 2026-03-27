# Checagem de Estoque — Farmácia Magistral

## O que é esse projeto
Sistema web para gestão de estoque de farmácia de manipulação.
Arquivo principal: `farmacia-estoque.html` (single file, sem dependências externas)

## Funcionalidades já prontas
- Upload de CSV de estoque do sistema da farmácia
- Visualização com filtros por grupo (Matéria-prima, Embalagem, Drogaria, Revenda, Outros)
- Busca por nome/código
- Filtro por status (Em estoque / Estoque baixo / Zerado)
- Stats: total de itens, matéria-prima, embalagens, ok/baixo/zerado
- Dados salvos no localStorage (persiste entre sessões)
- Exportar CSV
- Upload de fórmula (imagem ou PDF) ou lista manual de ativos
- Análise via API da Anthropic: cruza cada ativo da fórmula contra o estoque
- Matching flexível de nomes (PT/EN/latim/abreviações)
- Para ativos em falta: sugere substituto disponível no estoque com justificativa clínica

## Formato do CSV de entrada
O sistema exporta do software da farmácia com essas colunas exatas:
- Filial, Local, Código, Grupo, Produto, Unidade, Quantidade
- Encoding: UTF-8 com BOM
- Separador: ponto e vírgula (;)
- Quantidade usa vírgula decimal (ex: 40,00000)
- Grupos presentes: Matéria-prima (1897 itens), Embalagem (285), Drogaria, Revenda, Outros

## Regras de negócio
- Status "Em estoque" = quantidade > 10
- Status "Estoque baixo" = quantidade entre 1 e 10
- Status "Zerado" = quantidade = 0
- Análise de fórmula usa APENAS itens do grupo Matéria-prima
- Matching de nomes: flexível, ignora maiúsculas/acentos, aceita nomes em PT, EN, latim e siglas
  (ex: Natoquinase = Nattokinase, UC-II = Colágeno Tipo II, NMN = Nicotinamida Mononucleotídeo)
- Itens ausentes do estoque = tratados como zerado/faltando

## Stack atual
- HTML + CSS + JS puro, single file, zero dependências
- Fonte: DM Mono + Syne (Google Fonts)
- Tema: dark green (#0d0f0e bg, #a3e635 accent)
- Dados: localStorage
- IA: Anthropic API /v1/messages direto do browser (claude-sonnet-4-20250514)

## O que pode evoluir (ideias)
- Backend Node.js/Express + SQLite para dados persistentes em servidor
- Histórico de estoque (comparar dias anteriores, ver evolução de quantidade)
- Alertas automáticos de estoque baixo por email/WhatsApp
- Multi-usuário com autenticação
- Rodar na rede interna da farmácia (todos os computadores acessam)
- Relatório de fórmulas analisadas (histórico de prescrições cruzadas)
- Integração direta com o sistema da farmácia via API ou leitura automática de pasta
