const mongoose = require('mongoose');
const express = require('express');
const dotenv = require('dotenv');
const querystring = require('querystring');
const axios = require('axios');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
const User = require('./model/User');

const SERVER_ROOT_URI = 'http://localhost:900';
const GOOGLE_CLIENT_ID =
  '1085866787737-aid8av6e785e9id8am7lhbs2jvmgoni7.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = 'Wwyobyhi4X2HCUtOgZuy_1K0';
const JWT_SECRET = 'bimNAqt77a66FKnQQctu5wKgYmkmtmP3';
const COOKIE_NAME = 'auth_token';

const app = express();
dotenv.config();
const port = 900;

app.use(
  cors({
    // Sets Access-Control-Allow-Origin to the UI URI

    // Sets Access-Control-Allow-Credentials to true
    credentials: true,
  })
);

app.use(cookieParser());

const redirectURI = 'auth/google';

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => console.log('mongodb connected'))
  .catch((err) => {
    console.log(err);
  });

function getGoogleAuthURL() {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: `${SERVER_ROOT_URI}/${redirectURI}`,
    client_id: GOOGLE_CLIENT_ID,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
  };

  return `${rootUrl}?${querystring.stringify(options)}`;
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/login.html'));
});

app.get('/auth/success', (req, res) => {
  const token = req.query.token;
  res.cookie(COOKIE_NAME, token, {
    maxAge: 900000,
    httpOnly: true,
    secure: false,
  });
});

// Getting login URL
app.get('/auth/google/url', (req, res) => {
  const googleAuthURL = getGoogleAuthURL();

  res.redirect(googleAuthURL);
});

async function getTokens({ code, clientId, clientSecret, redirectUri }) {
  const url = 'https://oauth2.googleapis.com/token';
  const values = {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  };

  try {
    const { data } = await axios.post(url, querystring.stringify(values), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return data;
  } catch (error) {
    console.error(error);
  }
}

app.get(`/${redirectURI}`, async (req, res) => {
  const code = req.query.code;

  const { id_token, access_token } = await getTokens({
    code,
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: `${SERVER_ROOT_URI}/${redirectURI}`,
  });

  try {
    const { data } = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      {
        headers: {
          Authorization: `Bearer ${id_token}`,
        },
      }
    );
    const user = await new User({
      socialId: data.id,
      email: data.email,
    }).save();

    const token = jwt.sign(data, JWT_SECRET);

    res
      .status(200)
      .json({ message: 'google oauth success', access_token: token });
  } catch (error) {
    console.error(error);
  }
});

function main() {
  app.listen(port, () => {
    console.log(`App listening http://localhost:${port}`);
  });
}
main();
