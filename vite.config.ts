import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'
import { createHash, webcrypto as nodeWebCrypto } from 'node:crypto'
import { fileURLToPath, URL } from 'node:url'

type CryptoWithHash = typeof nodeWebCrypto & {
  hash?: (algorithm: string, data: ArrayBuffer) => Promise<ArrayBuffer>
}

const ensureCryptoHash = () => {
  const cryptoGlobal = (globalThis.crypto ?? nodeWebCrypto) as CryptoWithHash

  if (typeof cryptoGlobal.hash !== 'function') {
    Object.defineProperty(cryptoGlobal, 'hash', {
      value: async (algorithm: string, data: ArrayBuffer) => {
        const normalised = algorithm.toLowerCase().replace(/^sha-/, 'sha')
        const hash = createHash(normalised)
        hash.update(Buffer.from(data))
        const digest = hash.digest()
        return digest.buffer.slice(digest.byteOffset, digest.byteOffset + digest.byteLength)
      },
      configurable: true,
      writable: true,
    })
  }

  if (!globalThis.crypto) {
    Object.defineProperty(globalThis, 'crypto', {
      value: cryptoGlobal,
      configurable: true,
      writable: true,
    })
  }
}

ensureCryptoHash()

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_DEV_PROXY_ASK_TARGET
  const proxyPath = env.VITE_DEV_PROXY_ASK_PATH ?? '/ask'

  const normalisePrefix = (value: string) => (value.startsWith('/') ? value : `/${value}`)
  const createProxyOptions = (target: string): ProxyOptions => ({
    target,
    changeOrigin: true,
    secure: false,
  })

  const baseProxyPath = normalisePrefix(proxyPath)

  const proxyEntries = proxyTarget
    ? ['ask', 'session', 'schema', 'explore', 'import'].reduce<Record<string, string | ProxyOptions>>(
        (accumulator, key) => {
          const prefix = normalisePrefix(key)
          accumulator[prefix] = createProxyOptions(proxyTarget)
          accumulator[`${prefix}/`] = createProxyOptions(proxyTarget)
          return accumulator
        },
        {
          [baseProxyPath]: createProxyOptions(proxyTarget),
        },
      )
    : undefined

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: proxyEntries
      ? {
          proxy: proxyEntries,
        }
      : undefined,
  }
})
