import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'theiakshi-enterprise-secret-key-2026',
  refreshSecret: process.env.REFRESH_SECRET || 'theiakshi-refresh-token-secret-2026',
  googleDrive: {
    clientId: process.env.GOOGLE_DRIVE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_DRIVE_SECRET || '',
    refreshToken: process.env.GOOGLE_DRIVE_REFRESH_TOKEN || '',
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
  },
  renderUrl: process.env.RENDER_URL || 'https://hr-portal-backend-gcfp.onrender.com',
  netlifyUrl: process.env.NETLIFY_URL || '',
};
