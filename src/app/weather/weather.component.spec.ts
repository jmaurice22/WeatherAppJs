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

  beforeEach(async () => {
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
});
