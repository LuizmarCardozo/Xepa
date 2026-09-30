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
