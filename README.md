# IA en Excel

[![license](https://img.shields.io/github/license/miltonsalcedo/IA-en-excel.svg?style=flat-square)](LICENSE)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

Complemento (add-in) para Microsoft Excel con agente de IA usando modelos GROQ y OpenRouter.

## Tabla de contenidos

- [Seguridad](#seguridad)
- [Contexto](#contexto)
- [Instalación](#instalación)
- [Uso](#uso)
- [Objetivos](#objetivos)
- [Referencias](#referencias)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

## Seguridad

- **API keys**: No expongas tus claves de GROQ u OpenRouter en el cliente. El backend debe gestionarlas mediante variables de entorno (`GROQ_API_KEY`, `OPENROUTER_API_KEY`).
- **HTTPS**: En producción, sirve el add-in y el backend por HTTPS.
- **Excel Online**: No admite `localhost`; requiere URLs accesibles por internet.

## Contexto

Este proyecto nace de la idea de tener en Excel una experiencia similar a **Claude for Excel**: un panel lateral con chat y acciones sobre la hoja (explicar libro, transformar datos, depurar fórmulas, modelos financieros), pero usando la **API de GROQ** y **OpenRouter** en lugar de Claude.

La v1 soporta solo cloud (GROQ + un modelo de OpenRouter). La arquitectura está preparada para añadir más proveedores (Ollama, modelos custom HTTP) y modos de privacidad.

*Referencia: conversación sobre "Claude en Excel y GROQ" — factibilidad de un complemento con agente de IA usando modelos GROQ.*

## Instalación

**Requisitos**: Node.js 18+, npm o pnpm.

### Backend

```bash
cd backend
npm install
```

Configura las variables de entorno (por ejemplo en `.env`):

```
GROQ_API_KEY=tu_clave_groq
GROQ_MODEL=llama-3.1-8b-instant
OPENROUTER_API_KEY=tu_clave_openrouter
OPENROUTER_MODEL=openai/gpt-3.5-turbo
PORT=4000
```

### Frontend

```bash
cd frontend
npm install
```

### Iconos (opcional)

Coloca iconos 16x16, 32x32 y 80x80 px en `frontend/public/assets/` como `icon-16.png`, `icon-32.png`, `icon-80.png` para que el manifest los cargue.

## Uso

### Desarrollo local

1. Inicia el backend:
   ```bash
   cd backend && npm run dev
   ```

2. Inicia el frontend:
   ```bash
   cd frontend && npm run dev
   ```

3. El task pane se sirve en `http://localhost:5173`.

### Cargar el complemento en Excel

- **Excel Online**: Inicio > Complementos > Administrar mis complementos > Cargar mi complemento > selecciona `manifest.xml`.  
  **Nota**: Excel Online no admite `localhost`; necesitas una URL HTTPS pública (por ejemplo, ngrok o hosting).

- **Excel de escritorio (Windows)**: Crea una carpeta compartida, copia el manifest allí, añade la ruta en Centro de confianza > Catálogos de complementos de confianza. Luego: Inicio > Complementos > Carpeta compartida.

### Configuración del manifest

El `manifest.xml` debe apuntar a la URL donde corre tu frontend. Para desarrollo local usa `http://localhost:5173` (solo Excel de escritorio). Para Excel Online usa una URL HTTPS accesible desde internet.

### Despliegue en Vercel

1. Sube el proyecto a GitHub.
2. Conecta el repositorio en [vercel.com](https://vercel.com) (Import Git Repository).
3. En **Project Settings > Environment Variables**, añade:
   - `GROQ_API_KEY`, `GROQ_MODEL`
   - `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`
4. Despliega. Vercel generará una URL como `https://ia-en-excel.vercel.app`.
5. Copia `manifest.vercel.xml` a `manifest.xml` y reemplaza `TU-DOMINIO.vercel.app` por tu URL de Vercel.
6. Añade iconos en `frontend/public/assets/` (icon-16.png, icon-32.png, icon-80.png) y vuelve a desplegar si hace falta.
7. Carga el manifest en Excel Online (Inicio > Complementos > Cargar mi complemento).

### Subir a GitHub

```bash
git init
git add .
git commit -m "feat: IA en Excel - add-in con GROQ y OpenRouter"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/ia-en-excel.git
git push -u origin main
```

No subas `.env` (claves API). Usa `.env.example` como plantilla.

## Objetivos

- [x] Complemento de Excel (Office Add-in) con panel lateral (task pane)
- [x] Chat integrado con GROQ y OpenRouter
- [x] Capa de proveedores extensible (GroqProvider, OpenRouterProvider)
- [x] Vista previa de acciones propuestas por la IA
- [ ] Acciones sobre el libro: explicar, fórmula, limpiar datos, crear gráfico (MVP en progreso)
- [ ] Historial persistente por libro
- [ ] Soporte Ollama/local (v2)

## Referencias

- [Office Add-ins (Excel)](https://learn.microsoft.com/en-us/office/dev/add-ins/excel/excel-add-ins-overview)
- [Documentación API GROQ](https://console.groq.com/docs)
- [OpenRouter Models](https://openrouter.ai/models)
- [Agente + add-in (Copilot)](https://learn.microsoft.com/en-us/office/dev/add-ins/develop/agent-and-add-in)

## Contribuir

Se aceptan PRs. Si editas el README, sigue el estilo [standard-readme](https://github.com/RichardLitt/standard-readme).

## Licencia

MIT © Milton Salcedo. Ver [LICENSE](LICENSE).
