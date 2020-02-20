// GLOBAL VARIABLES =====================================================================================================================
let latitude = "";
let longitude = "";
const searchBtnEl = document.getElementById("search-btn");
const userInputEl = document.getElementById("search-term");
userInputEl.focus();

// EXECUTE autoComplete() & getCurrentLocation() WHEN PAGE LOADS =====================================================================
autoComplete(userInputEl);
getCurrentLocation();

// MAKE AUTOCOMPLETE ON SEARCH BOX AND GET LATITUDE & LONGITUDE OF THE SELECTED LOCATION ================================================
function autoComplete(inputEl) {
    const autoComCoord = {};
    // Create new object of Google places with the type of 'geocode'
    const places = new google.maps.places.Autocomplete(inputEl, { types: ['geocode'] });
    console.log("Google Places object: ", places);

    // Add event listener of 'Key Stroke / place_change' to the search box
    google.maps.event.addListener(places, 'place_changed', function () {
        const selectedPlace = places.getPlace();
        // Change global variables with the found lat & lng
        latitude = selectedPlace.geometry.location.lat();
        longitude = selectedPlace.geometry.location.lng();
        autoComCoord.lat = selectedPlace.geometry.location.lat();
        autoComCoord.lon = selectedPlace.geometry.location.lng();
        console.log("autoComCoord: ", autoComCoord);
    });
    return autoComCoord;
}

// GET USER CURRENT LOCATION AND GET THEIR LOCATION'S LATITUDE & LONGITUDE ===============================================================
function getCurrentLocation() {
    const getCurLocCoord = {};
    // If user allowed access to their current location, update the global lat & lng
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
            getCurLocCoord.lat = position.coords.longitude;
            getCurLocCoord.lon = position.coords.longitude;
            console.log("getCurLocCoord: ", getCurLocCoord);
            displayresto();
            getCurWeather();
        }, function (error) { // Handle error
            switch (error.code) {
                case error.PERMISSION_DENIED: // User denied the access to their location
                    break;
                case error.POSITION_UNAVAILABLE: // Browser doesn't support location service
                    alert("Location information is unavailable.");
                    break;
                case error.TIMEOUT: // User has not responded to request for access to their location
                    alert("The request to get user location timed out.");
                    break;
                case error.UNKNOWN_ERROR: // Other unknown error
                    alert("An unknown error occurred.");
                    break;
            }
        });
    } else { return; }
    return getCurLocCoord;

}

/*
Search.click() {
    const autoComCoord = autoComplete(inputEl);
    const getCurLocCoord = getCurrentLocation();
    const searchTerm = inputEl.value;
    if (getCurLocCoord) {
        getWeather based on getCurLocCoord;
        getCuisine based on getCurLocCoord;
    }
    else if (autoComCoord) {
        getWeather based on autoComCoord;
        getCuisine based on autoComCoord;
    }
    else if (searchTerm !== "") {
        getSearchMethod();
        if (method === zip) {
            getWeather based on zip;
            getCuisine based on zip;
        }
        if (method === 'query string') {
            getWeather based on queryString;
            getCuisine based on queryString;
        }
    }
}

*/

// ADD CLICK EVENT TO THE SEARCH BUTTON ==============================================================================================
searchBtnEl.addEventListener("click", function (event) {
    event.preventDefault();
    // Check if global latitude and longitude have been changed with new values
    console.log("User selected lat: ", latitude, " lng: ", longitude);
    getCurWeather();
    displayresto();

});

function convertDate(epoch) {
    // function to convert unix epoch to local time
    // returns arr ["MM/DD/YYYY, HH:MM:SS AM", "MM/DD/YYYY", "HH:MM:SS AM"]

    let readable = [];
    let myDate = new Date(epoch * 1000);

    // local time
    // returns string "MM/DD/YYYY, HH:MM:SS AM"
    readable[0] = (myDate.toLocaleString());
    readable[1] = ((myDate.toLocaleString().split(", "))[0]);
    readable[2] = ((myDate.toLocaleString().split(", "))[1]);


    return readable;
}
function getCurWeather() {

    // function to get current weather
    // set queryURL based on type of query
    const apiKey = "166a433c57516f51dfab1f7edaed8413";
    let requestType = "";
    let query = "";
    let url = 'https://api.openweathermap.org/data/2.5/';
    requestType = 'weather';
    console.log("latitude-weather:", latitude);

    query = `?lat=${latitude}&lon=${longitude}&units=imperial&appid=${apiKey}`;
    queryURL = `${url}${requestType}${query}`;
    // Create an AJAX call to retrieve data Log the data in console
    $.ajax({
        url: queryURL,
        method: 'GET'
    }).then(function (response) {

        console.log("Weather data: ", response);
        weatherObj = {
            city: `${response.name}`,
            wind: response.wind.speed,
            humidity: response.main.humidity,
            temp: response.main.temp,
            date: (convertDate(response.dt))[1],
            icon: `http://openweathermap.org/img/w/${response.weather[0].icon}.png`,
            desc: response.weather[0].description
        }

        // calls function to draw result to page
        drawCurWeather(weatherObj);

    });
};

