import { ApiError, getJson, isNotFound, nullToUndefined } from '@/features/api/api-client';
import { useForcedFailuresStore } from '@/features/dev/forced-failures.store';
import { answerFetchWith, fetchedPaths, testApiBaseUrl } from '@/test-utils/fake-fetch';

describe('getJson', () => {
  it('asks the base URL for the path and returns the JSON body', async () => {
    answerFetchWith(() => ({ status: 200, body: { hello: 'world' } }));

    const body = await getJson('/events?page=1');

    expect(body).toEqual({ hello: 'world' });
    expect(global.fetch).toHaveBeenCalledWith(`${testApiBaseUrl}/events?page=1`);
    expect(fetchedPaths()).toEqual(['/events?page=1']);
  });

  it('throws an ApiError carrying the status and the API error text', async () => {
    answerFetchWith(() => ({ status: 400, body: { error: 'Unknown type "international"' } }));

    const request = getJson('/lectures?type=international');

    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({ status: 400, message: 'Unknown type "international"' });
  });

  it('still throws with the status when the error body is not JSON', async () => {
    process.env.EXPO_PUBLIC_API_URL = testApiBaseUrl;
    global.fetch = jest.fn(async () => {
      const response = {
        ok: false,
        status: 502,
        json: async () => {
          throw new SyntaxError('Unexpected token <');
        },
      };
      return response as unknown as Response;
    }) as typeof fetch;

    await expect(getJson('/lectures')).rejects.toMatchObject({ status: 502, message: 'Request failed with status 502' });
  });

  it('fails like a lost connection, without a request, when a development switch says so', async () => {
    answerFetchWith(() => ({ status: 200, body: {} }));
    useForcedFailuresStore.setState({ active: ['firstPages'] });

    await expect(getJson('/events?page=1&limit=10')).rejects.toBeInstanceOf(TypeError);
    expect(fetchedPaths()).toEqual([]);

    useForcedFailuresStore.setState({ active: [] });
  });

  it('explains how to fix a missing base URL', async () => {
    answerFetchWith(() => ({ status: 200, body: {} }));
    delete process.env.EXPO_PUBLIC_API_URL;

    await expect(getJson('/lectures')).rejects.toThrow('EXPO_PUBLIC_API_URL is not set');
  });
});

describe('isNotFound', () => {
  it('is true only for the API’s 404', () => {
    expect(isNotFound(new ApiError(404, 'Lecture not found'))).toBe(true);
    expect(isNotFound(new ApiError(500, 'Failed'))).toBe(false);
    expect(isNotFound(new TypeError('Network request failed'))).toBe(false);
  });
});

describe('nullToUndefined', () => {
  it('turns null into undefined and keeps every other value', () => {
    expect(nullToUndefined(null)).toBeUndefined();
    expect(nullToUndefined('')).toBe('');
    expect(nullToUndefined(0)).toBe(0);
  });
});
