# UP Zero Color UI v4

Versão final do projeto.

## O que faz
- lê o atributo `Cor`
- mapeia todos os terms sem `rgb`
- gera preview por heurística local ou por IA em massa
- permite edição manual antes de enviar
- atualiza cada term pelo endpoint oficial:
  - `POST /external/v1/attributes/{attribute_id}/terms`
- envia `code`, `name`, `sort_order` e `rgb`
- faz GET posterior para validar persistência real
- salva arquivos de debug

## Como rodar

```bash
npm install
npm start
```

Abra:
`http://localhost:3010`

## IA para HEX em massa

Para melhorar a geração de HEX em todos os e-commerces:
- configure `OPENAI_API_KEY` no arquivo `.env` ou cole a chave na tela
- mantenha o modelo padrão `gpt-5.4-nano`, otimizado para alto volume/custo menor
- marque `Usar IA no mapeamento` ou clique em `Gerar HEX com IA` depois do preview
- revise a tabela e envie com `Enviar e validar`

Exemplo de `.env`:

```bash
OPENAI_API_KEY=sk-proj_sua_chave_aqui
```

Quando `OPENAI_API_KEY` está configurada no backend, a tela não exige que a chave seja inserida toda vez. A chave da OpenAI não é salva nos arquivos de debug.

## Arquivos de debug
Após enviar, verifique:
- `debug/last-payload.json`
- `debug/last-post-response.json`
- `debug/last-validation-report.json`
