import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  Renderer2,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { US_STATES } from './us-states';
import { WeatherbitObservation } from './weather.models';
import { WeatherService } from './weather.service';

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0,
};

const HOT_THRESHOLD_F = 70;
const COLD_THRESHOLD_F = 45;

@Component({
  selector: 'app-weather',
  imports: [FormsModule],
  templateUrl: './weather.component.html',
  styleUrl: './weather.component.css',
})
export class WeatherComponent {
  private readonly weatherService = inject(WeatherService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly renderer = inject(Renderer2);

  private readonly searchBar = viewChild.required<ElementRef<HTMLInputElement>>('searchBar');

  protected readonly states = US_STATES;
  protected readonly city = signal('');
  protected readonly selectedState = signal('');
  protected readonly weather = signal<WeatherbitObservation | null>(null);

  protected readonly display = computed(() => {
    const weather = this.weather();
    if (!weather) {
      return null;
    }
    return {
      city: weather.city_name,
      temperature: `${Math.floor(weather.temp)} \u00B0F`,
      feelsLike: `${Math.floor(weather.app_temp)} \u00B0F`,
      windSpeed: `${Math.floor(weather.wind_spd)} Knts`,
      precipitation: `${Math.floor(weather.precip)}%`,
      description: weather.weather.description,
    };
  });

  private readonly backgroundClass = computed(() => {
    const temp = this.weather()?.temp;
    if (temp === undefined) {
      return null;
    }
    if (temp > HOT_THRESHOLD_F) {
      return 'bg-hot';
    }
    if (temp < COLD_THRESHOLD_F) {
      return 'bg-cold';
    }
    return null;
  });

  constructor() {
    effect((onCleanup) => {
      const className = this.backgroundClass();
      if (!className) {
        return;
      }
      const body = this.document.body;
      this.renderer.addClass(body, className);
      onCleanup(() => this.renderer.removeClass(body, className));
    });

    afterNextRender(() => {
      this.searchBar().nativeElement.focus();
      this.loadLocationWeather();
    });
  }

  protected search(): void {
    this.fetchWeather(
      this.city().trim(),
      this.selectedState() || undefined,
      'Weather Data Unavailable. Please try a new search and include a state.',
    );
  }

  private loadLocationWeather(): void {
    if (!('geolocation' in navigator)) {
      console.warn('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        console.log(`Latitude: ${coords.latitude}, Longitude: ${coords.longitude}`);
        this.weatherService
          .reverseGeocode(coords.latitude, coords.longitude)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: ({ address }) => {
              const city = address.city ?? address.town ?? address.village;
              const state = address.state;
              console.log(`Current Location is ${city} ${state}`);
              if (!city) {
                console.warn('Reverse geocoding did not return a city.');
                return;
              }
              this.fetchWeather(
                state ? `${city}, ${state}` : city,
                undefined,
                'Weather Data Unavailable. Please try a new search.',
              );
            },
            error: (err) => console.warn('Reverse geocoding failed', err),
          });
      },
      (err) => console.warn(`ERROR(${err.code}): ${err.message}`),
      GEOLOCATION_OPTIONS,
    );
  }

  private fetchWeather(city: string, state: string | undefined, errorMessage: string): void {
    this.weatherService
      .getCurrentWeather(city, state)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (weather) => {
          this.weather.set(weather);
          this.resetInputs();
        },
        error: (err) => {
          console.error(err);
          alert(errorMessage);
          this.resetInputs();
        },
      });
  }

  private resetInputs(): void {
    this.city.set('');
    this.selectedState.set('');
  }
}
