import type { Config } from "tailwindcss"
import withMT from "@material-tailwind/react/utils/withMT"

const config: Config = withMT({
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {},
  plugins: [],
})
export default config
