import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
// @ts-ignore
import AppleStrategy from "passport-apple";
import { UserModel } from "../models/userModel";
import { UserRole } from "../enums/userRole";
import { ApprovalStatus } from "../enums/approvalStatus";

// Request එකෙන් state එක කියවාගෙන සුදුසු UserRole එක ලබාදෙන Helper Function එකක්
const getDynamicRole = (req: any): UserRole => {
  try {
    if (req.query && req.query.state) {
      const stateData = JSON.parse(req.query.state as string);
      if (stateData.role === "freelancer") {
        return UserRole.FREELANCER;
      }
    }
  } catch (e) {
    console.error("Error parsing OAuth state:", e);
  }
  return UserRole.CLIENT; // Default fallback role
};

// =========================================================================
// GOOGLE STRATEGY
// =========================================================================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/api/v1/auth/google/callback",
      passReqToCallback: true, // 👈 Request එක callback එකට ලබාගැනීමට
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) {
          return done(new Error("Email not provided by Google"), undefined);
        }

        let user = await UserModel.findOne({ email });

        // නව පරිශීලකයෙක් නම් පමණක් Sign up සිදුකරයි
        if (!user) {
          const dynamicRole = getDynamicRole(req);

          user = await UserModel.create({
            firstName: profile.name?.givenName || profile.displayName,
            lastName: profile.name?.familyName || "",
            email: email,
            password: Math.random().toString(36).slice(-8), 
            profileImage: profile.photos?.[0].value,
            userRole: [dynamicRole], // 👈 තෝරාගත් Role එක ඇතුළත් වේ
            approvalStatus: ApprovalStatus.APPROVED,
          });
        }
        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

// =========================================================================
// GITHUB STRATEGY
// =========================================================================
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: "/api/v1/auth/github/callback",
      scope: ["user:email"],
      passReqToCallback: true, // 👈 Request එක callback එකට ලබාගැනීමට
    },
    async (req: any, accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        const email = profile.emails?.[0]?.value || `${profile.username}@github.com`;
        let user = await UserModel.findOne({ email });

        if (!user) {
          const dynamicRole = getDynamicRole(req);
          const names = profile.displayName ? profile.displayName.split(" ") : [profile.username, ""];
          
          user = await UserModel.create({
            firstName: names[0],
            lastName: names.slice(1).join(" ") || "",
            email: email,
            password: Math.random().toString(36).slice(-8),
            profileImage: profile.photos?.[0]?.value,
            userRole: [dynamicRole], // 👈 තෝරාගත් Role එක ඇතුළත් වේ
            approvalStatus: ApprovalStatus.APPROVED,
          });
        }
        return done(null, user);
      } catch (error) {
        return done(error, undefined);
      }
    }
  )
);

// =========================================================================
// APPLE STRATEGY
// =========================================================================
passport.use(
  new AppleStrategy(
    {
      clientID: process.env.APPLE_CLIENT_ID!,
      teamID: process.env.APPLE_TEAM_ID!,
      keyID: process.env.APPLE_KEY_ID!,
      privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH!, 
      callbackURL: "/api/v1/auth/apple/callback",
      scope: ["name", "email"],
      passReqToCallback: true, // 👈 Request එක callback එකට ලබාගැනීමට
    },
    async (req: any, accessToken: string, refreshToken: string, idToken: string, profile: any, done: any) => {
      try {
        const email = profile?.email; 
        if (!email) {
          return done(new Error("Email not provided by Apple"), undefined);
        }

        let user = await UserModel.findOne({ email });

        if (!user) {
          const dynamicRole = getDynamicRole(req);

          user = await UserModel.create({
            firstName: profile?.name?.firstName || "Apple",
            lastName: profile?.name?.lastName || "User",
            email: email,
            password: Math.random().toString(36).slice(-8),
            userRole: [dynamicRole], // 👈 තෝරාගත් Role එක ඇතුළත් වේ
            approvalStatus: ApprovalStatus.APPROVED,
          });
        }
        return done(null, user);
      } catch (error) {
        return done(error, undefined);
      }
    }
  )
);

export default passport;