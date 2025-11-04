const DEFAULT_API_BASE_URL = 'https://d1vhufjc9w8vpb.cloudfront.net'

const normaliseBaseUrl = (value: string) => value.replace(/\/$/, '')

const apiBaseUrl = normaliseBaseUrl(
  import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_ASK_API_URL ?? DEFAULT_API_BASE_URL,
)

const useDevProxy = Boolean(import.meta.env.DEV && import.meta.env.VITE_DEV_PROXY_ASK_TARGET)

const buildApiPath = (path: string) => {
  const normalisedPath = path.startsWith('/') ? path : `/${path}`
  return useDevProxy ? normalisedPath : `${apiBaseUrl}${normalisedPath}`
}

export const config = {
  apiBaseUrl,
  useDevProxy,
  buildApiPath,
} as const

export type AppConfig = typeof config

