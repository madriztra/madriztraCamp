# Music Growth OS

Production-oriented music marketing automation for independent artists and labels.

## Included

- Next.js 15 App Router, TypeScript, TailwindCSS, shadcn-style UI, Framer Motion-ready components, and Recharts
- Credentials and Google authentication with profile and password reset flows
- MongoDB/Mongoose schemas for users, songs, campaigns, content, scheduled posts, analytics, smart links, and connected accounts
- Spotify, YouTube, SoundCloud, and Apple Music metadata/analytics adapter architecture
- S3-compatible audio and cover uploads
- AI campaign generation with 30+ publishable content ideas
- BullMQ scheduling, exponential retries, and real Instagram/TikTok/YouTube publishing adapters
- Smart-link pages with SEO, JSON-LD, tracked redirects, device, geo, and source analytics
- Docker, Compose, seed script, ESLint, Prettier, and GitHub Actions CI

## Local Development

1. Copy `.env.example` to `.env.local` and configure integrations.
   The default runtime is free and safe: `AI_PROVIDER=local`, `STORAGE_DRIVER=local`, `QUEUE_DRIVER=local`, and `PUBLISHING_MODE=sandbox`.
2. Start local infrastructure:

   ```bash
   docker compose up -d mongo redis minio minio-init
   ```

3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

4. Run the scheduler worker in another terminal:

   ```bash
   npm run worker
   ```

5. Seed only a disposable development database:

   ```bash
   npm run seed
   ```

The seed script deletes existing application collections before inserting sample data.

## Atlas

Add the machine or deployment IP under Atlas **Network Access** before connecting. Use a dedicated database user with least-privilege access to the `music-growth-os` database.

## Validation

```bash
npm run typecheck
npm run lint
npm run build
```

## Production

- Set all values from `.env.example` in the deployment platform.
- Keep free/sandbox modes for development; switch to `AI_PROVIDER=openai`, `STORAGE_DRIVER=s3`, `QUEUE_DRIVER=redis`, and `PUBLISHING_MODE=live` only after credentials and scopes are ready.
- For zero-cost AI on OpenRouter, use `OPENAI_BASE_URL=https://openrouter.ai/api/v1` and `OPENAI_MODEL=openrouter/free`; OpenRouter will route to an available free model.
- Run the Next.js service and BullMQ worker as separate long-running processes.
- Use Redis persistence and a private S3-compatible bucket with an approved public/CDN delivery path.
- Configure provider OAuth tokens and publishing scopes before scheduling social posts.
