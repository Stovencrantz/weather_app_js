// get all relevant elements
// city input, city, date, weatherIcon, temp, humidity, windSpeed, and uvIndex

// user enters city
// on search button click -> pass city as prop to OpenWeatherAPI Call

// use geocoderAPI with city to get lat/lon data

// Call the TODAY_WEATHER query w/ city
// if valid -> pull weather icon, temp, humidity, windSpped, and uvIndex data
// render to today dashboard

// call 5-DAY_WEATHER query w/ city
// if valid -> pull date, weather icon, temp, and humidity
// render within a column-card element
// dynamically append these 5 cards to the 5-day weather container

const cityInput = document.getElementById("cityInput");
const submitBtn = document.getElementById("submitBtn");
const cityEl = document.getElementById("city");
const dateEl = document.getElementById("date");
const weatherIconEl = document.getElementById("weatherIcon");
const tempEl = document.getElementById("temp");
const humidityEl = document.getElementById("humidity");
const windSpeedEl = document.getElementById("windSpeed");
const uvIndexEl = document.getElementById("uvIndex");
const pastSearchesEl = document.getElementById("pastSearches");
const fiveDayForecastRow = document.getElementById("fiveDayForecast");
const specialCharacters = [
  "!",
  '"',
  "#",
  "$",
  "%",
  "&",
  "'",
  "(",
  ")",
  "*",
  "+",
  ",",
  "-",
  ".",
  "/",
  ":",
  ";",
  "<",
  "=",
  ">",
  "?",
  "@",
  "[",
  "\\",
  "]",
  "^",
  "_",
  "`",
  "{",
  "|",
  "}",
  "~",
];
const numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const api_key = localStorage.getItem("openweather_key");

const searches = {
  history: [],
  getHistory: function () {
    // get previous searches & render on load
  },
  appendHistory: function (city) {
    // append most recent search to localStorage
    this.history.push(city);
    localStorage.setItem("searchHistory", JSON.stringify(this.history));
  },
  deleteSearch: function (element) {
    // remove elment from previous search list on button click
  },
};

const weather = {
  lat: "",
  lon: "",
  iconCode: "",
  description: "",
  temp: "",
  humidity: "",
  windSpeed: "",
  uvIndex: "",
  location: "",

  getGeoCode: async function (city) {
    const url = `http://api.openweathermap.org/geo/1.0/direct?q=${city}}&appid=${api_key}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      const data = await response.json();
      // search could yield cities from multiple countries
      // future feature to create popup to allow user to select between which country they want to procees with
      console.log("data: ", data[0]);
      this.lat = data[0].lat;
      this.lon = data[0].lon;
      console.trace(`lat: ${this.lat}, lon: ${this.lon}`);
      return { lat: this.lat, lon: this.lon };
    } catch (error) {
      console.error(error.message);
    }
  },

  getCurrentWeather: async function ({ lat, lon }) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${api_key}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      const data = await response.json();
      console.log(data);
      this.location = data.name;
      this.iconCode = data.weather[0].icon;
      this.description = data.weather[0].description;
      this.temp = ((data.main.temp - 273.15) * 9) / 5 + 32; // kelvin to F
      this.humidity = data.main.humidity; // percent
      this.windSpeed = data.wind.speed; // mph
      this.uvIndex = ""; // UNKNOWN

      this.renderCurrentWeather();
    } catch (error) {
      console.error(error);
    }
  },

  renderCurrentWeather: async function () {
    // render to dom
    cityEl.textContent = this.location;
    dateEl.textContent = new Date().toJSON().slice(0, 10); //update
    let iconUrl = `https://openweathermap.org/img/wn/${this.iconCode}@2x.png`;
    weatherIconEl.src = iconUrl;
    weatherIconEl.alt = this.description;
    tempEl.textContent = ` ${this.temp.toFixed(0)} °F`;
    humidityEl.textContent = ` ${this.humidity} %`;
    windSpeedEl.textContent = ` ${this.windSpeed} mph`;
  },
};

submitBtn.addEventListener("click", async (event) => {
  event.preventDefault();
  let targetCity = cityInput.value.trim();

  try {
    // false => no symbols found => valid string
    // true => symbols found => invalid string
    const valid = targetCity.split(""); // ['d','%','e','n','v','e','r']
    // checks if our city input contains any special characters
    const specialCharPresent = specialCharacters.some((specChar) =>
      targetCity.split("").includes(specChar)
    );

    //checks if our city input contains any numbers
    const numberPresent = numbers.some((num) =>
      targetCity.split("").includes(num)
    );

    if (specialCharPresent && numberPresent) {
      throw Error("You have invalid characters and numbers in your city input");
    } else if (specialCharPresent) {
      throw Error("You have invalid characters in your city input");
    } else if (numberPresent) {
      throw Error("You have invalid numbers in your city input");
    }
    searches.appendHistory(targetCity);

    const geoCode = await weather.getGeoCode(targetCity);
    weather.getCurrentWeather(geoCode);
  } catch (error) {
    console.error(error);
  }
});
