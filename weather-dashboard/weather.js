const API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your OpenWeatherMap API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

const input = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherCard = document.getElementById('weather-card');
const errorMsg = document.getElementById('error-msg');

searchBtn.addEventListener('click', fetchWeather);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') fetchWeather();
});

async function fetchWeather() {
  const city = input.value.trim();
  if (!city) return;

  weatherCard.hidden = true;
  errorMsg.hidden = true;

  try {
    const res = await fetch(
      `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=imperial`
    );

    if (!res.ok) {
      throw new Error(res.status === 404 ? 'City not found.' : 'Failed to fetch weather.');
    }

    const data = await res.json();
    displayWeather(data);
  } catch (err) {
    errorMsg.textContent = err.message;
    errorMsg.hidden = false;
  }
}

function displayWeather(data) {
  document.getElementById('city-name').textContent =
    `${data.name}, ${data.sys.country}`;
  document.getElementById('temperature').textContent =
    `Temperature: ${Math.round(data.main.temp)}°F (feels like ${Math.round(data.main.feels_like)}°F)`;
  document.getElementById('description').textContent =
    `Conditions: ${data.weather[0].description}`;
  document.getElementById('humidity').textContent =
    `Humidity: ${data.main.humidity}%`;
  document.getElementById('wind').textContent =
    `Wind: ${Math.round(data.wind.speed)} mph`;

  weatherCard.hidden = false;
}
