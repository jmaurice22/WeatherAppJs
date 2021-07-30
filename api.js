// Set focus on textbox
window.onload = function() {
  document.getElementById("searchBar").focus();
};

/* Button Element*/
let button = document.getElementById("searchButton");
button.addEventListener("click", getWeather);


/*Get the input element AND VALUE*/
let searchBar = document.getElementById("searchBar");

let key = '48b1d0ac40664100a210c1d87ff1f450';

// Get Forecast
async function getWeather(e) {        
  e.preventDefault();
  let searchValue = searchBar.value;

  // URL
  let url = `https://api.weatherbit.io/v2.0/current?city=${searchValue}&country=US&units=I&key=${key}`;
  
  // REQUEST & Error Handling
  let response = await fetch(url);
  // TRY/CATCH FOR ERROR HANDLING
  try{
    // CHANGE THE RESPONSE OBJ TO JSON   
    let data = await response.json();
    // EXTRACT DATA FROM RES OBJ
    let cityName = data.data[0]['city_name'];
    let temperature = data.data[0]['temp'];
    let feel = data.data[0]['app_temp'];
    let windSpeed = data.data[0]['wind_spd'];
    let precip = data.data[0]['precip'];
    let description = data.data[0]['weather']['description'];
    // POST VALUES TO THE DOM
    document.getElementById('city').textContent = cityName;
    document.getElementById('temperature').textContent = Math.floor(temperature) + ' F';
    document.getElementById('feelsLike').textContent = Math.floor(feel) + ' F';
    document.getElementById('maxTemp').textContent = Math.floor(windSpeed) + ' Knts';
    document.getElementById('minTemp').textContent = Math.floor(precip) + '%';
    document.getElementById('description').textContent = description;
   
    document.getElementById('city').style.color = '#fff';
    document.getElementById('temperature').style.color = "white";
    document.getElementById('feelsLike').style.color = "white";
    document.getElementById('maxTemp').style.color = "white";
    document.getElementById('minTemp').style.color = "white";
    document.getElementById('description').style.color = "white";
  }
  catch (e){
    // ALERT MESSAGE IF REQUEST FAILS
    alert("Weather Data Unavialable. Please try a new search.")
  }
  // RESET INPUT ELEMENT VALUE TO AN EMPTY STRING
  document.getElementById('searchBar').value = "" ;

}
