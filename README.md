# ⚙️ Manutenção OS

Aplicativo híbrido (PWA + Android via Capacitor 6) para gestão de manutenção, ordens de serviço, rotinas diárias, vistorias, coleta de dados, inventário, atendimentos, reparos e acompanhamento de terceiros, com geração rápida de relatórios formatados para WhatsApp.

## 🚀 Funcionalidades

- **📊 Dashboard**: Visão geral com contadores rápidos, atividades recentes e atendimentos pendentes.
- **📝 Registro de Atividade**: Cadastro de manutenções (Preventiva, Corretiva, Inspeção, Preditiva) com lista de equipamentos verificados e serviços executados.
- **✅ Rotinas Diárias**: Criação de modelos de checklist e registro de execuções com status individual por tarefa.
- **📄 Relatórios**: Gestão de relatórios periódicos com exportação CSV e impressão.
- **🔍 Vistorias**: Inspeções técnicas (Conforme / Não conforme) com envio direto para o WhatsApp.
- **📡 Coleta de Dados**: Registro de leituras e parâmetros técnicos de equipamentos.
- **📦 Inventário**: Controle de múltiplos itens e status operacionais por setor.
- **🛠️ Atendimentos & 🔧 Reparos**: Registro ágil de chamados, defeitos e soluções aplicadas.
- **🤝 Acompanhamento de Terceiros**: Controle de serviços prestados por empresas terceirizadas.
- **📷 Fotos & Galeria**: Anexação de fotos (câmera nativa Capacitor ou navegador) em qualquer registro.
- **💾 Backup & Exportação**: Exportação de tabelas em CSV (compatível com Excel PT-BR), backup/restauração em JSON e impressão.

## 🛠️ Como Executar

### Modo Web / PWA
Basta servir a pasta `www/` com qualquer servidor HTTP estático ou abrir `www/index.html` no navegador.

### Modo Android (Capacitor)
```bash
npm install
npx cap add android
npx cap sync android
npx cap open android
```

