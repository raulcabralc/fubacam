# Fubacam

Fubacam is a private, non-commercial Discord bot built for the Fubalicious Valorant team, also known as FBL.

The bot helps team members keep a shared history of their Valorant matches inside a private Discord server. Players voluntarily link their Riot account through Riot Sign On, and Fubacam uses the official Riot Games API to check recent Valorant matches, store local match history, post match summaries, and generate simple internal rankings for opted-in team members.

Fubacam is not a public product, SaaS platform, commercial service, or analytics business. It is an internal team tool used only by members of the Fubalicious Discord server.

## Purpose

Fubacam was created to make it easier for a small Valorant team to follow its own activity over time.

The bot can:

- Register Discord users as Fubalicious players.
- Let players opt in by linking their Riot account through Riot Sign On.
- Periodically check for recent Valorant matches through an approved Riot API integration.
- Store a local match history for the private Discord server.
- Post match summary embeds in a configured Discord channel.
- Show each player's latest stored match.
- Generate simple internal rankings based on stored team matches.
- Keep working with mock or manual data while external APIs are unavailable.

## Privacy And Data Use

Fubacam only tracks players who explicitly opt in.

Players authorize account linking through Riot Sign On. The bot does not collect Riot passwords, does not ask users to share login credentials, and does not scrape Riot, Tracker Network, or third-party websites.

The application stores only the data needed for the Discord bot to function:

- Discord user ID.
- Discord server ID.
- Riot ID display information.
- Riot PUUID after authorization.
- Valorant match summaries and basic performance statistics.
- Discord channel settings for match summary posts.

Data is used only inside the private Fubalicious Discord server. Match summaries and rankings are not sold, monetized, or exposed as a public database.

## Riot Games Integration

The intended production provider is `RiotMatchProvider`, which uses Riot Sign On and the official Riot Games API.

The expected player flow is:

1. A player uses `/link-riot` in the private Discord server.
2. Fubacam generates a Riot Sign On authorization link.
3. The player logs in on Riot's website and authorizes access.
4. Riot redirects back to Fubacam's callback URL.
5. Fubacam stores the player's Riot PUUID in MongoDB.
6. The bot uses the official Valorant match API to check recent matches for opted-in players.

Fubacam requires an approved Riot production application with access to Valorant match data and Riot Sign On.

## Discord Commands

- `/link-riot` - Link a Riot account through Riot Sign On.
- `/register riotname tagline` - Register a player manually or for fallback flows.
- `/unregister` - Remove the current user's active registration.
- `/set-channel channel` - Set the Discord channel where match summaries are posted.
- `/players` - List registered Fubalicious players.
- `/lastmatch user` - Show the latest stored match for a player, fetching from the active provider if needed.
- `/ranking` - Show a simple internal ranking based on stored matches.
- `/mock-match` - Generate a fake match for testing without external API access.
- `/tracking-status` - Show the active provider, tracking status, and last check time.

## Architecture

Fubacam uses a provider-based architecture. The Discord commands and services depend on the `MatchProvider` interface instead of depending directly on any external API.

Current providers:

- `RiotMatchProvider` - Official Riot Games API provider for Valorant match data.
- `TrackerMatchProvider` - Legacy experimental provider for Tracker Network API.
- `MockMatchProvider` - Development and test provider for fake matches.

This keeps the bot usable even when an external provider is unavailable or needs to be replaced.

## Technology

- Node.js
- TypeScript
- discord.js
- MongoDB
- Mongoose
- zod
- node-cron
- Native fetch API

## Environment Variables

Copy `.env.example` to `.env` and configure the values for your environment.

```env
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_GUILD_ID=
MONGODB_URI=

RIOT_API_KEY=
RIOT_CLIENT_ID=
RIOT_CLIENT_SECRET=
RIOT_REDIRECT_URI=
RIOT_API_REGION=americas
AUTH_SERVER_PORT=3001

TRACKER_API_KEY=
TRACKER_API_BASE_URL=https://public-api.tracker.gg

MATCH_PROVIDER=riot
```

`MATCH_PROVIDER` supports:

- `riot`
- `mock`
- `tracker`

For local testing without Riot API access, use:

```env
MATCH_PROVIDER=mock
```

## Running Locally

Install dependencies:

```bash
npm install
```

Run in development mode:

```bash
npm run dev
```

Type-check the project:

```bash
npm run typecheck
```

Build for production:

```bash
npm run build
```

Start the compiled bot:

```bash
npm start
```

## Deployment Notes

For Riot Sign On to work, `RIOT_REDIRECT_URI` must be a public URL registered in the Riot Developer Portal.

Example:

```env
RIOT_REDIRECT_URI=https://fubacam.example.com/auth/riot/callback
AUTH_SERVER_PORT=3001
```

In production, a reverse proxy such as Nginx, Caddy, or a tunnel can forward the public callback URL to the bot's local callback server.

## Project Status

Fubacam is an internal project for the Fubalicious Valorant team. It is actively being developed as a private Discord match tracker with official Riot account authorization and provider-based match data integration.
