# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Gestão de Estoque — Farmácia Magistral** is a single-file browser app (`farmacia-estoque.html`) for compounding pharmacy inventory management. It cross-references prescriptions against the pharmacy's inventory and uses the Anthropic API to suggest substitutes for missing ingredients.

## Architecture

Single-file HTML (`farmacia-estoque.html`) — all HTML, CSS, and JavaScript in one file with zero build steps and no external dependencies beyond Google Fonts. State is persisted in `localStorage`. The file can be opened directly in any browser.

**Two main tabs:**

1. **Estoque** — Upload and visualize the pharmacy's CSV inventory. Supports search, filters by group and status, stats summary, and CSV export.
2. **Análise de Fórmula** — Upload a prescription (image or PDF) or type a manual ingredient list, then call the Anthropic API to cross-reference each active ingredient against the loaded inventory.

## AI Integration

- Uses `claude-sonnet-4-20250514` via `https://api.anthropic.com/v1/messages` called directly from the browser (no backend proxy).
- The user provides their own Anthropic API key, stored in `localStorage`.
- The prompt sends the full ingredient list + the inventory data (Matéria-prima group only) and expects structured JSON back.
- Matching is flexible: handles PT/EN/Latin names, abbreviations (e.g. NMN = Nicotinamida Mononucleotídeo, UC-II = Colágeno Tipo II).
- For missing ingredients, the model suggests a clinically appropriate substitute already in stock.

## CSV Format (source of truth for inventory)

Exported from the pharmacy's management software:
- Encoding: UTF-8 with BOM
- Separator: semicolon (`;`)
- Decimal: comma (e.g. `40,00000`)
- Columns: `Filial`, `Local`, `Código`, `Grupo`, `Produto`, `Unidade`, `Quantidade`
- Groups: Matéria-prima (~1897 items), Embalagem (~285), Drogaria, Revenda, Outros

## Business Rules

- **Em estoque** = Quantidade > 10
- **Estoque baixo** = Quantidade between 1 and 10
- **Zerado** = Quantidade = 0
- Formula analysis only uses items from the **Matéria-prima** group.
- Items not found in the inventory are treated as missing/zerado.

## Context File

`CONTEXTO.md` — describes the system architecture and planned future features. Check it for context on what's implemented vs. what's planned.
