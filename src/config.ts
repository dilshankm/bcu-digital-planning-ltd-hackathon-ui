const DEFAULT_ASK_ENDPOINT = 'https://d1vhufjc9w8vpb.cloudfront.net/api/ask'

const devAskPath = import.meta.env.VITE_DEV_PROXY_ASK_PATH ?? '/ask'

const askEndpoint =
  import.meta.env.DEV && import.meta.env.VITE_DEV_PROXY_ASK_TARGET
    ? devAskPath
    : import.meta.env.VITE_ASK_API_URL ?? DEFAULT_ASK_ENDPOINT

export const config = {
  askEndpoint,
} as const

export type AppConfig = typeof config

