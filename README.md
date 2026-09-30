# Xepa

Aplicativo de feira local para a demonstração da faculdade. O cliente consulta ofertas, monta um carrinho e envia pedidos para os comerciantes. O comerciante publica ofertas e novidades e atualiza os pedidos recebidos.

## Executar no navegador

O app usa páginas carregadas por `fetch()` e módulos Firebase, então precisa ser aberto por um servidor HTTP, não por `file://`.

```bash
python3 -m http.server 8080 --directory www
```

Abra <http://localhost:8080>.

O Firebase usado pela demonstração é o projeto configurado em `www/js/backend.js` e `.firebaserc`. No Console do Firebase, habilite Authentication com e-mail/senha, Firestore e Storage. As regras locais estão em `firestore.rules` e `storage.rules`.

Para publicar Hosting e as regras depois de autenticar o Firebase CLI:

```bash
npx firebase-tools login
npx firebase-tools deploy --only hosting,firestore:rules,storage
```

## Roteiro de demonstração

1. Crie uma conta do tipo **Comerciante** e publique uma oferta.
2. Em uma janela anônima ou outro navegador, crie uma conta **Cliente**.
3. Busque a oferta, adicione ao carrinho e envie o pedido, escolhendo retirada ou entrega combinada.
4. Entre novamente como comerciante, abra **Pedidos** e atualize o status.
5. Volte à conta do cliente para acompanhar o pedido. O perfil comerciante também pode publicar uma novidade com texto e foto.

O checkout é demonstrativo: pagamento e logística são combinados diretamente entre cliente e comerciante; não há cobrança dentro do app.

## Aplicativo Cordova

Este repositório ainda não contém a configuração nativa Cordova necessária para gerar APK/IPA. A versão de demonstração no navegador é o caminho executável neste checkout. O login Google também depende da configuração do projeto Firebase e pode exigir fluxo nativo para funcionar dentro de WebView; o login por e-mail/senha é a opção da apresentação.

---

## Concepção inicial do projeto (documentação preservada da main)

Aplicativo mobile desenvolvimento baseado no framework Apache Cordova



### 1. Visão geral

Estamos desenvolvendo um **aplicativo mobile de ofertas**, inicialmente construído como uma aplicação web utilizando:

* **HTML**
* **CSS**
* **JavaScript puro**
* **Apache Cordova** aplicação web em aplicativo Android
* Backend planejado com **Firebase ou Supabase**

A ideia é desenvolver tudo no **VS Code**, mantendo uma arquitetura simples e modular, sem criar uma quantidade excessiva de pastas e arquivos.

O aplicativo será inicialmente desenvolvido e testado como uma aplicação mobile/web e, posteriormente, empacotado para gerar o aplicativo nativo.

---

### 2. Conceito visual

O projeto começou a partir de um protótipo de baixa fidelidade desenhado para representar a tela inicial.

A Home possui:

* Logo no topo
* Barra de pesquisa
* Botão de menu
* Título "FEED DE OFERTAS"
* Lista de ofertas
* Cards de produtos/ofertas
* Sistema de favoritos
* Botão `+` para adicionar uma oferta
* Navegação inferior com:

  * `+`
  * `HOME`
  * `PERFIL`

A identidade visual utiliza principalmente:

```text
Verde claro: #9EBF26
Verde escuro: #08400B
Fundo: branco
```

O objetivo é ter uma interface **limpa, simples, moderna e focada em dispositivos móveis**.

---

### 3. Arquitetura definida

A arquitetura foi propositalmente simplificada.

Não queremos uma estrutura com dezenas de pastas.

A ideia atual é:

```text
meu-app/
│
├── www/
│   ├── index.html
│   │
│   ├── pages/
│   │   ├── login.html
│   │   ├── home.html
│   │   ├── perfil.html
│   │   └── ...
│   │
│   ├── css/
│   │   └── style.css
│   │
│   ├── js/
│   │   ├── app.js
│   │   ├── backend.js
│   │   └── pages.js
│   │
│   └── assets/
│       ├── imagens/
│       └── icons/
│
├── config.xml
└── package.json
```

A ideia é **não separar demais as responsabilidades**.

Conforme o projeto crescer, arquivos só serão separados quando realmente houver necessidade.

---

## 4. Home atual

A Home já foi criada em HTML e JavaScript.

O HTML possui:

* Header
* Logo
* Pesquisa
* Menu
* Feed de ofertas
* Contador de ofertas
* Área dinâmica para os cards
* Mensagem para quando nenhuma oferta for encontrada
* Barra de navegação inferior
* Menu lateral
* Modal para adicionar oferta

A estrutura HTML já está preparada para carregar as ofertas dinamicamente através do JavaScript.  

A logo atual está sendo carregada através de:

```text
assets/XEPPPA.png
```

conforme o HTML atual. 

---



> **Estamos desenvolvendo um aplicativo mobile de ofertas chamado provisoriamente "Xepa". O frontend será feito com HTML, CSS e JavaScript puro, utilizando Apache Cordova posteriormente para transformar a aplicação em Android. A arquitetura deve permanecer simples e modular, sem excesso de pastas. A Home já foi criada e possui logo, pesquisa, feed dinâmico de ofertas, favoritos usando localStorage, menu lateral, botão de adicionar oferta, modal e navegação inferior HOME/PERFIL. As cores principais são #9EBF26 e #08400B, com fundo branco. O backend ainda não foi escolhido, sendo Firebase ou Supabase as opções. O desenvolvimento deve continuar aproveitando a estrutura existente, evitando reescrever o que já funciona. As próximas funcionalidades serão adicionadas gradualmente, começando pelas outras páginas e depois pela integração com o backend.**
