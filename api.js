/*Get the input element */
var searchBar = document.getElementById("searchBar");
var searchValue = searchBar.value;

const weather = {};

/* Button Element*/
var button = document.getElementById("searchButton");
button.onclick = getWeather;


/* Callback function to handle search event */

//  TODO: FIX API KEY ISSUES AND GET RESPONSE OBJ DATA
const key = 'c911883c686ef69e6975099842481ee7';
function getWeather() {
  // API Key
  let url = `http://api.openweathermap.org/data/2.5/weather?q={searchValue}&appid={key}`;

  //API Call
  fetch(url)
    .then(function (response) {
      let data = response.json();
      return data;
    })
    // .then(function (data) {
    //   weather.temperature.value = Math.floor(data.main.temp - KELVIN);
    //   weather.description = data.weather[0].description;
    //   weather.iconId = data.weather[0].icon;
    //   weather.city = data.name;
    //   weather.country = data.sys.country;
    // })
    .then(function () {
      console.log("success");
    });
}
