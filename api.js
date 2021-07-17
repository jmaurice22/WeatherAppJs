/*
API Key = "48b1d0ac40664100a210c1d87ff1f450"
PROVIDER = WEATHERBIT.IO
*/

/* Button Element*/
var button = document.getElementById("searchButton");
button.addEventListener("click", getWeather);


/* Callback function to handle search event */

//  TODO: EXTRACT RESPONSE OBJ DATA 
//  AND DISPLAY IT TO THE DOM
async function getWeather() {
   /*Get the input element AND VALUE*/
  let searchBar = document.getElementById("searchBar");
  let searchValue = searchBar.value;
  // URL
  let url = `https://api.weatherbit.io/v2.0/current?postal_code=${searchValue}&country=US&units=I&key=48b1d0ac40664100a210c1d87ff1f450`;
  // API Call
  let response = await fetch(url);
  // CHANGE THE RESPONSE OBJ TO JSON   
  let data = await response.json();
  console.log(data);
}
