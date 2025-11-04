# WMHTIA Innovation Assistant

Hackathon-ready single-page React application adopting the GOV.UK service design system visuals while carrying WMHTIA branding. It allows users to submit a question to a knowledge graph API (defaulting to the CloudFront distribution) and renders the returned answer and any supporting sources.

## Stack

- React 19 with TypeScript and Vite 7
- GOV.UK Design System (`govuk-frontend`) theming with WMHTIA identity
- Component-driven structure (`src/components`, `src/hooks`, `src/services`)

## Getting started

```bash
npm install
npm run dev
```

The development server runs on <http://localhost:5173> by default.

### Environment variables

The application posts questions to `VITE_ASK_API_URL`. If the variable is not provided, it falls back to the discovery endpoint used during development.

```bash
VITE_ASK_API_URL=https://d1vhufjc9w8vpb.cloudfront.net/api/ask
VITE_DEV_PROXY_ASK_TARGET=http://graph-rag-alb-890224410.eu-central-1.elb.amazonaws.com
VITE_DEV_PROXY_ASK_PATH=/ask
```

Create a `.env` file in the project root and override the value as required. The optional `VITE_DEV_PROXY_ASK_TARGET` enables a development proxy (see below) so you can sidestep CORS locally while keeping production requests pointed at the CloudFront distribution. Override `VITE_ASK_API_URL` if you need to target the ALB directly (for example, in environments without the CloudFront layer).

## Available scripts

- `npm run dev` – start the Vite development server
- `npm run build` – type check and create a production build
- `npm run preview` – serve the production build locally
- `npm run lint` – run ESLint across the project
- `npm run copy:govuk-assets` – sync fonts and icons from `govuk-frontend` into `public/assets`

## Continuous deployment

GitHub Actions workflow `Deploy GovAgent to AWS S3` automatically builds and deploys the app whenever changes land on `main` (and runs on pull requests for verification). Configure the following repository secrets so the pipeline can publish to your AWS stack:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET_NAME` (for example, `graph-rag-frontend-223516915321`)
- `CLOUDFRONT_DISTRIBUTION_ID` (`d1vhufjc9w8vpb`)

The site is served at `https://d1vhufjc9w8vpb.cloudfront.net`. If the distribution ID secret is present, the workflow will invalidate the CloudFront cache after each deploy.

## Project structure

```
src/
  components/      # Reusable GOV.UK-inspired UI building blocks
  hooks/           # Reusable logic (e.g. API state machine)
  services/        # API clients and data access
  styles/          # GOV.UK imports and application-specific styling
  types/           # Shared TypeScript interfaces
```

## Accessibility and UX

- GOV.UK typography, spacing and components for instant familiarity
- Error summary, inline validation and focus management cues for WCAG compliance
- Animated loading spinner with appropriate `aria-live` messaging
- Answers displayed using `white-space: pre-wrap` to retain formatting
 - WMHTIA header/footer content replaces default GOV.UK copy while maintaining established design tokens

## Production notes

- The build currently raises Sass deprecation warnings originating from the GOV.UK Design System. They are tracked upstream and do not affect functionality.
- Fonts and images are served from the compiled assets directory by Vite during build and preview.
- When running locally against the remote API, configure `VITE_DEV_PROXY_ASK_TARGET` so the Vite dev server proxies `/ask` to the upstream host. In production the app targets `https://d1vhufjc9w8vpb.cloudfront.net/api/ask` by default; set `VITE_ASK_API_URL` if you need a different origin (for example, the ALB URL `http://graph-rag-alb-890224410.eu-central-1.elb.amazonaws.com/ask`).
