# BarberGestão - Sistema de Agendamento & Barbearia

Sistema web moderno e responsivo para barbearias, com agendamento online de serviços para clientes, gestão de assinaturas recorrentes integradas com InfinitePay, controle de caixa diário, relatórios de clientes e painel administrativo completo.

---

## 🚀 Deploy Automático no GitHub Pages

Este repositório já está 100% configurado para **Deploy Automático no GitHub** através do **GitHub Actions** (`.github/workflows/deploy.yml`) e com **todos os caminhos relativos** (`base: './'`).

### Passo a passo para ativar no seu GitHub:

1. **Envie o código para o seu repositório GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - BarberGestão"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO.git
   git push -u origin main
   ```

2. **Ative o GitHub Pages:**
   - Acesse seu repositório no GitHub.
   - Vá em **Settings** (Configurações) > **Pages** (no menu lateral esquerdo).
   - Na seção **Build and deployment** > **Source**, selecione:
     👉 **GitHub Actions**
   
3. **Pronto! 🎉**
   - A cada `git push` para a branch `main` ou `master`, o GitHub Actions irá:
     1. Instalar as dependências automaticamente
     2. Compilar o projeto com todos os caminhos relativos (`./assets/...`)
     3. Publicar automaticamente no seu link do GitHub Pages (ex: `https://seu-usuario.github.io/seu-repositorio/`)

---

## 🛠️ Comandos de Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (Vite + Webhook Server)
npm run dev

# Compilar para produção
npm run build

# Pré-visualizar a build de produção localmente
npm run preview
```

---

## 📦 Estrutura e Destaques

- **Caminhos Relativos:** Configurado com `base: './'` no `vite.config.ts`, permitindo que o app rode em qualquer subdiretório ou domínio sem quebrar imagens, scripts ou CSS.
- **Suporte a SPA no GitHub Pages:** Arquivo `public/404.html` incluso para redirecionamento correto de rotas.
- **Webhook InfinitePay:** Endpoint `/api/webhooks/infinitepay` pronto para receber notificações de pagamento via Cartão de Crédito e PIX.
