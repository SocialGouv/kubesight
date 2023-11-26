import withMT from "@material-tailwind/react/utils/withMT"

import type { Config } from "tailwindcss"
import colors from "tailwindcss/colors"

export default withMT({
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      black: colors.black,
      white: colors.white,
      gray: colors.gray,
      emerald: colors.emerald,
      indigo: colors.indigo,
      yellow: colors.yellow,
      red: colors.red,
      orange: colors.orange,
    },
  },
  plugins: [],
})
