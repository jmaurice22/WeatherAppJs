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
import { catchError, defer, EMPTY, finalize, Subject, switchMap, tap } from 'rxjs';
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

interface WeatherRequest {
  city: string;
  state?: string;
  errorMessage: string;
}

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
  private readonly weatherRequests = new Subject<WeatherRequest>();

  protected readonly states = US_STATES;
  protected readonly city = signal('');
  protected readonly selectedState = signal('');
  protected readonly weather = signal<WeatherbitObservation | null>(null);
  protected readonly locating = signal(false);
  protected readonly loading = signal(false);
  protected readonly locationError = signal<string | null>(null);

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

    // switchMap keeps only the latest request in flight; errors are caught per
    // request so a failure never terminates the stream and later searches still work.
    this.weatherRequests
      .pipe(
        switchMap((request) =>
          defer(() => {
            this.loading.set(true);
            return this.weatherService.getCurrentWeather(request.city, request.state);
          }).pipe(
            tap((weather) => this.weather.set(weather)),
            catchError((err) => {
              console.error(err);
              alert(request.errorMessage);
              return EMPTY;
            }),
            finalize(() => {
              this.loading.set(false);
              this.resetInputs();
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe();

    afterNextRender(() => {
      this.searchBar().nativeElement.focus();
      this.useMyLocation();
    });
  }

  protected search(): void {
    const city = this.city().trim();
    if (!city) {
      alert('Please enter a city.');
      this.searchBar().nativeElement.focus();
      return;
    }
    this.weatherRequests.next({
      city,
      state: this.selectedState() || undefined,
      errorMessage: 'Weather Data Unavailable. Please try a new search and include a state.',
    });
  }

  protected useMyLocation(): void {
    this.locationError.set(null);

    if (!('geolocation' in navigator)) {
      this.failLocation('Geolocation is not supported by this browser.');
      return;
    }

    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        console.log(`Latitude: ${coords.latitude}, Longitude: ${coords.longitude}`);
        this.weatherService
          .reverseGeocode(coords.latitude, coords.longitude)
          .pipe(
            finalize(() => this.locating.set(false)),
            takeUntilDestroyed(this.destroyRef),
          )
          .subscribe({
            next: ({ address }) => {
              const city = address.city ?? address.town ?? address.village;
              const state = address.state;
              console.log(`Current Location is ${city} ${state}`);
              if (!city) {
                this.failLocation('Could not determine your city.');
                return;
              }
              this.weatherRequests.next({
                city: state ? `${city}, ${state}` : city,
                errorMessage: 'Weather Data Unavailable. Please try a new search.',
              });
            },
            error: (err) => {
              console.warn('Reverse geocoding failed', err);
              this.failLocation('Could not look up your location.');
            },
          });
      },
      (err) => {
        console.warn(`ERROR(${err.code}): ${err.message}`);
        this.locating.set(false);
        this.failLocation(`Could not get your location (${err.message}).`);
      },
      GEOLOCATION_OPTIONS,
    );
  }

  private failLocation(message: string): void {
    this.locationError.set(`${message} Search for a city or try again.`);
  }

  private resetInputs(): void {
    this.city.set('');
    this.selectedState.set('');
  }
}
