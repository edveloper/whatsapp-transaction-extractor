import nextConfig from "eslint-config-next"

const config = [
  ...nextConfig,
  {
    ignores: [".next/**", ".test-dist/**", "node_modules/**"],
  },
]

export default config
