import passport from 'passport';
import { Strategy as KakaoStrategy } from 'passport-kakao';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as NaverStrategy } from 'passport-naver-v2';

/**
 * Passport 직렬화/역직렬화
 */
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

/**
 * Kakao Strategy
 */
passport.use(
  new KakaoStrategy(
    {
      clientID: process.env.KAKAO_CLIENT_ID,
      callbackURL: process.env.KAKAO_REDIRECT_URI
    },
    (accessToken, refreshToken, profile, done) => {
      const user = {
        provider: 'KAKAO',
        id: profile.id,
        email: profile._json.kakao_account?.email || null,
        nickname: profile.displayName || profile.username
      };
      return done(null, user);
    }
  )
);

/**
 * Google Strategy
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI
    },
    (accessToken, refreshToken, profile, done) => {
      const user = {
        provider: 'GOOGLE',
        id: profile.id,
        email: profile.emails?.[0]?.value || null,
        nickname: profile.displayName
      };
      return done(null, user);
    }
  )
);

/**
 * Naver Strategy
 */
passport.use(
  new NaverStrategy(
    {
      clientID: process.env.NAVER_CLIENT_ID,
      clientSecret: process.env.NAVER_CLIENT_SECRET,
      callbackURL: process.env.NAVER_REDIRECT_URI
    },
    (accessToken, refreshToken, profile, done) => {
      const user = {
        provider: 'NAVER',
        id: profile.id,
        email: profile.email || null,
        nickname: profile.nickname || profile.name
      };
      return done(null, user);
    }
  )
);

export default passport;