function drawCurWeather(cur) {
    // function to draw  weather for day 

    $('#weather').empty();
    let $cardTitle = $('<h5 class="card-title">');
    $cardTitle.text(cur.city + " (" + cur.date + ")");


    let $ul = $('<ul>');

    let $iconLi = $('<li>');
    let $iconI = $('<img>');
    $iconI.attr('src', cur.icon);

    let $weathLi = $('<li>');
    $weathLi.text(cur.weather);

    let $temp = $('<li>');
    $temp.text('Temp: ' + cur.temp + " F");

    let $curWind = $('<li>');
    $curWind.text('Windspeed: ' + cur.wind + " MPH");

    let $humLi = $('<li>');
    $humLi.text('Humidity: ' + cur.humidity + "%");

    // assemble element
    $iconLi.append($iconI);

    $ul.append($iconLi);
    $ul.append($weathLi);
    $ul.append($temp);
    $ul.append($curWind);
    $ul.append($humLi);

    $cardTitle.append($ul);
    $('#weather').append($cardTitle);


};


//  Create a function to display the restaurant based on city 
function displayresto() {
    // Define an object 'settings' to store query url to API server
    let settings = {
        "async": true,
        "crossDomain": true,
        "url": "https://developers.zomato.com/api/v2.1/search?lat=" +
            latitude + "&lon=" + longitude + "&count=100&sort=real_distance&order=asc",
        "method": "GET", // use Get method
        "headers": {
            "user-key": "91ed3953ab67d3bc31054f6a0ee5a372",
            'Content-Type': 'application/x-www-form-urlencoded' // Return in JSON format
        }
    }// end of defining object 'settings'
    $.getJSON(settings, function (datares) { // make a request to API server
        console.log(datares);
        datares = datares.restaurants;
        console.log("Resto data returned from server: ", datares);
        let html = "";
        // loop through the returned data
        $.each(datares, function (index, value) {
            // define an object to store resto data
            let restoObj = datares[index];
            console.log(typeof restoObj);
            console.log("Resto data: ", restoObj);
            $.each(restoObj, function (index, value) {
                // Show only restaurant that has picture
                if (value.thumb != "") {
                    let location = restoObj.restaurant.location;
                    let userRating = restoObj.restaurant.user_rating;
                    html += "<div class='data is-clearfix '>";
                    html += "<div class='rating '>";

                    html += "<span class=' is-pulled-right title='" + userRating.rating_text + "'><p style='color:white;background-color:#" + userRating.rating_color + ";border-radius:4px;border:none; margin-left: 15px; padding: 10px  ;text-align: center;text-decoration:none;display:inline-block;font-size:16px;'><strong>" + userRating.aggregate_rating + "</strong></p></span><br>";
                    html += "  <strong  class='is-pulled-right has-text-info'>" + userRating.votes + " votes</strong>";
                    html += "</div>";
                    html += "<img class='resimg is-pulled-left' src=" + value.thumb + " alt='Restaurant Image' height='185' width='185'>";
                    html += "<a href=" + value.url + " target='_blank' ><h2 style='color:blue;'><strong>" + value.name + "</strong></h2></a>";
                    html += "  <strong class=' has-text-primary'>" + location.locality + "</strong><br>";
                    html += "  <h5 class='has-text-grey'><strong>" + location.address + "</strong></h5><hr>";
                    html += "  <strong>CUISINES</strong>: " + value.cuisines + "<br>";
                    html += "  <strong>COST FOR TWO</strong>: " + value.currency + value.average_cost_for_two + "<br>";
                    html += "</div><br>";
                }
            });
        });
        $("#food-info").html(html);
    }); // end of request for getting data to API server
}// end of function








