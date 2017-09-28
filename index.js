"use strict";
// --------------------------------------------------------------------------
// Require statements
// --------------------------------------------------------------------------
var express = require("express");
var bodyParser = require("body-parser");
var request = require("request");
var requestjs = require("request-json");

var APP_ID = "c73a76ec-967e-46fe-9172-86960eadab74";
var APP_SECRET = "2axyimvdo3vvravo6wnlpr4viwxn6134";
var SPACE_ID = "589b316de4b062602d9ab05b";

// --------------------------------------------------------------------------
// Setup global variables
// --------------------------------------------------------------------------

// Workspace API Setup - fixed stuff
const WWS_URL = "https://api.watsonwork.ibm.com";
const AUTHORIZATION_API = "/oauth/token";
const OAUTH_ENDPOINT = "/oauth/authorize";

// --------------------------------------------------------------------------
// Setup the express server
// --------------------------------------------------------------------------
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + "/public"));

// create application/json parser
var jsonParser = bodyParser.json();

// --------------------------------------------------------------------------
// Express Server runtime
// --------------------------------------------------------------------------
// Start our server !
app.listen(process.env.PORT || 3000, function() {
    console.log("INFO: app is listening on port %s", (process.env.PORT || 3000));
});

// --------------------------------------------------------------------------
// REST API test : listen for POST requests on /test-message, parse the incoming JSON
app.post("/test-message", jsonParser, function(req, res) {
    console.log(req.body);

    // Build your name from the incoming JSON
    var myMsg = req.body.fname + " " + req.body.lname;

    // Let's try to authenticate
    getJWTToken(APP_ID, APP_SECRET, function(jwt) {
        console.log("JWT Token :", jwt);
        postMessageToSpace(SPACE_ID, jwt, myMsg, function(success) {
            if (success) {
                res.status(200).end();
            } else {
                res.status(500).end();
            }
        })
    })

});

//--------------------------------------------------------------------------
//Get an authentication token
function getJWTToken(userid, password, callback) {
    // Build request options for authentication.
    const authenticationOptions = {
        "method": "POST",
        "url": `${WWS_URL}${AUTHORIZATION_API}`,
        "auth": {
            "user": userid,
            "pass": password
        },
        "form": {
            "grant_type": "client_credentials"
        }
    };

    // Get the JWT Token
    request(authenticationOptions, function(err, response, authenticationBody) {

        // If successful authentication, a 200 response code is returned
        if (response.statusCode !== 200) {
            // if our app can't authenticate then it must have been
            // disabled. Just return
            console.log("ERROR: App can't authenticate");
            callback(null);
        }
        const accessToken = JSON.parse(authenticationBody).access_token;
        callback(accessToken);
    });
}

//--------------------------------------------------------------------------
//Post a message to a space
function postMessageToSpace(spaceId, accessToken, textMsg, callback) {
    var jsonClient = requestjs.createClient(WWS_URL);
    var urlToPostMessage = "/v1/spaces/" + spaceId + "/messages";
    jsonClient.headers.jwt = accessToken;

    // Building the message
    var messageData = {
        type: "appMessage",
        version: 1.0,
        annotations: [
            {
                type: "generic",
                version: 1.0,
                color: "#00B6CB",
                title: "Hello ...",
                text: textMsg,
                actor: {
                    name: "My first bot",
                    avatar: "",
                    url: ""
                }
            }
        ]
    };

    // Calling IWW API to post message
    console.log("Message body : %s", JSON.stringify(messageData));

    jsonClient.post(urlToPostMessage, messageData, function(err, jsonRes, jsonBody) {
        if (jsonRes.statusCode === 201) {
            console.log("Message posted to IBM Watson Workspace successfully!");
            callback(true);
        } else {
            console.log("Error posting to IBM Watson Workspace !");
            console.log("Return code : " + jsonRes.statusCode);
            console.log(jsonBody);
            callback(false);
        }
    });

}
