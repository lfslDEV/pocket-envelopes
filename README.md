
# Pocket Envelopes

Um aplicativo mobile de gestão financeira pessoal baseado no método de orçamento por envelopes (Envelope Budgeting). Desenvolvido em React Native com Expo, focado em performance, acesso nativo a hardware e processamento otimizado (local-first).

----------

## Tabela de Conteúdos

-   [Funcionalidades](https://www.google.com/search?q=%23funcionalidades)
    
-   [Pré-requisitos](https://www.google.com/search?q=%23pr%C3%A9-requisitos)
    
-   [Instalação e Execução](https://www.google.com/search?q=%23instala%C3%A7%C3%A3o-e-execu%C3%A7%C3%A3o)
    
-   [Estrutura do Projeto](https://www.google.com/search?q=%23estrutura-do-projeto)
    
-   [Trabalhos Futuros (Roadmap)](https://www.google.com/search?q=%23trabalhos-futuros-roadmap)
    

----------

## Funcionalidades

O projeto integra diversas APIs nativas do dispositivo móvel para entregar uma experiência completa:

-   **Autenticação Biométrica:** Proteção do aplicativo utilizando a biometria nativa do dispositivo (Fingerprint/FaceID) via `expo-local-authentication`.
    
-   **Armazenamento Local:** Persistência de dados offline utilizando `AsyncStorage`, garantindo privacidade e velocidade.
    
-   **Captura de Recibos:** Integração com a câmera do dispositivo (`expo-camera`) para anexar fotos de notas fiscais diretamente nos envelopes.
    
-   **Geolocalização Otimizada:** Captura de coordenadas GPS em segundo plano (UX não-bloqueante) via `expo-location` no momento da criação da despesa.
    
-   **Mapeamento Interativo:** Renderização do local exato da despesa em um mapa nativo utilizando `react-native-maps`.
    

----------

## Pré-requisitos

Este projeto utiliza o ecossistema Expo, permitindo o desenvolvimento e execução multiplataforma. Você precisará do **Node.js** e do **Git** instalados na sua máquina.

## Configuração do Ambiente

-   **Windows:** Baixe e instale os executáveis oficiais do [Node.js](https://www.google.com/search?q=https://nodejs.org/) e do [Git](https://www.google.com/search?q=https://git-scm.com/). Alternativamente, via terminal com `winget`:
    
    DOS
    
    ```
    winget install OpenJS.NodeJS
    winget install Git.Git
    ```
    
-   **macOS:** A forma mais recomendada é utilizando o gerenciador de pacotes [Homebrew](https://www.google.com/search?q=https://brew.sh/):
    
    Bash
    
    ```
    brew install node git
    ```
    
    _(Nota para iOS: Para rodar o app no Simulador do iPhone diretamente no Mac, é necessário instalar o **Xcode** gratuitamente pela Mac App Store)._
    

-   **Linux (Debian / Ubuntu / Pop!_OS):**
    
    Bash
    
    ```
    sudo apt update && sudo apt install nodejs npm git
    ```
    
-   **Linux (Arch / Manjaro):**
    
    Bash
    
    ```
    sudo pacman -S nodejs npm git
    ```

> **Aviso importante para usuários Linux:** Para evitar o erro `ENOSPC` (limite de arquivos observados) no Metro Bundler, aumente o limite do `inotify` no seu sistema rodando o comando abaixo: `echo fs.inotify.max_user_watches=524288 | sudo tee /etc/sysctl.d/40-max-user-watches.conf && sudo sysctl --system`

## Dispositivo Físico (Testes)

-   Instale o aplicativo **Expo Go** no seu smartphone, disponível gratuitamente na [App Store (iOS)](https://www.google.com/search?q=https://apps.apple.com/app/expo-go/id982107779) ou na [Google Play (Android)](https://www.google.com/search?q=https://play.google.com/store/apps/details%3Fid%3Dhost.exp.exponent).
    

----------

## Instalação e Execução

1.  **Clone o repositório:**
    
    Bash
    
    ```
    git clone https://github.com/SEU_USUARIO/pocket-envelopes.git
    cd pocket-envelopes
    ```
    
2.  **Instale as dependências:**
    
    Bash
    
    ```
    npm install
    ```
    
3.  **Inicie o servidor de desenvolvimento:**
    
    Bash
    
    ```
    npx expo start -c --tunnel
    ```
    
4.  **Teste no dispositivo:** Abra o aplicativo **Expo Go** no seu smartphone e escaneie o QR Code exibido no terminal.
    

----------

## Estrutura do Projeto

A arquitetura do projeto foi dividida em componentes funcionais dentro da pasta `src/`:

```
pocket-envelopes/
├── App.js               # Ponto de entrada e gerenciamento de estado global
├── package.json         # Dependências do projeto (Expo SDK)
└── src/
    ├── add.js           # Componente de input para criação de envelopes
    ├── camera.js        # Componente modal de captura de recibos (CameraView)
    ├── list.js          # Componente FlatList para renderização dos cards
    ├── login.js         # Componente de barreira biométrica
    └── mapa.js          # Componente modal de renderização do mapa (MapView)
```

----------

## Trabalhos Futuros (Roadmap)

Conforme mapeado nas _Issues_ deste repositório, o aplicativo evoluirá para incorporar mecânicas consagradas de orçamento por envelopes (Envelope Budgeting). A arquitetura local e as futuras regras de negócio são fortemente inspiradas em referências do mercado, como o **YNAB (You Need A Budget)**, e na filosofia local-first e open-source do **Actual Budget**:

-   [ ] **Orçamento de Envelopes:** Adição da propriedade `saldo` para definição de limites de gastos.
    
-   [ ] **Abatimento de Despesas:** Cálculo automático subtraindo o valor do recibo do saldo do envelope.
    
-   [ ] **Roll with the Punches:** Sistema de transferência de saldo inter-envelopes para cobrir imprevistos.
    
-   [ ] **Feedback UI/UX:** Alteração dinâmica de cores baseada na saúde financeira do envelope (Verde, Cinza, Vermelho).
    

----------

_Projeto acadêmico desenvolvido para a disciplina de Laboratório de Desenvolvimento de Aplicativos Híbridos._
