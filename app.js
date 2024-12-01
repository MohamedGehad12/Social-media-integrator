// This is the Express server that will handle OAuth flow
// and will receive the access token from Twitter
// and will also be responsible for fetching the user's followers
// and will be used by the client to make requests to Twitter API
//
// The server is created to separate the logic of handling the OAuth flow
// and the logic of fetching the user's followers and to avoid
// potential security issues that can arise from mixing the two
//
// The server is also responsible for setting up CORS to allow
// the frontend to make requests to the server

const { Client, auth } = require("twitter-api-sdk");
const express = require("express");
const axios = require("axios");
// const dotenv = require("dotenv");
const cors = require("cors");
let accessToken = "";
// dotenv.config();

var Facebook = require('facebook-node-sdk');
const app = express();
app.use(cors());

const authClient = new auth.OAuth2User({
  client_id: "Z0hWVjZJUW5mLXBCdDdwNTB1VW86MTpjaQ",
  client_secret: "ymQB87GHvuZwCwh26ALWUjHekcQI7YJlkydWdMWQDRclOe1rm_",
  callback: "http://localhost:3000/callback",
  scopes: ["tweet.read", "users.read"],
});

const client = new Client(authClient);

const STATE = "my-state";

app.get("/callback", async function (req, res) {
  try {
    const { code, state } = req.query;
    if (state !== STATE) return res.status(500).send("State isn't matching");
    accessToken = (await authClient.requestAccessToken(code)).token
      .access_token;
    console.log("AccessToken: " + JSON.stringify(accessToken));

    res.send(`
      <html>
      <body>
        <p>You have been authenticated with this platform. You can close the window now.</p>
        <script>
          // Pass the access token and status to the parent window
          window.opener.postMessage({ token: ${JSON.stringify(
            accessToken
          )}, status: "Login successful" }, "*");

          // Close the window after a delay
          setTimeout(() => {
            window.close();
          }, 3000); // 3 seconds delay
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.log(error);
  }
});

app.get("/login", async function (req, res) {
  const authUrl = authClient.generateAuthURL({
    state: STATE,
    code_challenge_method: "s256",
  });
  console.log(authUrl);
  res.redirect(authUrl);
});

app.get("/tweets", async function (req, res) {
  const tweets = await client.tweets.findTweetById("20");
  res.send(tweets.data);
});

app.get("/revoke", async function (req, res) {
  try {
    const response = await authClient.revokeAccessToken();
    res.send(response);
  } catch (error) {
    console.log(error);
  }
});

app.post("/followers", async (req, res) => {
  try {
    // const { accessToken } = req.body;

    const userResponse = await axios.get("https://api.twitter.com/2/users/me", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const userId = userResponse.data.data.id;
    console.log("User ID: " + userId);

    const response = await client.tweets.usersIdTimeline(userId,{max_results:3})

    res.send(response.data);
  } catch (error) {
    console.error("Error fetching followers:", error);
    res.status(500).send("Failed to fetch followers");
  }
});

app.use(
  cors({
    origin: "https://localhost:3001",
  })
);

app.listen(3000, () => {
  console.log(`Go here to login: http://localhost:3000/login`);
});

const FB =require("fb");

// Replace with your Facebook App credentials
const APP_ID = '1639476143274715';
const APP_SECRET = 'ff71c9b332ae282569dc5428148da8a5';
const REDIRECT_URI = `http://localhost:${3000}/callback2`;

// Endpoint to initiate Facebook OAuth
app.get('/auth', (req, res) => {
    const fbAuthUrl = `https://www.facebook.com/v16.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user_posts`;
    res.redirect(fbAuthUrl);
});
const accessTokenfb=""
// Callback endpoint to handle Facebook OAuth
app.get('/callback2', (req, res) => {
    const { code } = req.query;

    if (!code) {
        res.send('Error: Authorization failed.');
        return;
    }

    // Exchange the code for an access token
    FB.api('oauth/access_token', {
        client_id: APP_ID,
        client_secret: APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code,
    }, (response) => {
        if (!response || response.error) {
            console.error('Error while getting access token:', response.error);
            res.send('Error while getting access token.');
            return;
        }

         accessTokenfb = response.access_token;

        // Save access token to a file
        console.log('Access token saved successfully.');

        res.send('Authorization successful! Access token saved.');
    });
});

// Endpoint to verify and use the saved token
app.get('/verify', (req, res) => {
    const token = fs.readFileSync('access_token.txt', 'utf8');

    FB.setAccessToken(accessTokenfb);
    FB.api('/me', { fields: 'id,name' }, (response) => {
        if (!response || response.error) {
            console.error('Error verifying token:', response.error);
            res.send('Error verifying token.');
            return;
        }

        res.send(`Token is valid. Welcome, ${response.name}!`);
    });
});