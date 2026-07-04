# Luno Dashboard

An open-source, privacy-focused portfolio tracker for [Luno](https://www.luno.com) cryptocurrency investors.

## Features

- **Portfolio Tracking** — View your total value, invested amount, and P&L at a glance
- **Profit/Loss Calculation** — Historical trade analysis with average cost, P&L, and ROI per asset
- **Asset Allocation Charts** — Visualize your portfolio distribution across cryptocurrencies
- **Shareable Portfolio Snapshots** — Generate beautiful share cards with your portfolio data
- **Multi-Theme Support** — Dark and light themes for sharing your results
- **100% Client-Side** — No backend, no data collection, your API keys stay in your browser

## Security & Privacy

- Your Luno API key is stored **only in your browser's localStorage**
- All data is fetched directly from Luno's official API (`api.luno.com`)
- **No data is ever sent to any third-party server**
- Uses **read-only** API permissions by default (View Balance + View Transactions + View Orders)

## Getting Started

1. Clone the repository
2. Run `node server.js` to start the local server
3. Open `http://localhost:8080` in your browser
4. Enter your Luno API Key ID and Secret (see the in-app tutorial for help creating one)

## Disclaimer

This tool is provided for **informational purposes only**. It is not financial advice. Cryptocurrency investments carry significant risk. Always do your own research before making investment decisions.

## Open Source

This project is open source. Contributions, feature requests, and bug reports are welcome!

- **Report Issues**: [GitHub Issues](#)
- **Submit PRs**: [GitHub Pull Requests](#)

## Support the Project

If you find this tool useful, Belanja Saya Minum Kopi / Buy me a coffee

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/A8H222KBR9)

## Built With

- Vanilla HTML, CSS, and JavaScript (no framework dependencies)
- [Chart.js](https://www.chartjs.org/) — Beautiful interactive charts
- [Material Symbols](https://fonts.google.com/icons) — Iconography
- [Manrope](https://fonts.google.com/specimen/Manrope), [Inter](https://fonts.google.com/specimen/Inter), [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) — Typography
