import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { WeatherbitObservation } from './weather.models';
import { WeatherService } from './weather.service';

describe('WeatherService', () => {
  let service: WeatherService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WeatherService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('reverse geocodes coordinates via LocationIQ', () => {
    service.reverseGeocode(30.27, -97.74).subscribe();
    const req = httpTesting.expectOne((r) => r.url === 'https://us1.locationiq.com/v1/reverse.php');
    expect(req.request.params.get('key')).toBe(environment.locationIqKey);
    expect(req.request.params.get('lat')).toBe('30.27');
    expect(req.request.params.get('lon')).toBe('-97.74');
    expect(req.request.params.get('format')).toBe('json');
    req.flush({ address: { city: 'Austin', state: 'Texas' } });
  });

  it('fetches current weather with an optional state', () => {
    const observation = { city_name: 'Austin', temp: 80 } as WeatherbitObservation;
    let result: WeatherbitObservation | undefined;
    service.getCurrentWeather('Austin', 'TX').subscribe((w) => (result = w));

    const req = httpTesting.expectOne((r) => r.url === 'https://api.weatherbit.io/v2.0/current');
    expect(req.request.params.get('city')).toBe('Austin');
    expect(req.request.params.get('state')).toBe('TX');
    expect(req.request.params.get('country')).toBe('US');
    expect(req.request.params.get('units')).toBe('I');
    expect(req.request.params.get('key')).toBe(environment.weatherbitKey);
    req.flush({ count: 1, data: [observation] });

    expect(result).toEqual(observation);
  });

  it('omits the state param when not provided', () => {
    service.getCurrentWeather('Austin, Texas').subscribe();
    const req = httpTesting.expectOne((r) => r.url === 'https://api.weatherbit.io/v2.0/current');
    expect(req.request.params.has('state')).toBe(false);
    req.flush({ count: 1, data: [{}] });
  });

  it('errors when Weatherbit returns no data', () => {
    let error: unknown;
    service.getCurrentWeather('Nowhere').subscribe({ error: (e) => (error = e) });
    httpTesting
      .expectOne((r) => r.url === 'https://api.weatherbit.io/v2.0/current')
      .flush(null, { status: 204, statusText: 'No Content' });
    expect(error).toBeInstanceOf(Error);
  });
});
