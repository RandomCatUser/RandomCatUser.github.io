module.exports = {
	darkMode: 'class',
	content: [
		"./404.html",
		"./about.html",
		"./guestbook/**/*.{html,js}",
		"./docs/**/*.{html,js}",
	],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Nunito', 'sans-serif'],
				hand: ['Caveat', 'cursive'],
				type: ['Newsreader', 'serif'],
			},
			colors: {
				'maple-red': '#A4243B',
				'paper-cream': '#FBF8F1',
				'canada-red': '#D52B1E',
				'canada-light': '#FFEFEF',
			}
		},
	},
	plugins: [],
}
