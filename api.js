/*
API Key = "48b1d0ac40664100a210c1d87ff1f450"
PROVIDER = WEATHERBIT.IO
*/



/* Button Element*/
let button = document.getElementById("searchButton");
button.addEventListener("click", getWeather);


/*Get the input element AND VALUE*/
let searchBar = document.getElementById("searchBar");
/* Callback function to handle search event */

//TODO: Format values & and add error handling 
async function getWeather(e) {        
  e.preventDefault();
  let searchValue = searchBar.value;

  // URL
  let url = `https://api.weatherbit.io/v2.0/current?city=${searchValue}&country=US&units=I&key=48b1d0ac40664100a210c1d87ff1f450`;
  // REQUEST
  // Error handling

  let response = await fetch(url);
  if (response.status === '"success' ){

    // CHANGE THE RESPONSE OBJ TO JSON   
    let data = await response.json();
    // EXTRACT DATA FROM RES OBJ
    let cityName = data.data[0]['city_name'];
    let temperature = data.data[0]['temp'];
    let feel = data.data[0]['app_temp'];
    let windSpeed = data.data[0]['wind_spd'];
    let precip = data.data[0]['precip'];
    // POST VALUE TO THE DOM
    loc = document.getElementById('city').textContent = cityName;
    tempEl = document.getElementById('temperature').textContent = temperature + 'F';
    feelEL = document.getElementById('feelsLike').textContent = feel;
    wind = document.getElementById('maxTemp').textContent = windSpeed;
    precip = document.getElementById('minTemp').textContent = precip;
  } 
  else  {
    alert("Could not complete request");
  }
  reset();
  
  
}

function reset() {
  
  document.getElementById('searchBar').value = "" ;
}