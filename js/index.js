window.addEventListener("load", function () {
  let isCelsius = true;
  const unitToggle = document.querySelector(".unit-toggle");
  const celsiusBtn = unitToggle.children[1];
  const fahrenheitBtn = unitToggle.children[0];
  const apiKey = "eddde9f2d72345c1a17224649253004";
  const citySearch = document.getElementById("citySearchInput");
  const cityDropdownMenu = document.getElementById("cityDropdown");
  let timeoutId;
  getWeatherData("Egypt");

  unitToggle.addEventListener("click", function (e) {
    if (e.target === celsiusBtn && !isCelsius) {
      isCelsius = true;
      celsiusBtn.classList.add("active");
      fahrenheitBtn.classList.remove("active");
      updateTemperatureDisplay();
    } else if (e.target === fahrenheitBtn && isCelsius) {
      isCelsius = false;
      fahrenheitBtn.classList.add("active");
      celsiusBtn.classList.remove("active");
      updateTemperatureDisplay();
    }
  });

  citySearch.addEventListener("input", function (e) {
    clearTimeout(timeoutId);
    const searchTerm = e.target.value;

    if (searchTerm.length < 3) {
      cityDropdownMenu.innerHTML = "";
      cityDropdownMenu.classList.remove("show");
      return;
    }

    timeoutId = setTimeout(() => {
      fetchCities(searchTerm);
    }, 500);
  });

  function fetchCities(query) {
    showLoader();
    const xhr = new XMLHttpRequest();
    xhr.open(
      "GET",
      `https://api.weatherapi.com/v1/search.json?key=${apiKey}&q=${query}`
    );
    xhr.send();

    xhr.addEventListener("readystatechange", function () {
      if (xhr.readyState == 4) {
        hideLoader();
        try {
          if (xhr.status == 200) {
            const cities = JSON.parse(xhr.responseText);
            if (cities.length > 0) {
              displayCities(cities);
            } else {
              cityDropdownMenu.innerHTML =
                "<div class='dropdown-item'>No cities found</div>";
              cityDropdownMenu.classList.add("show");
            }
          } else {
            console.error("API Error:", xhr.status, xhr.statusText);
            cityDropdownMenu.innerHTML =
              "<div class='dropdown-item'>Error fetching cities</div>";
            cityDropdownMenu.classList.add("show");
          }
        } catch (error) {
          console.error("Error details:", {
            status: xhr.status,
            response: xhr.responseText,
            error: error.message,
          });
          cityDropdownMenu.innerHTML =
            "<div class='dropdown-item'>Error fetching cities</div>";
          cityDropdownMenu.classList.add("show");
        }
      }
    });
  }

  function displayCities(cities) {
    cityDropdownMenu.innerHTML = "";
    cities.forEach((city) => {
      const div = document.createElement("div");
      div.classList.add("dropdown-item");
      div.textContent = `${city.name}, ${city.country}`;
      div.addEventListener("click", () => {
        citySearch.value = div.textContent;
        cityDropdownMenu.classList.remove("show");
        cityDropdownMenu.innerHTML = "";
        citySearch.value = "";
        getWeatherData(city.name);
      });
      cityDropdownMenu.appendChild(div);
    });
    cityDropdownMenu.classList.add("show");
  }

  function showLoader() {
    document.getElementById("loader").classList.add("loading");
  }

  function hideLoader() {
    setTimeout(() => {
      document.getElementById("loader").classList.remove("loading");
    }, 500);
  }

  function getWeatherData(city) {
    showLoader();
    const xhr = new XMLHttpRequest();
    xhr.open(
      "GET",
      `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=7`
    );

    xhr.addEventListener("readystatechange", function () {
      if (xhr.readyState == 4) {
        hideLoader();
        try {
          if (xhr.status == 200 && xhr.responseText) {
            const data = JSON.parse(xhr.responseText);
            updateWeatherDisplay(data);
          } else {
            console.error("API Error:", xhr.status, xhr.statusText);
            document.getElementById("city-name").innerHTML = "City not found";
          }
        } catch (error) {
          console.error("Error details:", {
            status: xhr.status,
            response: xhr.responseText,
            error: error.message,
          });
        }
      }
    });

    xhr.onerror = function () {
      hideLoader();
      console.error("Network error occurred");
    };
    xhr.send();
  }

  function getWeatherIcon(condition) {
    const conditionLower = condition.toLowerCase();

    if (conditionLower.includes("sunny") || conditionLower.includes("clear")) {
      return "./images/sunny.svg";
    } else if (conditionLower.includes("Patchy rain nearby")) {
      return "./images/rainy.svg";
    } else if (conditionLower.includes("Partly Cloudy")) {
      return "./images/cloudy.svg";
    } else {
      return "./images/Frame.svg";
    }
  }

  function getTemperatureString(celsius, fahrenheit, numbersOnly = false) {
    const temp = isCelsius ? celsius : fahrenheit;
    const unit = isCelsius ? "°C" : "°F";
    return numbersOnly ? `${temp}°` : `${temp}${unit}`;
  }

  function updateWeatherDisplay(data) {
    window.currentWeatherData = data;
    let forecastDate = document.getElementById("forecast-date");
    forecastDate.innerHTML = data.current.last_updated;
    let forecastCityName = document.getElementById("city-name");
    forecastCityName.innerHTML = data.location.name;
    let forecastTemperature = document.getElementById("temperature");
    forecastTemperature.innerHTML = `${data.current.temp_c} °C / ${data.current.temp_f} °F`;
    let forecastIconCondition = document.getElementById("header-icon");
    forecastIconCondition.src = getWeatherIcon(data.current.condition.text);

    document.getElementById("sunrise").textContent =
      data.forecast.forecastday[0].astro.sunrise;
    document.getElementById("sunset").textContent =
      data.forecast.forecastday[0].astro.sunset;
    document.getElementById(
      "wind"
    ).textContent = `${data.current.wind_kph} km/h`;
    document.getElementById("uv").textContent = data.current.uv;
    document.getElementById("feels-like").textContent = isCelsius
      ? `${data.current.feelslike_c}°`
      : `${data.current.feelslike_f}°`;
    document.getElementById(
      "rain-chance"
    ).textContent = `${data.forecast.forecastday[0].day.daily_chance_of_rain}%`;

    const weeklyForecastContainer = document.getElementById(
      "weekly-forecast-container"
    );
    weeklyForecastContainer.innerHTML = "";

    data.forecast.forecastday.forEach((day) => {
      const date = new Date(day.date);
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
      const monthDay = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      const forecastDay = document.createElement("div");
      forecastDay.className = "forecast-day";
      forecastDay.innerHTML = `
      <div class="date">
          <div class="lighGrey-font">${monthDay}</div>
          <div>${dayName}</div>
      </div>
      <div class="condition">
          <img src="${getWeatherIcon(day.day.condition.text)}" alt="${
        day.day.condition.text
      }">
          <span class="lighGrey-font">${day.day.condition.text}</span>
      </div>
      <div class="temp">
          <div class="lighGrey-font">
              ${getTemperatureString(
                day.day.maxtemp_c,
                day.day.maxtemp_f,
                true
              )}/${getTemperatureString(
        day.day.mintemp_c,
        day.day.mintemp_f,
        true
      )}
          </div>
      </div>
  `;

      weeklyForecastContainer.appendChild(forecastDay);
    });

    const weatherForecast = document.getElementById("weather-forecast");
    const forecastContainer = document.createElement("div");
    forecastContainer.style.display = "flex";
    forecastContainer.style.gap = "10px";
    forecastContainer.style.marginTop = "10px";

    const hourlyForecasts = data.forecast.forecastday[0].hour;

    const currentHour = new Date().getHours();

    hourlyForecasts
      .filter((forecast) => new Date(forecast.time).getHours() >= currentHour)
      .forEach((forecast) => {
        const forecastTime = document.createElement("div");
        forecastTime.className = "forecast-time";
        const time = document.createElement("p");
        time.className = "time";
        time.textContent = new Date(forecast.time).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
        const img = document.createElement("img");
        img.alt = forecast.condition.text;
        img.src = getWeatherIcon(forecast.condition.text);
        img.style.width = "40px";
        img.style.height = "40px";

        const temp = document.createElement("p");
        temp.id = "temperature-value";
        temp.textContent = getTemperatureString(
          forecast.temp_c,
          forecast.temp_f
        );

        forecastTime.appendChild(time);
        forecastTime.appendChild(img);
        forecastTime.appendChild(temp);
        forecastContainer.appendChild(forecastTime);
      });

    const existingForecasts = weatherForecast.querySelector(".forecast-cards");
    if (existingForecasts) {
      existingForecasts.remove();
    }
    forecastContainer.className = "forecast-cards";
    weatherForecast.appendChild(forecastContainer);
  }

  function updateTemperatureDisplay() {
    if (!window.currentWeatherData) return;

    const data = window.currentWeatherData;
    document.getElementById("feels-like").textContent = isCelsius
      ? `${data.current.feelslike_c}°`
      : `${data.current.feelslike_f}°`;

    document.querySelectorAll(".forecast-day .temp").forEach((temp, index) => {
      const day = data.forecast.forecastday[index];
      temp.innerHTML = `
            <div class="lighGrey-font">
                ${getTemperatureString(
                  day.day.maxtemp_c,
                  day.day.maxtemp_f,
                  true
                )}/${getTemperatureString(
        day.day.mintemp_c,
        day.day.mintemp_f,
        true
      )}
            </div>
        `;
    });

    document
      .querySelectorAll(".forecast-time #temperature-value")
      .forEach((temp, index) => {
        const hour = data.forecast.forecastday[0].hour[index];
        temp.textContent = getTemperatureString(hour.temp_c, hour.temp_f);
      });
  }
});
