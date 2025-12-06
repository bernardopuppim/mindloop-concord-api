import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
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

async function upsertUser(claims: any) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  const registeredStrategies = new Set<string>();

  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

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
};

/**
 * Maps development role names from the X-Dev-Role header to actual database roles.
 * Only used in development mode for testing different role behaviors.
 */
export function mapDevRoleToDbRole(devRole: string): string | null {
  const roleMap: Record<string, string> = {
    "admin": "admin",
    "fiscal": "fiscal_petrobras",
    "operador": "operator_dica",
    "visualizador": "viewer",
  };
  return roleMap[devRole] || null;
}

/**
 * Gets the effective user role, considering dev role override in development mode.
 * 
 * DEVELOPMENT OVERRIDE MECHANISM:
 * When NODE_ENV !== "production" and an X-Dev-Role header is present,
 * the dev role overrides the user's actual database role for permission checks.
 * This allows testing different role behaviors without changing user data.
 * 
 * SECURITY: This override is disabled in production builds.
 * 
 * USAGE: Call this function in any route handler that needs to check user roles.
 * Example:
 *   const user = await storage.getUser(userId);
 *   const effectiveRole = getEffectiveRole(req, user?.role);
 *   if (effectiveRole === "admin") { ... }
 */
export function getEffectiveRole(req: any, actualRole: string | undefined): string | undefined {
  // Only allow dev role override outside production
  if (process.env.NODE_ENV === "production") {
    return actualRole;
  }
  
  const devRoleHeader = req.get("X-Dev-Role");
  if (devRoleHeader) {
    const mappedRole = mapDevRoleToDbRole(devRoleHeader);
    if (mappedRole) {
      console.log(`[DEV MODE] Role override active: ${actualRole} -> ${mappedRole}`);
      return mappedRole;
    }
  }
  
  return actualRole;
}

export const isAdmin: RequestHandler = async (req, res, next) => {
  const userSession = req.user as any;
  if (!userSession?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await storage.getUser(userSession.claims.sub);
  
  // Use effective role (may be overridden by dev role header in development)
  const effectiveRole = getEffectiveRole(req, user?.role);
  
  if (effectiveRole !== "admin" && effectiveRole !== "admin_dica") {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }

  return next();
};
