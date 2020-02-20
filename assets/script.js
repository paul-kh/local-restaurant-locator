// Make names of global variables to be most likely unique to prevent accident if window object
// in other app on the same machine would access to the same variable name.
const restoLocatorSearchBtnEl = document.getElementById("search-btn");
const restoLocatorSearchInputEl = document.getElementById("search-term");
restoLocatorSearchInputEl.focus();

// Add click event to the search button
restoLocatorSearchBtnEl.addEventListener("click", function (event) {
    event.preventDefault();
    const searchTerm = restoLocatorSearchInputEl.value;
    // Check if global latitude and longitude have been changed with new values
    getCurWeather(null, searchTerm);
});

// Trigger click event when the 'Enter' key pressed in the search input
restoLocatorSearchInputEl.addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        restoLocatorSearchBtnEl.click();
        restoLocatorSearchBtnEl.focus();
    }
});

// Execut autoComplete() & getCurrentLocation() on page load
// so the autoComplete feature is immediately available
// and the app is instantly asking user to get the currently location
autoComplete(restoLocatorSearchInputEl);
getCurrentLocation();

// Function that allows auto complete feature by using Google Places API
function autoComplete(inputEl) {
    const autoComCoord = {};
    // Create new object of Google places with the type of 'geocode'
    const places = new google.maps.places.Autocomplete(inputEl, { types: ['geocode'] });
    console.log("Google Places object: ", places);

    // Add event listener of 'Key Stroke / place_change' to the search box
    google.maps.event.addListener(places, 'place_changed', function () {
        const selectedPlace = places.getPlace();
        autoComCoord.lat = selectedPlace.geometry.location.lat();
        autoComCoord.lon = selectedPlace.geometry.location.lng();
        // displayresto(autoComCoord);
        getCurWeather(autoComCoord, "");
    });
}

// Function that gets user's current location
// After received location/coordinates (lat & long),
// pass coordinates to get Weather info from Open Weather API server
function getCurrentLocation() {
    const getCurLocCoord = {};
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            getCurLocCoord.lat = position.coords.latitude;
            getCurLocCoord.lon = position.coords.longitude;
            console.log("getCurLocCoord: ", getCurLocCoord);
            // get weather data from API server based on the coordinates received
            getCurWeather(getCurLocCoord, "");
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
    }
    restoLocatorSearchInputEl.focus();
}

// Function that converts unix epoch to local time.
// It returns array ["MM/DD/YYYY, HH:MM:SS AM", "MM/DD/YYYY", "HH:MM:SS AM"]
function convertDate(epoch) {
    let readable = [];
    let myDate = new Date(epoch * 1000);

    // local time
    // returns string "MM/DD/YYYY, HH:MM:SS AM"
    readable[0] = (myDate.toLocaleString());
    readable[1] = ((myDate.toLocaleString().split(", "))[0]);
    readable[2] = ((myDate.toLocaleString().split(", "))[1]);

    return readable;
}

// Function that checks if user want to search by zip code or query string
function getSearchMethod(searchStr) {
    let searchMethod;
    if (searchStr.length === 5 && parseInt(searchStr) + '' === searchStr) {
        searchMethod = 'zip';
    } else {
        searchMethod = 'q';
    }

    return searchMethod;
}

// Function that gets weather info from Open Weather API server
// It also leverages the received coordinates to pull restaurant data
// from Zomato API server as well (It calls the function displayResto())
function getCurWeather(coord, searchTerm) {
    const apiKey = "166a433c57516f51dfab1f7edaed8413";
    let queryURL = "";
    // query based on coordinates: lat and lon
    if (searchTerm === "" && coord !== null) {
        queryURL = `https://api.openweathermap.org/data/2.5/weather?lat=${coord.lat}&lon=${coord.lon}&units=imperial&appid=${apiKey}`;
    }
    // query based on zip or city name
    else if (searchTerm !== "") {
        queryURL = `https://api.openweathermap.org/data/2.5/weather?${getSearchMethod(searchTerm)}=${searchTerm}&units=imperial&appid=${apiKey}`;
    }
    console.log("queryURL: ", queryURL);
    // Create an AJAX call to retrieve data Log the data in console
    $.ajax({
        url: queryURL,
        method: 'GET'
    })
        .then(function (response) {
            console.log("Weather data: ", response);

            // Get resto data from Zomato API server based on the coordinates received
            displayresto(response.coord);
            weatherObj = {
                city: `${response.name}`,
                country: `${response.sys.country}`,
                wind: response.wind.speed,
                humidity: response.main.humidity,
                temp: response.main.temp,
                date: (convertDate(response.dt))[1],
                icon: `http://openweathermap.org/img/w/${response.weather[0].icon}.png`,
                desc: response.weather[0].description
            }

            // calls function to draw result to page
            renderCurrentWeather(weatherObj);

        })
        .catch(err => console.log("AJAX Error: ", err));
};

// Function to render weather data
function renderCurrentWeather(cur) {

    $('#weather').empty();
    const $cardTitle = $('<h5 class="card-title">');
    $cardTitle.text(cur.city + ", " + cur.country + " (" + cur.date + ")");

    const $ul = $('<ul>');
    const $iconLi = $('<li>');
    const $iconI = $('<img>');
    $iconI.attr('src', cur.icon);

    const $weathLi = $('<li>');
    $weathLi.text(cur.weather);

    const $temp = $('<li>');
    $temp.text('Temp: ' + cur.temp + " F");

    const $curWind = $('<li>');
    $curWind.text('Windspeed: ' + cur.wind + " MPH");

    const $humLi = $('<li>');
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

// Function that pulls resto data from Zomato API based on the coordinates
// This function gets called by the getCurWeather() function so it cang get coordinates from Open Weather API
function displayresto(coord) {
    const queryURL = `https://developers.zomato.com/api/v2.1/search?lat=${coord.lat}&lon=${coord.lon}&count=100&sort=real_distance&order=asc`;
    console.log("Resto queryURL: ", queryURL);

    const settings = {
        "async": true,
        "crossDomain": true,
        "url": queryURL,
        "method": "GET",
        "headers": {
            "user-key": "91ed3953ab67d3bc31054f6a0ee5a372",
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    $.getJSON(settings, function (response) {

        restoData = response.restaurants;
        console.log("Resto data returned from server: ", restoData);
        let html = "";
        // loop through the returned data
        $.each(restoData, function (index, value) {
            // define an object to store resto data
            const restoObj = restoData[index];
            $.each(restoObj, function (index, value) {
                // Show only restaurant that has picture
                if (value.thumb != "") {
                    const location = restoObj.restaurant.location;
                    const userRating = restoObj.restaurant.user_rating;
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
    });
}


