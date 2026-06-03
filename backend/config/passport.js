require("dotenv").config();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const db = require("./db");

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          "http://localhost:5000/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;
          const name = profile.displayName;
          const result = await db.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
          );

          const rows = result.rows; 

          let user;

          if (rows.length === 0) {
           
            const insertResult = await db.query(
              "INSERT INTO users (name, email, password, is_verified, role) VALUES ($1, $2, NULL, true, 'user') RETURNING id, name, email, role",
              [name, email]
            );

            user = insertResult.rows[0];
          } else {
            user = rows[0];
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  console.warn("⚠️ [Passport] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured. Google Auth is disabled.");
}

module.exports = passport;