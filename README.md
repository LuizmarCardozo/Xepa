# Xepa

O Xepa é uma aplicação web de feira local. Clientes podem descobrir ofertas de comerciantes, montar uma cesta e fazer pedidos para retirada ou entrega combinada. Comerciantes podem publicar ofertas e acompanhar os pedidos recebidos.

## Arquitetura e estado atual

O frontend é feito com HTML, CSS e JavaScript, sem framework. A navegação funciona como uma **Single Page Application (SPA)**: `www/index.html` mantém o ponto de entrada e `www/js/router.js` carrega os arquivos HTML de `www/pages/` e os insere na tela sem recarregar o documento inteiro.

O projeto usa Firebase Authentication para autenticação e Cloud Firestore para os dados da aplicação. O upload de imagens de ofertas pode usar Supabase Storage quando configurado; sem essa configuração, o app mantém as imagens no formato de dados usado pelo fluxo atual.

**O app ainda não está empacotado como aplicativo híbrido Cordova.** A pasta `www/` contém o frontend web, mas este repositório não tem `config.xml`, dependência ou scripts Cordova, nem configuração nativa para gerar APK ou IPA. Portanto, Cordova é uma possibilidade futura, não uma integração disponível nesta versão.

## Funcionalidades implementadas

### Clientes

- Cadastro como cliente ou comerciante e login com e-mail e senha pelo Firebase.
- Login com Google e recuperação de senha, quando o provedor Google estiver habilitado no Firebase.
- Consulta de ofertas, com pesquisa por texto e filtros por categoria.
- Filtro de ofertas próximas: depende da permissão de localização do navegador e de ofertas com localização cadastrada.
- Visualização de detalhes de uma oferta e montagem de cesta, armazenada localmente no navegador.
- Criação de pedidos com retirada ou entrega combinada. O app divide os itens em pedidos para os respectivos comerciantes.
- Acompanhamento dos pedidos e das atualizações de status em tempo real.
- Consulta e edição do perfil.

### Comerciantes

- Publicação, edição e exclusão de ofertas, incluindo preço, descrição, categoria, unidade, imagem e localização opcional.
- Consulta dos próprios produtos e dos pedidos recebidos.
- Publicação de novidades com texto e imagem.
- Atualização dos pedidos pelas etapas disponíveis na tela, como aceitar, marcar como pronto e concluir.

## Tecnologias e dados

- **Frontend:** HTML, CSS e JavaScript nativo.
- **Autenticação e dados:** Firebase Authentication e Cloud Firestore.
- **Imagens de ofertas:** Supabase Storage é opcional. Sem ele, o fluxo existente conserva a imagem em formato de dados; o carrinho e alguns dados de perfil também usam armazenamento local do navegador.
- **Hospedagem:** Firebase Hosting, configurado para publicar `www/`.

As regras de acesso do Firestore estão em `firestore.rules`. Há também um arquivo `storage.rules`, mas a configuração atual de `firebase.json` não o inclui no deploy. O fluxo atual de imagens usa Supabase Storage opcionalmente, não o Firebase Storage.

## Executar localmente

É necessário servir os arquivos por HTTP; abrir `www/index.html` diretamente com `file://` não funciona corretamente, pois o app carrega páginas com `fetch()` e módulos JavaScript.

Com Python instalado, na raiz do projeto:

```powershell
py -m http.server 8080 --directory www
```

Em outros ambientes, pode-se usar:

```sh
python3 -m http.server 8080 --directory www
```

Abra <http://localhost:8080>. O app usa o projeto Firebase `xepa-50d4b`, configurado em `www/js/backend.js` e `.firebaserc`. Para autenticação e persistência, habilite no Console do Firebase Authentication (e-mail/senha; Google se desejado) e Cloud Firestore. As regras locais do Firestore estão em `firestore.rules`.

## Configurar imagens de ofertas com Supabase Storage (opcional)

O bucket público esperado é `produtos`. No Supabase, habilite Firebase como provedor de autenticação de terceiros, usando o projeto Firebase `xepa-50d4b`. Este app estático não carrega `.env.local` nem variáveis `NEXT_PUBLIC_*`: copie a Project URL e uma chave pública (`sb_publishable_...` ou `anon`) para `url` e `anonKey` em `window.XEPA_SUPABASE_CONFIG`, no início de `www/index.html`. **Nunca coloque uma chave `service_role` no navegador.**

Execute estas políticas no SQL Editor do Supabase para permitir leitura pública das imagens e escrita/exclusão apenas na pasta do usuário autenticado. Os tokens Firebase normalmente não incluem `role: authenticated`; por isso, as políticas de escrita usam `to public` e validam o UID no caminho do arquivo.

```sql
drop policy if exists "Public can read offer images" on storage.objects;
drop policy if exists "Users can upload their offer images" on storage.objects;
drop policy if exists "Users can delete their offer images" on storage.objects;

create policy "Public can read offer images"
on storage.objects for select
using (bucket_id = 'produtos');

create policy "Users can upload their offer images"
on storage.objects for insert to public
with check (
  bucket_id = 'produtos'
  and (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
);

create policy "Users can delete their offer images"
on storage.objects for delete to public
using (
  bucket_id = 'produtos'
  and (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
);
```

Sem as credenciais Supabase, o app continua usando o fluxo alternativo de imagens. Com o Storage ativo, o caminho e a URL pública da imagem são associados à oferta; substituir ou excluir a oferta também tenta remover o arquivo anterior.

## Publicar no Firebase Hosting

Depois de autenticar o Firebase CLI e confirmar o projeto de destino:

```powershell
npx firebase-tools login
npx firebase-tools deploy --only hosting,firestore:rules
```

O deploy corresponde aos alvos configurados em `firebase.json`: Hosting e regras do Firestore. As regras de Firebase Storage não estão configuradas como alvo de deploy neste repositório.

## Limites desta versão

- O checkout é demonstrativo: não há pagamento dentro do app; pagamento e logística são combinados entre cliente e comerciante.
- O app executável neste checkout é a versão web. Ainda não há configuração Cordova nem geração de aplicativo Android/iOS.
- A tela de localização próxima depende de HTTPS ou `localhost`, permissão de geolocalização do navegador e coordenadas cadastradas nas ofertas.
