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

The development server runs on <http://localhost:5173> by default. Use Node.js 20 or later to match the CI environment.

### Environment variables

The application posts questions to the value defined by `VITE_API_BASE_URL` (or the legacy `VITE_ASK_API_URL`). If neither is provided, it falls back to the discovery endpoint used during development.

```bash
VITE_API_BASE_URL=https://d1vhufjc9w8vpb.cloudfront.net
VITE_DEV_PROXY_ASK_TARGET=http://graph-rag-alb-890224410.eu-central-1.elb.amazonaws.com
VITE_DEV_PROXY_ASK_PATH=/ask
```

Create a `.env` file in the project root and override the value as required. The optional `VITE_DEV_PROXY_ASK_TARGET` enables a development proxy (see below) so you can sidestep CORS locally while keeping production requests pointed at the CloudFront distribution. Override `VITE_API_BASE_URL` if you need to target the ALB directly (for example, `http://graph-rag-alb-890224410.eu-central-1.elb.amazonaws.com`).

## Available scripts

- `npm run dev` – start the Vite development server
- `npm run build` – type check and create a production build
- `npm run preview` – serve the production build locally
- `npm run lint` – run ESLint across the project
- `npm run copy:govuk-assets` – sync fonts and icons from `govuk-frontend` into `public/assets`

## Advanced demo capabilities

- Multi-turn conversation sessions with persistent history and session management
- Automated query refinement feedback, including refinement timelines and metadata panes
- Interactive graph explorer for nodes, relationships, and schema snapshots
- CSV upload workflow to extend the graph schema during demonstrations

## Continuous deployment

GitHub Actions workflow `Deploy GovAgent to AWS S3` automatically builds and deploys the app whenever changes land on `main` (and runs on pull requests for verification). Configure the following repository secrets so the pipeline can publish to your AWS stack:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET_NAME` (for example, `graph-rag-frontend-223516915321`; enter only the value—no `s3://` prefix, no `S3_BUCKET_NAME=` key, and no trailing spaces)
- `CLOUDFRONT_DISTRIBUTION_ID` (`d1vhufjc9w8vpb`; enter only the value, no `CLOUDFRONT_DISTRIBUTION_ID=` prefix)
