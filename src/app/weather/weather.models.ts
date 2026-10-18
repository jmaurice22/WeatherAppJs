export interface LocationIqAddress {
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
}

export interface LocationIqReverseResponse {
  place_id: string;
  lat: string;
  lon: string;
  display_name: string;
  address: LocationIqAddress;
}

export interface WeatherbitWeather {
  icon: string;
  code: number;
  description: string;
}

export interface WeatherbitObservation {
  city_name: string;
  state_code: string;
  country_code: string;
  temp: number;
  app_temp: number;
  wind_spd: number;
  precip: number;
  weather: WeatherbitWeather;
}

export interface WeatherbitCurrentResponse {
  count: number;
  data: WeatherbitObservation[];
}

export interface UsState {
  code: string;
  name: string;
}
