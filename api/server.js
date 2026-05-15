import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from './config/passport.js';
import authRouter from './routes/auth.js';
import profilesRouter from './routes/profiles.js';
import transactionsRouter from './routes/transactions.js';
import investmentsRouter from './routes/investments.js';
import goalsRouter from './routes/goals.js';
import aiRouter from './routes/ai.js';
import dashboardRouter from './routes/dashboard.js';

// ─── Database ───────────────────────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/semesmart';
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

await mongoose.connect(MONGODB_URI);
console.log('MongoDB conectado!');

// ─── App ─────────────────────────────────────────────────────────────────────

const app = express();

// CORS — credentials required for session cookies
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());

// ─── Session ──────────────────────────────────────────────────────────────────

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGODB_URI,
      touchAfter: 24 * 3600, // lazy session update — only resave after 24 h of inactivity
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// ─── Passport ────────────────────────────────────────────────────────────────

app.use(passport.initialize());
app.use(passport.session());

// ─── Routes ──────────────────────────────────────────────────────────────────

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'SemeSmart API' });
});

// Auth (Google OAuth)
app.use('/auth', authRouter);

// AI Insights route
app.use('/api', aiRouter);

// ─── ETAPA 2 Routes ───────────────────────────────────────────────────────────

// Profiles CRUD + member management
app.use('/api/profiles', profilesRouter);

// Nested resource routes — all scoped to /:profileId
app.use('/api/profiles/:profileId/transactions', transactionsRouter);
app.use('/api/profiles/:profileId/investments', investmentsRouter);
app.use('/api/profiles/:profileId/goals', goalsRouter);

// ─── FASE 9 — Consolidated Dashboard ───────────────────────────────────────────

app.use('/api/dashboard', dashboardRouter);

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
