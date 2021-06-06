const mongoose = require('mongoose');
const express = require('express');
const dotenv = require('dotenv');
const querystring = require('querystring');
const axios = require('axios');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
// const {
//     SERVER_ROOT_URI,
//     GOOGLE_CLIENT_ID,
//     JWT_SECRET,
//     GOOGLE_CLIENT_SECRET,
//     COOKIE_NAME,
//     UI_ROOT_URI,
//   } = "./config.js";

const SERVER_ROOT_URI = 'http://localhost:900';
const GOOGLE_CLIENT_ID =
  '1085866787737-aid8av6e785e9id8am7lhbs2jvmgoni7.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = 'Wwyobyhi4X2HCUtOgZuy_1K0';
const UI_ROOT_URI = 'http://localhost:800';
const JWT_SECRET = 'bimNAqt77a66FKnQQctu5wKgYmkmtmP3';
const COOKIE_NAME = 'auth_token';

const app = express();
dotenv.config();
const port = 900;

app.use(
  cors({
    // Sets Access-Control-Allow-Origin to the UI URI
    origin: UI_ROOT_URI,
    // Sets Access-Control-Allow-Credentials to true
    credentials: true,
  })
);

app.use(cookieParser());

const redirectURI = 'auth/google';

mongoose
  .connect(process.env.MONGODB_URI, {
    // slice latihan adalah nama databasenya
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
  console.log();

  return `${rootUrl}?${querystring.stringify(options)}`;
}

// Getting login URL
app.get('/auth/google/url', (req, res) => {
  return res.send(getGoogleAuthURL());
});

function getTokens({ code, clientId, clientSecret, redirectUri }) {
  /*
   * Uses the code to get tokens
   * that can be used to fetch the user's profile
   */
  const url = 'https://oauth2.googleapis.com/token';
  const values = {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  };

  return axios
    .post(url, querystring.stringify(values), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    .then((res) => res.data)
    .catch((error) => {
      console.error(`Failed to fetch auth tokens`);
      throw new Error(error.message);
    });
}

app.get(`/${redirectURI}`, async (req, res) => {
  const code = req.query.code;
  console.log('codeee', code);

  const { id_token, access_token } = await getTokens({
    code,
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: `${SERVER_ROOT_URI}/${redirectURI}`,
  });

  // Fetch the user's profile with the access token and bearer
  const googleUser = await axios
    .get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      {
        headers: {
          Authorization: `Bearer ${id_token}`,
        },
      }
    )
    .then((res) => res.data)
    .catch((error) => {
      console.error(`Failed to fetch user`);
      throw new Error(error.message);
    });

  const token = jwt.sign(googleUser, JWT_SECRET);

  console.log('googleUser', googleUser);

  res.cookie(COOKIE_NAME, token, {
    maxAge: 900000,
    httpOnly: true,
    secure: false,
  });

  res.redirect(`${UI_ROOT_URI}?token=${token}`); //localhost:800/ ||| localhost:900/register
  // di endpoint register berarti 1. decode token = dapat info user email,name dll 2. setelah dapat user simpan ke DB 3. redirect ui / react
});

// Getting the current user
app.get('/auth/me', (req, res) => {
  console.log('get me');
  try {
    const decoded = jwt.verify(req.cookies[COOKIE_NAME], JWT_SECRET);
    console.log('decoded', decoded);
    return res.send(decoded);
  } catch (err) {
    console.log(err);
    res.send(null);
  }
});

// app.get('/register', (req, res) => {
//   try {
//     const decoded = jwt.verify(req.cookies[COOKIE_NAME], JWT_SECRET);
//     console.log('decoded', decoded);
//     return res.send(decoded);
//     // const email = googleUser.email;
//   } catch (error) {
//     console.log(err);
//     res.send(null);
//   }
// });
// app.post('/register') = async (req, res) => {
//      try {
//               const finduser = await User.findOne({ username: username.toLowerCase() });

//       if (finduser) {
//         res.status(400).json({status: 400, message: "user already exist"})
//       }
//       const user = await new User({
//             email : googleUser.email,
//         username: username,

//       }).save();
//       res.status(200).json({status: 200, message: 'Data Successfully inputed', user})
//     } catch (error) {
//           res.status(500).json({msg: "Internal server error"})
//     }
//   };

function main() {
  app.listen(port, () => {
    console.log(`App listening http://localhost:${port}`);
  });
}
main();
