# WeatherAppJs

Weather web application built with [Angular](https://angular.dev) (standalone components, signals).
It shows current conditions for your location on load, or for any US city you search for.

### **#API Services**
- [weatherbit.io](https://www.weatherbit.io/) – current weather
- [LocationIQ](https://locationiq.com/) – reverse geocoding (coordinates → city/state)

API keys live in `src/environments/environment.ts` (and `environment.development.ts` for `ng serve`).

***Note geolocation will not work on non https connections** (`localhost` is treated as secure, so it works with `ng serve`).

## Getting started

Requires Node.js `^22.22.3 || ^24.15.0` and npm.

```bash
npm install
npm start        # or: npx ng serve
```

Open http://localhost:4200/.

## Other commands

```bash
npm run build    # production build to dist/weather-app/browser
npm test         # unit tests (Vitest)
```

## Project layout

- `src/app/weather/` – `WeatherComponent`, `WeatherService`, API response interfaces, US states list
- `src/environments/` – API keys
- `legacy/` – the original vanilla HTML/CSS/JS version of the app
