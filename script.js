// get all relevant elements
// city input, city, date, weatherIcon, temp, humidity, windSpeed, and uvIndex

// user enters city
// on search button click -> pass city as prop to OpenWeatherAPI Call

// use geocoderAPI with city to get lat/lon data

// Call the TODAY_WEATHER query w/ lat/lon data
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
const windDirEl = document.getElementById("windDir");
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
    // check localStorage for any previous searchHistory values
    if (localStorage.getItem("searchHistory")) {
      this.history = JSON.parse(localStorage.getItem("searchHistory")); //searchHistory should be array format already
      pastSearchesEl.replaceChildren("");
      this.history.forEach((city) => {
        let listItem = document.createElement("li");
        listItem.textContent = city;
        listItem.setAttribute(
          "class",
          "list-group-item list-group-item-action hover"
        );
        listItem.setAttribute("data-city", city);
        listItem.style = "display:flex; justify-content: space-between";
        listItem.addEventListener("click", function (event) {
          // checks the text content only within list element matches its data-city value
          // if valid, we call the api using that past search
          if (
            event.target.getAttribute("data-city") ===
            event.target.childNodes[0].textContent
          ) {
            weather.search(event.target.getAttribute("data-city"));
          }
        });
        let delButton = document.createElement("button");
        delButton.setAttribute("class", "btn btn-danger py-0 px-2");
        delButton.textContent = "X";
        delButton.addEventListener("click", function (event) {
          if (event.target.tagName === "BUTTON") {
            // remove the list element where data-city matches the city the user wants to remove
            searches.deleteSearch(
              event.target.parentNode.getAttribute("data-city")
            );
          }
        });
        listItem.appendChild(delButton);
        //pastSearchesEl.appendChild(listItem);
        pastSearchesEl.prepend(listItem);
      });
    }
  },
  appendHistory: function (city) {
    this.history = JSON.parse(localStorage.getItem("searchHistory"));
    // if no valid searchHistory, initialize it
    if (!this.history) {
      this.history = [];
      this.history.push(city);
    }
    // validate that the city has not alreayd been searched
    if (!this.history.includes(city)) {
      console.log("Adding new search to history list");
      this.history.push(city);
      // append most recent search to localStorage
    }
    localStorage.setItem("searchHistory", JSON.stringify(this.history));
    this.getHistory();
  },
  deleteSearch: function (listItem) {
    // remove elment from previous search list on button click
    //console.log("History before filter: ", this.history);
    this.history = this.history.filter((city) => city !== listItem);
    //console.log("history after filter: ", this.history);
    localStorage.setItem("searchHistory", JSON.stringify(this.history));
    this.getHistory();
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
  windDir: "",
  location: "",

  getGeoCode: async function (city) {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${city}}&appid=${api_key}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      const data = await response.json();
      // search could yield cities from multiple countries
      // future feature to create popup to allow user to select between which country they want to procees with
      //console.log("data: ", data[0]);
      this.lat = data[0].lat;
      this.lon = data[0].lon;
      //console.trace(`lat: ${this.lat}, lon: ${this.lon}`);
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
      this.windDir = data.wind.deg; // deg

      this.renderCurrentWeather();
    } catch (error) {
      console.error(error);
    }
  },

  renderCurrentWeather: async function () {
    // render to dom
    cityEl.textContent = this.location;
    cityEl.style = "font-family: Winky Sans, serif; color: #767522";
    dateEl.textContent = new Date().toJSON().slice(0, 10); //update
    let iconUrl = `https://openweathermap.org/img/wn/${this.iconCode}@2x.png`;
    weatherIconEl.src = iconUrl;
    weatherIconEl.alt = this.description;
    tempEl.textContent = ` ${this.temp.toFixed(0)} °F`;
    humidityEl.textContent = ` ${this.humidity} %`;
    windSpeedEl.textContent = ` ${this.windSpeed} mph`;
    windDirEl.textContent = `${this.windDir} deg`;
  },

  getFiveDayWeather: async function ({ lat, lon }) {
    // fetch api data for 16 day api -> only return next 5 days
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${api_key}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      const data = await response.json();
      // return a new list for all days following todays date
      let currDate = new Date().toJSON().slice(0, 10);
      let dateRange = data.list.filter(
        (day) =>
          day.dt_txt.split(" ")[0] !== currDate &&
          day.dt_txt.split(" ")[1] === "12:00:00"
      );
      this.renderFiveDayWeather(dateRange);
    } catch (error) {
      console.error(error);
    }
  },

  renderFiveDayWeather: async function (dates) {
    // render to dom
    // cityEl.textContent = this.location;
    // dateEl.textContent = new Date().toJSON().slice(0, 10); //update
    // let iconUrl = `https://openweathermap.org/img/wn/${this.iconCode}@2x.png`;
    // weatherIconEl.src = iconUrl;
    // weatherIconEl.alt = this.description;
    // tempEl.textContent = ` ${this.temp.toFixed(0)} °F`;
    // humidityEl.textContent = ` ${this.humidity} %`;
    // windSpeedEl.textContent = ` ${this.windSpeed} mph`;
    console.trace("five day date: ", dates);
    fiveDayForecastRow.replaceChildren("");
    dates.forEach((date) => {
      // dynamically create a card element for each day
      // =============================================
      // <div class="card fiveDayCard">
      // <h3 class="card-title">Date</h3>
      // <p><i class="fas fa-solid fa-cloud"></i></p>
      // <p class="card-text">Temp: 50</p>
      // <p class="card-text">Humidity: 99</p>
      // </div>
      // =============================================
      let dateCol = document.createElement("div");
      dateCol.setAttribute("class", "col");
      let dateCard = document.createElement("div");
      dateCard.setAttribute("class", "card my-1 fiveDayCard");
      let dateH6 = document.createElement("h6");
      dateH6.setAttribute("class", "card-title");
      dateH6.textContent = date.dt_txt.split(" ")[0];
      let pIcon = document.createElement("p");
      let iconCode = date.weather[0].icon;
      let iconEl = document.createElement("img");
      let iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
      iconEl.src = iconUrl;
      iconEl.alt = date.weather[0].description;
      pIcon.appendChild(iconEl);

      let pTemp = document.createElement("p");
      pTemp.setAttribute("class", "card-text");
      pTemp.textContent = `Temperature: ${(
        ((date.main.temp - 273.15) * 9) / 5 +
        32
      ).toFixed(0)} °F`;
      let pHumidity = document.createElement("p");
      pHumidity.setAttribute("class", "card-text");
      pHumidity.textContent = `Humidity: ${date.main.humidity} %`;

      dateCard.appendChild(dateH6);
      dateCard.appendChild(pIcon);
      dateCard.appendChild(pTemp);
      dateCard.appendChild(pHumidity);
      dateCol.appendChild(dateCard);
      fiveDayForecastRow.appendChild(dateCol);
    });
  },

  search: async function (city) {
    const geoCode = await weather.getGeoCode(city);
    weather.getCurrentWeather(geoCode);
    weather.getFiveDayWeather(geoCode);
  },
};

// init application with past searches
searches.getHistory();

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

    weather.search(targetCity);
    document.getElementById("cityInput").value = "";
  } catch (error) {
    console.error(error);
  }
});

pastSearchesEl.addEventListener("click", function (event) {
  if (
    event.target.getAttribute("data-city") ===
    event.target.childNodes[0].textContent
  ) {
    weather.search(event.target.getAttribute("data-city"));
  }
});

// add on click event for pastSearches deleteButton to call searches.delete() method
