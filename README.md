# Queue Watch

A line tracker and wait-time predictor for numbered queue systems (DMV, banks, pharmacies, bakeries, etc.).

Log the numbers being called as you wait, and Queue Watch will estimate your remaining wait time, predict your ETA, and show whether the line is speeding up or slowing down. Run multiple sessions at once, review past sessions, and never wonder "how much longer?" again.

Built with Vue 3 + TypeScript + Vite + Claude Code. All data is stored locally in your browser — no server, no account, no network requests, and no tracking.

## Features

- Track multiple queues simultaneously
- Real-time wait estimates and ETA predictions
- Trend detection (speeding up / slowing down / steady)
- 12h and 24h time format support
- Mobile-friendly responsive UI
- Onboarding guide for first-time users

## Development

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

## License

This project is licensed under the [MIT License](LICENSE.md).

## Acknowledgments

Assume all code in this project was written with assistance from [Claude Code](https://claude.ai/code).
