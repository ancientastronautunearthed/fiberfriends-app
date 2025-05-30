
'use server';
/**
 * @fileOverview Service for fetching weather data from Open-Meteo API.
 *
 * - getHistoricalWeather - Fetches historical daily average temperature and humidity.
 */

interface WeatherData {
  temperature: number;
  humidity: number;
}

interface OpenMeteoDailyResponse {
  time: string[];
  temperature_2m_mean: number[];
  relativehumidity_2m_mean: number[];
}

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  daily: OpenMeteoDailyResponse;
}

/**
 * Fetches historical weather data (average daily temperature and humidity)
 * for a specific date and location using the Open-Meteo API.
 * @param date - The date in YYYY-MM-DD format.
 * @param latitude - The latitude of the location.
 * @param longitude - The longitude of the location.
 * @returns A promise that resolves to an object with temperature and humidity, or null if an error occurs.
 */
export async function getHistoricalWeather(
  date: string,
  latitude: number,
  longitude: number
): Promise<WeatherData | null> {
  const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&start_date=${date}&end_date=${date}&daily=temperature_2m_mean,relativehumidity_2m_mean&timezone=auto`;

  try {
    const response = await fetch(apiUrl, { cache: 'force-cache' });
    if (!response.ok) {
      console.error(`Error fetching weather data: ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error("Error body:", errorBody);
      return null;
    }

    const data = (await response.json()) as OpenMeteoResponse;

    if (
      data.daily &&
      data.daily.time &&
      data.daily.time.length > 0 &&
      data.daily.temperature_2m_mean &&
      data.daily.temperature_2m_mean.length > 0 &&
      data.daily.relativehumidity_2m_mean &&
      data.daily.relativehumidity_2m_mean.length > 0
    ) {
      return {
        temperature: parseFloat(data.daily.temperature_2m_mean[0].toFixed(1)),
        humidity: parseFloat(data.daily.relativehumidity_2m_mean[0].toFixed(1)),
      };
    } else {
      console.error('Weather data is incomplete or in unexpected format:', data);
      return null;
    }
  } catch (error) {
    console.error('Failed to fetch or parse weather data:', error);
    return null;
  }
}
