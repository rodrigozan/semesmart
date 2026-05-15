import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import Profile from '../models/Profile.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, googleProfile, done) => {
      try {
        // 1. Try to find existing user by googleId
        let user = await User.findOne({ googleId: googleProfile.id }).populate('profiles');

        if (user) {
          return done(null, user);
        }

        // 2. New user — determine role
        const email = googleProfile.emails?.[0]?.value ?? '';
        const isOwner =
          process.env.OWNER_EMAIL
            ? email === process.env.OWNER_EMAIL
            : (await User.countDocuments()) === 0;

        const role = isOwner ? 'owner' : 'member';

        // 3. Create the user
        user = await User.create({
          googleId: googleProfile.id,
          email,
          name: googleProfile.displayName,
          avatar: googleProfile.photos?.[0]?.value ?? '',
          role,
          profiles: [],
        });

        // 4. Owner gets two default profiles
        if (isOwner) {
          const familiaProfile = await Profile.create({
            name: 'Família',
            slug: 'familia',
            owner: user._id,
            members: [],
            avatar: '👨‍👩‍👧',
            color: '#7B2FBE',
          });

          const phanteraiProfile = await Profile.create({
            name: 'PhanterAI',
            slug: 'phanterai',
            owner: user._id,
            members: [],
            avatar: '🤖',
            color: '#A855F7',
          });

          user.profiles = [familiaProfile._id, phanteraiProfile._id];
          await user.save();

          // Re-populate profiles for the session
          await user.populate('profiles');
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).populate('profiles');
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
