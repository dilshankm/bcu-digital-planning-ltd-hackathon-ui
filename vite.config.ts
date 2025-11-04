import { defineConfig, loadEnv } from 'vite'
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

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: proxyTarget
      ? {
          proxy: {
            [proxyPath]: {
              target: proxyTarget,
              changeOrigin: true,
              secure: false,
            },
          },
        }
      : undefined,
  }
})
