// lib/config.ts

/**
 * Application configuration from environment variables
 */
export const config = {
  app: {
    environment: process.env.NODE_ENV || "development",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },

  database: {
    url: process.env.DATABASE_URL,
    shadowUrl: process.env.SHADOW_DATABASE_URL,
  },

  auth: {
    clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    clerkSecretKey: process.env.CLERK_SECRET_KEY,
    jwtSecret: process.env.JWT_SECRET,
  },

  email: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    adminEmail: process.env.MY_EMAIL || process.env.ADMIN_EMAIL,
  },

  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  storage: {
    blobReadWriteToken: process.env.BLOB_READ_WRITE_TOKEN,
  },
};

/**
 * Validate essential configuration values
 */
export function validateConfig() {
  const requiredVars = [
    ["database.url", config.database.url],
    ["auth.clerkSecretKey", config.auth.clerkSecretKey],
    ["stripe.secretKey", config.stripe.secretKey],
  ];

  const missing = requiredVars
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
    process.exit(1);
  }
}
