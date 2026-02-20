import React, { useState, useEffect } from 'react';

interface WeatherData {
  city: string;
  code: string;
  temp: number | null;
  loading: boolean;
}

const CITIES = [
  { name: 'Harare', code: 'HRE', lat: -17.8292, lon: 31.0522 },
  { name: 'Bulawayo', code: 'BUQ', lat: -20.1325, lon: 28.6265 },
  { name: 'Johannesburg', code: 'JNB', lat: -26.2041, lon: 28.0473 },
  { name: 'Tokyo', code: 'TYO', lat: 35.6762, lon: 139.6503 },
  { name: 'London', code: 'LDN', lat: 51.5074, lon: -0.1278 },
  { name: 'New York', code: 'NYC', lat: 40.7128, lon: -74.0060 },
];

const WeatherBar: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData[]>(
    CITIES.map(city => ({ city: city.code, code: city.code, temp: null, loading: true }))
  );

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Fetch weather for all cities in parallel
        const promises = CITIES.map(async (city) => {
          try {
            // Open-Meteo API endpoint for current weather
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weather_code&timezone=Africa/Harare`;
            const response = await fetch(url);

            if (!response.ok) {
              throw new Error(`Failed to fetch weather for ${city.code}`);
            }

            const data = await response.json();
            const temp = Math.round(data.current?.temperature_2m || 0);

            return {
              city: city.code,
              code: city.code,
              temp,
              loading: false,
            };
          } catch (error) {
            console.error(`Error fetching weather for ${city.code}:`, error);
            return {
              city: city.code,
              code: city.code,
              temp: null,
              loading: false,
            };
          }
        });

        const results = await Promise.all(promises);
        setWeather(results);
      } catch (error) {
        console.error('Error fetching weather data:', error);
      }
    };

    fetchWeather();

    // Refresh weather every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', gap: '12px' }}>
      {weather.map((w) => (
        <span key={w.code} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontWeight: 600 }}>{w.code}</span>
          {w.loading ? (
            <span style={{ opacity: 0.8 }}>—</span>
          ) : w.temp !== null ? (
            <span style={{ opacity: 0.8 }}>{w.temp}°C</span>
          ) : (
            <span style={{ opacity: 0.8 }}>—</span>
          )}
        </span>
      ))}
    </div>
  );
};

export default WeatherBar;
