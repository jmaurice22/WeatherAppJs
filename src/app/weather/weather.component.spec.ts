import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WeatherComponent } from './weather.component';

const WEATHERBIT_URL = 'https://api.weatherbit.io/v2.0/current';

describe('WeatherComponent', () => {
  let fixture: ComponentFixture<WeatherComponent>;
  let httpTesting: HttpTestingController;
  let element: HTMLElement;

  const search = async (city: string, state: string) => {
    const input = element.querySelector<HTMLInputElement>('#searchBar')!;
    const select = element.querySelector<HTMLSelectElement>('#stateAbbreviations')!;
    input.value = city;
    input.dispatchEvent(new Event('input'));
    select.value = state;
    select.dispatchEvent(new Event('change'));
    element.querySelector<HTMLButtonElement>('#searchButton')!.click();
    await fixture.whenStable();
  };

  const getCurrentPosition = vi.fn();

  beforeEach(async () => {
    getCurrentPosition.mockReset();
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await TestBed.configureTestingModule({
      imports: [WeatherComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(WeatherComponent);
    element = fixture.nativeElement;
    document.body.appendChild(element);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpTesting.verify();
    element.remove();
    document.body.classList.remove('bg-hot', 'bg-cold');
    vi.restoreAllMocks();
    delete (navigator as { geolocation?: Geolocation }).geolocation;
  });

  it('focuses the search bar on init', () => {
    expect(document.activeElement).toBe(element.querySelector('#searchBar'));
  });

  it('renders weather, sets the hot background and resets inputs after search', async () => {
    await search('Austin', 'TX');
    const req = httpTesting.expectOne((r) => r.url === WEATHERBIT_URL);
    expect(req.request.params.get('city')).toBe('Austin');
    expect(req.request.params.get('state')).toBe('TX');
    req.flush({
      count: 1,
      data: [
        {
          city_name: 'Austin',
          temp: 85.7,
          app_temp: 88.2,
          wind_spd: 7.9,
          precip: 0.4,
          weather: { description: 'Clear sky' },
        },
      ],
    });
    await fixture.whenStable();

    expect(element.querySelector('#city')?.textContent?.trim()).toBe('Austin');
    expect(element.querySelector('#temperature')?.textContent?.trim()).toBe('85 \u00B0F');
    expect(element.querySelector('#feelsLike')?.textContent?.trim()).toBe('88 \u00B0F');
    expect(element.querySelector('#windspeed')?.textContent?.trim()).toBe('7 Knts');
    expect(element.querySelector('#precipitation')?.textContent?.trim()).toBe('0%');
    expect(element.querySelector('#description')?.textContent?.trim()).toBe('Clear sky');
    expect(document.body.classList).toContain('bg-hot');
    expect(element.querySelector<HTMLInputElement>('#searchBar')!.value).toBe('');
    expect(element.querySelector<HTMLSelectElement>('#stateAbbreviations')!.value).toBe('');
  });

  it('sets the cold background for temperatures below 45°F', async () => {
    await search('Fargo', 'ND');
    httpTesting
      .expectOne((r) => r.url === WEATHERBIT_URL)
      .flush({
        count: 1,
        data: [
          {
            city_name: 'Fargo',
            temp: 20,
            app_temp: 10,
            wind_spd: 12,
            precip: 0,
            weather: { description: 'Snow' },
          },
        ],
      });
    await fixture.whenStable();
    expect(document.body.classList).toContain('bg-cold');
    expect(document.body.classList).not.toContain('bg-hot');
  });

  it('alerts and resets inputs when the weather request fails', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    await search('Nowhere', 'TX');
    httpTesting
      .expectOne((r) => r.url === WEATHERBIT_URL)
      .flush({ error: 'bad key' }, { status: 403, statusText: 'Forbidden' });
    await fixture.whenStable();
    expect(alertSpy).toHaveBeenCalledWith(
      'Weather Data Unavailable. Please try a new search and include a state.',
    );
    expect(element.querySelector<HTMLInputElement>('#searchBar')!.value).toBe('');
  });

  it('keeps working after a failed search without reloading', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    await search('Nowhere', 'TX');
    httpTesting
      .expectOne((r) => r.url === WEATHERBIT_URL)
      .flush({ error: 'bad key' }, { status: 403, statusText: 'Forbidden' });
    await fixture.whenStable();
    expect(alertSpy).toHaveBeenCalledTimes(1);

    await search('Austin', 'TX');
    httpTesting
      .expectOne((r) => r.url === WEATHERBIT_URL)
      .flush({
        count: 1,
        data: [
          {
            city_name: 'Austin',
            temp: 60,
            app_temp: 60,
            wind_spd: 5,
            precip: 0,
            weather: { description: 'Clouds' },
          },
        ],
      });
    await fixture.whenStable();
    expect(element.querySelector('#city')?.textContent?.trim()).toBe('Austin');
    expect(element.querySelector<HTMLButtonElement>('#searchButton')!.textContent).toContain(
      'Search',
    );
  });

  it('only applies the latest search when searches overlap', async () => {
    await search('Dallas', 'TX');
    await search('Fargo', 'ND');
    const [first, second] = httpTesting.match((r) => r.url === WEATHERBIT_URL);
    expect(first.cancelled).toBe(true);
    second.flush({
      count: 1,
      data: [
        {
          city_name: 'Fargo',
          temp: 20,
          app_temp: 10,
          wind_spd: 12,
          precip: 0,
          weather: { description: 'Snow' },
        },
      ],
    });
    await fixture.whenStable();
    expect(element.querySelector('#city')?.textContent?.trim()).toBe('Fargo');
  });

  it('alerts instead of searching when the city is empty', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    await search('   ', 'TX');
    httpTesting.expectNone((r) => r.url === WEATHERBIT_URL);
    expect(alertSpy).toHaveBeenCalledWith('Please enter a city.');
  });

  it('shows a location error and retries geolocation without reloading', async () => {
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    const [, onError] = getCurrentPosition.mock.calls[0];
    onError({ code: 3, message: 'Timeout expired' });
    await fixture.whenStable();
    expect(element.querySelector('#locationError')?.textContent).toContain('Timeout expired');

    getCurrentPosition.mockImplementation((onSuccess: PositionCallback) =>
      onSuccess({ coords: { latitude: 30.27, longitude: -97.74 } } as GeolocationPosition),
    );
    element.querySelector<HTMLButtonElement>('#locationButton')!.click();
    await fixture.whenStable();
    expect(element.querySelector('#locationError')).toBeNull();

    httpTesting
      .expectOne((r) => r.url === 'https://us1.locationiq.com/v1/reverse.php')
      .flush({ address: { city: 'Austin', state: 'Texas' } });
    const weatherReq = httpTesting.expectOne((r) => r.url === WEATHERBIT_URL);
    expect(weatherReq.request.params.get('city')).toBe('Austin, Texas');
    expect(weatherReq.request.params.has('state')).toBe(false);
    weatherReq.flush({
      count: 1,
      data: [
        {
          city_name: 'Austin',
          temp: 85,
          app_temp: 88,
          wind_spd: 7,
          precip: 0,
          weather: { description: 'Clear sky' },
        },
      ],
    });
    await fixture.whenStable();
    expect(element.querySelector('#city')?.textContent?.trim()).toBe('Austin');
  });
});
