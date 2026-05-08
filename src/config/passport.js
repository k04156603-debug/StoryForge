const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const config = require('../config');

if (config.google.clientId && config.google.clientSecret) {
  try {
    passport.use(
      new GoogleStrategy(
        {
          clientID: config.google.clientId,
          clientSecret: config.google.clientSecret,
          callbackURL: `${config.backendUrl}/api/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            let user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
              return done(null, user);
            }

            user = await User.create({
              name: profile.displayName,
              email: profile.emails[0].value,
              password: `google_${profile.id}_${Date.now()}`,
              googleId: profile.id,
            });

            return done(null, user);
          } catch (err) {
            return done(err, null);
          }
        }
      )
    );
    console.log('✅ Google OAuth Strategy initialized successfully.');
  } catch (error) {
    console.error('❌ Failed to initialize Google Strategy:', error.message);
  }
}

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

module.exports = passport;