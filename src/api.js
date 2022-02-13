// Set focus on textbox on window load
window.onload = function() {
  document.getElementById("searchBar").focus();
  locationWeather();
};
function locationWeather() {

  // Get user lat/long coordinates 
  function getCoordintes() {
    let options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    function success(pos) {
      let crd = pos.coords;
      let lat = crd.latitude.toString();
      let lng = crd.longitude.toString();
      let coordinates = [lat, lng];
      console.log(`Latitude: ${lat}, Longitude: ${lng}`);
      getCity(coordinates);
    }

    function error(err) {
      console.warn(`ERROR(${err.code}): ${err.message}`);
    }

    navigator.geolocation.getCurrentPosition(success, error, options);
  }
  getCoordintes();

  // Get users city name
  function getCity(coordinates) {
    let xhr = new XMLHttpRequest();
    let lat = coordinates[0];
    let lng = coordinates[1];

    xhr.open('GET', "https://us1.locationiq.com/v1/reverse.php?key=pk.7d8922d3391a263efcedea2ea91feb62&lat=" +
    lat + "&lon=" + lng + "&format=json", true);
    xhr.send();
    xhr.onreadystatechange = processRequest;
    xhr.addEventListener("readystatechange", processRequest, false);

    function processRequest(e) {
      if (xhr.readyState == 4 && xhr.status == 200) {
        let response = JSON.parse(xhr.responseText);
        let city = response.address.city;
        let state = response.address.state;
        console.log("Current Location is " + city + " " + state)
        // Call weather function passing city & state arguments
        getWeather(city + ', ' + state);
      }
    }
  }


  // Get Forecast
  async function getWeather(location) {        
    const key = '48b1d0ac40664100a210c1d87ff1f450';

    let searchLocation = location;

    // URL
    let url = `https://api.weatherbit.io/v2.0/current?city=${searchLocation}&country=US&units=I&key=${key}`;
    
    // REQUEST & Error Handling
    let response = await fetch(url);
    // TRY/CATCH With ERROR HANDLING
    try{
      // CHANGE THE RESPONSE OBJ TO JSON   
      let data = await response.json();
      // EXTRACT DATA FROM RESPONSE OBJ
      let cityName = data.data[0]['city_name'];
      let temperature = data.data[0]['temp'];
      let feel = data.data[0]['app_temp'];
      let windSpeed = data.data[0]['wind_spd'];
      let precip = data.data[0]['precip'];
      let description = data.data[0]['weather']['description'];
      // POST VALUES TO THE DOM
      
      document.getElementById('city').textContent = cityName;
      document.getElementById('temperature').textContent = Math.floor(temperature) + ' \xB0' + 'F';
      document.getElementById('feelsLike').textContent = Math.floor(feel) + ' \xB0' +'F';
      document.getElementById('windspeed').textContent = Math.floor(windSpeed) + ' Knts';
      document.getElementById('precipitation').textContent = Math.floor(precip) + '%';
      document.getElementById('description').textContent = description;
      // Change text color
      document.getElementById('city').style.color = 'white';
      document.getElementById('temperature').style.color = "white";
      document.getElementById('feelsLike').style.color = "white";
      document.getElementById('windspeed').style.color = "white";
      document.getElementById('precipitation').style.color = "white";
      document.getElementById('description').style.color = "white";

      setBackground(temperature)
    }
    catch (e){
      // ALERT MESSAGE IF REQUEST FAILS
      alert("Weather Data Unavialable. Please try a new search.")
      
    }
    // RESET INPUT ELEMENT VALUE TO AN EMPTY STRING
    document.getElementById('searchBar').value = "" ;
    document.getElementById('stateAbbreviations').selectedIndex = 0;
   
  }
}


function setBackground(weatehrval) {
  if (weatehrval > 70) {
    document.body.style.background = "red"
  }
  else if (weatehrval < 45) {
    document.body.style.background = "#66a3ff"
  }
}



/* Dropdown */ 
let stateDropdown = document.getElementById('stateAbbreviations');

let searchBar = document.getElementById("searchBar")


/* Button Element*/
let button = document.getElementById("searchButton");
// Button event listiner
button.addEventListener("click", () => {
  userlocation = searchBar.value;
  state = stateDropdown.value;
  getForecast(userlocation, state);
} );

async function getForecast(userlocation, state) {
  const key = '48b1d0ac40664100a210c1d87ff1f450';

  // URL
  let url = `https://api.weatherbit.io/v2.0/current?city=${userlocation}&state=${state}&country=US&units=I&key=${key}`;
  
  // REQUEST & Error Handling
  let response = await fetch(url);
  // TRY/CATCH With ERROR HANDLING
  try{
    // CHANGE THE RESPONSE OBJ TO JSON   
    let data = await response.json();
    // EXTRACT DATA FROM RESPONSE OBJ
    let cityName = data.data[0]['city_name'];
    let temperature = data.data[0]['temp'];
    let feel = data.data[0]['app_temp'];
    let windSpeed = data.data[0]['wind_spd'];
    let precip = data.data[0]['precip'];
    let description = data.data[0]['weather']['description'];
    // POST VALUES TO THE DOM
    document.getElementById('city').textContent = cityName;
    document.getElementById('temperature').textContent = Math.floor(temperature) + ' \xB0' + 'F';
    document.getElementById('feelsLike').textContent = Math.floor(feel) + ' \xB0' +'F';
    document.getElementById('windspeed').textContent = Math.floor(windSpeed) + ' Knts';
    document.getElementById('precipitation').textContent = Math.floor(precip) + '%';
    document.getElementById('description').textContent = description;
    // Change text color
    document.getElementById('city').style.color = 'white';
    document.getElementById('temperature').style.color = "white";
    document.getElementById('feelsLike').style.color = "white";
    document.getElementById('windspeed').style.color = "white";
    document.getElementById('precipitation').style.color = "white";
    document.getElementById('description').style.color = "white";

    setBackground(temperature)
  }
  catch (e){
    // ALERT MESSAGE IF REQUEST FAILS
    alert("Weather Data Unavialable. Please try a new search and include a state.")
  }
  // RESET INPUT ELEMENT VALUE TO AN EMPTY STRING
  document.getElementById('searchBar').value = "" ;
  document.getElementById('stateAbbreviations').selectedIndex = 0;
}

