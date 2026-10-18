import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  LocationIqReverseResponse,
  WeatherbitCurrentResponse,
  WeatherbitObservation,
} from './weather.models';

const LOCATIONIQ_REVERSE_URL = 'https://us1.locationiq.com/v1/reverse.php';
const WEATHERBIT_CURRENT_URL = 'https://api.weatherbit.io/v2.0/current';

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly http = inject(HttpClient);

  reverseGeocode(lat: number, lng: number): Observable<LocationIqReverseResponse> {
    const params = new HttpParams()
      .set('key', environment.locationIqKey)
      .set('lat', lat.toString())
      .set('lon', lng.toString())
      .set('format', 'json');
    return this.http.get<LocationIqReverseResponse>(LOCATIONIQ_REVERSE_URL, { params });
  }

  getCurrentWeather(city: string, state?: string): Observable<WeatherbitObservation> {
    let params = new HttpParams().set('city', city);
    if (state) {
      params = params.set('state', state);
    }
    params = params.set('country', 'US').set('units', 'I').set('key', environment.weatherbitKey);

    return this.http.get<WeatherbitCurrentResponse | null>(WEATHERBIT_CURRENT_URL, { params }).pipe(
      map((response) => {
        const observation = response?.data?.[0];
        if (!observation) {
          throw new Error(`No weather data returned for "${city}"`);
        }
        return observation;
      }),
    );
  }
}
