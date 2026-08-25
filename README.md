# PayGateway Mobile + Block Win + Zumbla Win

Projeto React/Vite com backend Express e banco Firebase/Firestore. O Zumbla está integrado à mesma autenticação, carteira e histórico financeiro do projeto existente.

## Rodar localmente

Requisitos: Node.js 22 ou superior.

```bash
npm install
cp .env.example .env.local
npm run dev
```

No Windows, copie `.env.example` manualmente para `.env.local`.

## Validar produção

```bash
npm run lint
npm run build
npm start
```

## Integração Zumbla

- Card disponível em **Jogos**, ao lado do Block Win.
- Tela inicial própria com entradas de R$ 1, R$ 2, R$ 5, R$ 10 e R$ 20.
- Jogo HTML5 em `public/zumbla/game`.
- Início de rodada: `POST /api/game/zumbla/start`.
- Liquidação: `POST /api/game/zumbla/settle`.
- Carteira: documento atual da coleção `users`.
- Apostas: coleção `gameBets`, usando `gameId: g_zumbla`.
- Métricas: documento `gameConfigs/g_zumbla`.
- Extrato: coleção `transactions`, com `paymentMethod: ZumblaWin`.

O backend calcula o multiplicador, impede liquidação repetida e atualiza saldo, aposta, extrato e métricas em uma única transação Firestore.

## Firebase

A configuração pública atual está em `firebase-applet-config.json`. Para outra conta Firebase, substitua esse arquivo pela configuração do novo projeto e publique `firestore.rules`.

```bash
npx firebase-tools login
npx firebase-tools use ai-studio-applet-webapp-6ac28
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

Nunca coloque chave privada, conta de serviço ou segredo de pagamento em arquivos públicos. Configure os valores de `.env.example` diretamente no ambiente da hospedagem.

## Hospedagem

O backend e o frontend devem ser hospedados juntos, pois o navegador chama as rotas `/api/...` no mesmo domínio. O servidor deve iniciar com `npm start` e receber a porta pela variável `PORT`.
