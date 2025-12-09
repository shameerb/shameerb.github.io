import type { Config } from "tailwindcss";

export default {
	plugins: [require("@tailwindcss/typography")],
	theme: {
		extend: {
			fontFamily: {
				sans: ["-apple-system", "BlinkMacSystemFont", "Inter", "IBM Plex Sans", "Segoe UI", "Helvetica", "Arial", "sans-serif"],
				serif: ["Georgia", "Times New Roman", "Times", "serif"],
				mono: ["Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
			},
			typography: () => ({
				DEFAULT: {
					css: {
						maxWidth: "65ch",
						color: "var(--color-tx)",
						fontSize: "1.125rem",
						lineHeight: "1.4",
						letterSpacing: "-0.011em",
						a: {
							color: "var(--color-link)",
							textUnderlineOffset: "2px",
							"&:hover": {
								"@media (hover: hover)": {
									textDecorationColor: "var(--color-link)",
									textDecorationThickness: "2px",
								},
							},
						},
						blockquote: {
							borderLeftWidth: "0",
							color: "var(--color-tx-2)",
							fontStyle: "normal",
							fontSize: "1.125rem",
							lineHeight: "1.4",
						},
						code: {
							color: "var(--color-tx)",
							backgroundColor: "var(--color-ui)",
							border: "none",
							borderRadius: "0.25rem",
							padding: "0.2em 0.4em",
							fontSize: "0.875em",
						},
						"code::before": {
							content: '""',
						},
						"code::after": {
							content: '""',
						},
						pre: {
							backgroundColor: "var(--color-ui)",
							borderRadius: "0.5rem",
							padding: "1rem",
							fontSize: "0.875em",
							lineHeight: "1.4",
						},
						hr: {
							borderColor: "var(--color-ui-2)",
							borderTopStyle: "dashed",
							marginTop: "2em",
							marginBottom: "2em",
						},
						strong: {
							color: "var(--color-tx)",
							fontWeight: "600",
						},
						h1: {
							fontSize: "1.25rem",
							lineHeight: "1.3",
							letterSpacing: "-0.02em",
							fontWeight: "500",
							marginTop: "0",
							marginBottom: "0.75em",
							paddingBottom: "0.5em",
							// borderBottom: "1px solid var(--color-ui-2)",
						},
						h2: {
							fontSize: "1.125rem",
							lineHeight: "1.3",
							letterSpacing: "-0.02em",
							fontWeight: "500",
							marginTop: "1.5em",
							marginBottom: "0.75em",
							paddingBottom: "0.5em",
							// borderBottom: "1px solid var(--color-ui-2)",
						},
						h3: {
							fontSize: "1rem",
							lineHeight: "1.3",
							letterSpacing: "-0.02em",
							fontWeight: "500",
							marginTop: "1.5em",
							marginBottom: "0.75em",
						},
						p: {
							marginTop: "1em",
							marginBottom: "1em",
						},
						sup: {
							marginInlineStart: "calc(var(--spacing) * 0.5)",
							a: {
								"&:after": {
									content: "']'",
								},
								"&:before": {
									content: "'['",
								},
								"&:hover": {
									"@media (hover: hover)": {
										color: "var(--color-link)",
									},
								},
							},
						},
						/* Table */
						"tbody tr": {
							borderBottomWidth: "none",
						},
						tfoot: {
							borderTop: "1px dashed var(--color-ui-2)",
						},
						thead: {
							borderBottomWidth: "none",
						},
						"thead th": {
							borderBottom: "1px dashed var(--color-ui-2)",
							fontWeight: "600",
						},
						'th[align="center"], td[align="center"]': {
							"text-align": "center",
						},
						'th[align="right"], td[align="right"]': {
							"text-align": "right",
						},
						'th[align="left"], td[align="left"]': {
							"text-align": "left",
						},
					},
				},
				sm: {
					css: {
						code: {
							fontSize: "0.875em",
							fontWeight: "400",
						},
					},
				},
			}),
		},
	},
} satisfies Config;
