import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import GoogleStrategy from "passport-google-oauth20";
import LocalStrategy from "passport-local";

import passport from "passport";
import session from "express-session";
import createMemoryStore from "memorystore";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { hashPassword, verifyPassword, generateRandomPassword, loginSchema, registerSchema } from "./authUtils";
import { z } from "zod";

// In production, REPLIT_DOMAINS must be set. In development, we skip Replit auth.
if (process.env.NODE_ENV === "production" && !process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    if (process.env.NODE_ENV !== "production" || !process.env.REPL_ID) {
      throw new Error("Replit OIDC not configured for development");
    }
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  let sessionStore: session.Store;

  if (process.env.DATABASE_URL) {
    const pgStore = connectPg(session);
    sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      ttl: sessionTtl,
      tableName: "sessions",
    });
  } else {
    const MemoryStore = createMemoryStore(session);
    sessionStore = new MemoryStore({ checkPeriod: sessionTtl });
  }
  return session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
  authProvider: string = "replit"
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    authProvider,
    providerId: claims["sub"],
    isEmailVerified: true, // OAuth providers verify email
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  let config;
  try {
    config = await getOidcConfig();
  } catch (error) {
    // Skip Replit OIDC in development
    if (process.env.NODE_ENV !== "production") {
      config = null;
    } else {
      throw error;
    }
  }

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new (GoogleStrategy as any)({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback"
    }, async (accessToken: any, refreshToken: any, profile: any, done: any) => {
      try {
        const user = {
          id: profile.id,
          email: profile.emails?.[0]?.value,
          firstName: profile.name?.givenName,
          lastName: profile.name?.familyName,
          profileImageUrl: profile.photos?.[0]?.value,
          authProvider: "google",
          providerId: profile.id,
          isEmailVerified: true
        };
        
        const savedUser = await storage.upsertUser(user);
        done(null, savedUser);
      } catch (error) {
        console.error("GoogleStrategy verify error:", error);
        done(error, null);
      }
    }));
  }

  // Local Strategy for email/password login
  passport.use(new (LocalStrategy as any)({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email: string, password: string, done: any) => {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));

  // Register Replit auth strategies only if configured
  if (config && process.env.NODE_ENV === "production" && process.env.REPLIT_DOMAINS) {
    for (const domain of process.env.REPLIT_DOMAINS.split(",")) {
      const strategy = new Strategy(
        {
          name: `replitauth:${domain}`,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
    }
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Google OAuth routes
  app.get("/api/auth/google", passport.authenticate("google", {
    scope: ["profile", "email"]
  }));

  app.get("/api/auth/google/callback", (req, res, next) => {
    passport.authenticate("google", async (err: any, user: any, info: any) => {
      if (err) {
        console.error("/api/auth/google/callback error:", err);
        const message = (err && (err.message || err.toString())) || "Google auth failed";
        return res.status(500).json({ message });
      }
      if (!user) {
        console.error("/api/auth/google/callback no user:", info);
        return res.status(400).json({ message: "Google authentication failed", info });
      }
      req.logIn(user, (loginErr: any) => {
        if (loginErr) {
          console.error("/api/auth/google/callback login error:", loginErr);
          return res.status(500).json({ message: "Login failed after Google auth" });
        }
        return res.redirect("/");
      });
    })(req, res, next);
  });

  // Local authentication routes
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Internal server error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.logIn(user, (err: any) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        return res.json({ message: "Login successful", user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, qrCode: user.qrCode } });
      });
    })(req, res, next);
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);
      
      // Create user
      const user = await storage.upsertUser({
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        authProvider: "local",
        isEmailVerified: false, // Will need email verification in production
      });

      console.log("Created user:", JSON.stringify(user, null, 2));

      res.status(201).json({ message: "User created successfully", user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, qrCode: user.qrCode } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // In development, provide a simple /api/login that redirects to client /login
  if (app.get("env") === "development") {
    app.get("/api/login", (_req, res) => {
      return res.redirect("/login");
    });
  }

  // Logout route (always available)
  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      // Clear session cookies
      res.clearCookie('connect.sid');
      res.clearCookie('session');
      
      // Redirect to login page
      res.redirect('/login');
    });
  });

  // Legacy Replit auth routes (only if configured)
  if (config && process.env.REPLIT_DOMAINS) {
    app.get("/api/login", (req, res, next) => {
      passport.authenticate(`replitauth:${req.hostname}`, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    });

    app.get("/api/callback", (req, res, next) => {
      passport.authenticate(`replitauth:${req.hostname}`, {
        successReturnToOrRedirect: "/",
        failureRedirect: "/api/login",
      })(req, res, next);
    });
  }
}

export const isAuthenticated = (async (req: any, res: any, next: any) => {
  const user = req.user as any;

  // Not logged in at all
  if (!req.isAuthenticated() || !user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // If this is a Replit OIDC user, manage token expiry/refresh
  if (user.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    if (now <= user.expires_at) {
      return next();
    }

    const refreshToken = user.refresh_token;
    if (!refreshToken) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      const config = await getOidcConfig();
      const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
      updateUserSession(user, tokenResponse);
      return next();
    } catch (error) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
  }

  // For Google/local users, just proceed
  return next();
}) as any;
