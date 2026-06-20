# Pocket Envelopes

Aplicativo mobile de gestão financeira pessoal baseado no método de **orçamento por envelopes** (Envelope Budgeting), inspirado no YNAB e no Actual Budget. Desenvolvido em React Native com Expo, com armazenamento local (SQLite) e sincronização em nuvem (Firebase Realtime Database) — funciona offline e sincroniza quando a conexão retorna.

> Projeto acadêmico — Laboratório de Desenvolvimento de Aplicativos Híbridos.

---

## Funcionalidades

### Autenticação
- Cadastro e login com e-mail e senha
- Desbloqueio por **biometria** (digital / Face ID) após o primeiro login
- Dados completamente isolados por usuário

### Envelopes
- Crie envelopes por categoria (ex.: Alimentação, Transporte)
- Defina um **orçamento mensal** por envelope
- O **saldo disponível** é calculado automaticamente a partir das despesas registradas
- Indicador visual de saúde financeira (verde / amarelo / vermelho) em cada envelope
- Busca por nome no topo da lista

### Despesas / Transações
- Registre uma despesa em qualquer envelope
- Anexe opcionalmente uma **foto do recibo** (câmera do dispositivo, salva comprimida)
- Captura automática de **GPS** no momento do registro (localização do estabelecimento)
- Histórico completo de transações com data, valor e envelope de origem
- Visualize o recibo em tela cheia e o local no mapa diretamente pelo Histórico
- Exclua transações individualmente (o saldo do envelope é recalculado automaticamente)

### Contas
- Cadastre contas bancárias ou cartões com nome, tipo e saldo
- Registre a **data de vencimento** de cada conta

### Dashboard
- Resumo do orçamento total: orçado, disponível e gasto
- Barra de progresso global do uso do orçamento
- Contadores de envelopes em alerta e estourados
- **Gráfico de barras por envelope** mostrando o quanto foi gasto em relação ao orçado

### Sincronização offline/online
- Todas as operações são gravadas primeiro no SQLite local
- Uma fila de sincronização (`sync_queue`) envia as mudanças ao Firebase quando há conexão
- O pull do Firebase reconcilia dados entre dispositivos (last-write-wins por `updated_at`)
- Envelopes com operação pendente ficam protegidos durante a sincronização

---

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | React Native + Expo SDK ~54 |
| Linguagem | JavaScript (sem TypeScript) |
| Banco local | expo-sqlite ~16 (async API) |
| Nuvem | Firebase Realtime Database (SDK v12 modular) |
| Câmera | expo-camera |
| Localização | expo-location |
| Mapa | react-native-maps |
| Biometria | expo-local-authentication |
| Conectividade | @react-native-community/netinfo |
| Navegação | Estado local no App.js (sem react-navigation) |

---

## Pré-requisitos

Você precisará do **Node.js** e do **Git** instalados.

**Windows**
```bash
winget install OpenJS.NodeJS
winget install Git.Git
```

**macOS**
```bash
brew install node git
```
> Para rodar no Simulador iOS: instale o **Xcode** pela Mac App Store.

**Linux (Debian/Ubuntu)**
```bash
sudo apt update && sudo apt install nodejs npm git
```

**Linux (Arch/Manjaro)**
```bash
sudo pacman -S nodejs npm git
```

> **Linux — aviso inotify:** para evitar o erro `ENOSPC` no Metro Bundler:
> ```bash
> echo fs.inotify.max_user_watches=524288 | sudo tee /etc/sysctl.d/40-max-user-watches.conf && sudo sysctl --system
> ```

---

## Instalação e execução

```bash
# 1. Clone o repositório
git clone https://github.com/lfslDEV/pocket-envelopes.git
cd pocket-envelopes

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npx expo start
```

Para testar no dispositivo físico, instale o **Expo Go** ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) · [iOS](https://apps.apple.com/app/expo-go/id982107779)) e escaneie o QR Code exibido no terminal. Se estiver em redes diferentes, use `npx expo start --tunnel`.

---

## Estrutura do projeto

```
pocket-envelopes/
├── App.js                # Shell de navegação (estado telaAtual + bottom nav)
├── assets/               # Ícones e splash screen
├── src/
│   ├── firebaseConfig.js # Inicialização do Firebase (exporta { db })
│   ├── database.js       # SQLite — singleton, schema e queries
│   ├── storage.js        # CRUD de envelopes, contas e transações (SQLite + RTDB)
│   ├── sync.js           # Sincronização offline/online (fila → RTDB → pull)
│   ├── userKey.js        # Isolamento por usuário (sanitiza e-mail → chave RTDB)
│   ├── theme.js          # Design system (cores, tipografia, espaçamentos)
│   ├── config.js         # Constantes globais
│   ├── login.js          # Tela de login e cadastro (+ biometria)
│   ├── dashboard.js      # Tela inicial — resumo e gráfico por envelope
│   ├── list.js           # Tela de envelopes — SectionList + busca
│   ├── add.js            # Formulário de criação/edição de envelope
│   ├── contas.js         # Tela de contas bancárias/cartões
│   ├── transacoes.js     # Tela de histórico de transações
│   ├── camera.js         # Modal de câmera para captura de recibo
│   ├── mapa.js           # Modal de mapa para visualizar localização
│   └── perfil.js         # Tela de perfil do usuário
```

---

## Roadmap

- [ ] Selecionar local manualmente no mapa ao registrar uma despesa
- [ ] Mover orçamento entre envelopes
- [ ] Simulador de juros compostos (reserva de emergência)
- [ ] Editar perfil e senha
- [ ] Rollover mensal de saldo entre envelopes

---

_Projeto acadêmico desenvolvido para a disciplina de Laboratório de Desenvolvimento de Aplicativos Híbridos._
