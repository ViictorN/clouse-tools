---
trigger: always
description: Regras de acessibilidade e design tokens para o projeto.
---
# Regras de Frontend
- Todo texto deve ter contraste mínimo de 4.5:1 (WCAG AA).
- O indicador de foco deve ser visível em todos os elementos interativos.
- Valores arbitrários (ex: 14px, #333) são ESTRITAMENTE PROIBIDOS. Use apenas tokens de `.context/tokens.toon`.
- Animações devem respeitar `prefers-reduced-motion`.
- Nenhum componente deve usar `position: fixed` sem um fallback para mobile.
