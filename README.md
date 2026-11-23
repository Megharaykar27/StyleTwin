# StyleTwin

**See it on you. Before you buy it.**

StyleTwin is an AI fitting room. Upload one photo of yourself (or use your camera), pick any piece of clothing, and Gemini dresses you in it. It also keeps a smart wardrobe, plans complete outfits for any occasion and weather, and builds a personal style profile with your best colours and cuts.

![StyleTwin landing page](docs/screenshots/landing.jpg)

## Features

- **AI virtual try-on.** Your photo plus a garment photo go to Gemini 2.5 Flash Image, which returns you wearing it. A drag slider compares before and after. Save, download, or try the next piece without re-uploading yourself.
- **Smart wardrobe.** Upload up to 10 clothes at once. AI names and tags each one: category, colour (with hex), pattern, style, formality level and season. Filter by type or colour, edit any tag.
- **Outfit planner.** Pick an occasion (college, office, interview, date, party, festive) and the weather. StyleTwin checks every combination you own and ranks the best three. Each look gets a score for occasion fit, colour harmony, weather and pattern balance, with a stylist note.
- **Style profile.** Body shape and skin undertone (from your photo or your answers) give you a colour palette, colours to go easy on, cuts that flatter you and personal tips. Written to be kind and body-positive.
- **Lookbook.** Every try-on is saved. Mark favourites and compare two looks side by side.
- **Camera capture.** Take your photo straight from the webcam or phone camera.
- **Works without a key.** With no Gemini key the app runs in a labelled demo mode, so anyone can clone it and click through every screen.

## Screenshots

| Try-on studio | Wardrobe |
|---|---|
| ![Studio](docs/screenshots/studio.jpg) | ![Wardrobe](docs/screenshots/wardrobe.jpg) |

| Outfit planner | Style profile |
|---|---|
| ![Outfits](docs/screenshots/outfits.jpg) | ![Style profile](docs/screenshots/style-profile.jpg) |

| Lookbook | Mobile |
|---|---|
| ![Lookbook](docs/screenshots/lookbook.jpg) | <img src="docs/screenshots/mobile.jpg" width="260" alt="Mobile"> |

Screenshots were taken in demo mode, so try-on results show a labelled preview instead of a Gemini image.

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, React Router, lucide-react |
| Backend | Node.js, Express (ES modules), built-in `node:sqlite` |
| AI | Google Gemini (`@google/genai`): `gemini-2.5-flash` for tagging and styling, `gemini-2.5-flash-image` for try-on |
| Images | sharp (auto-rotate, resize, strip EXIF and GPS data), multer |
| Security | JWT auth, bcrypt, helmet, rate limiting (login and try-on) |

## How it works

```
Browser (React)
   │  photo + garment
   ▼
Express API ──► sharp: rotate, resize, strip location data ──► uploads/<user>/
   │
   ├─ /api/wardrobe  ► Gemini tags the garment (JSON)   ┐
   ├─ /api/tryon     ► Gemini Image edits your photo    ├─ falls back to demo mode
   ├─ /api/style     ► Gemini reads shape + undertone   ┘  if no key or the call fails
   └─ /api/style/outfits ► rule engine scores every combination
                          (formality 38%, colour harmony 32%, weather 18%, pattern 12%)
   │
SQLite (users, garments, try-ons, style profiles)
```

The outfit planner is deterministic, so it is fast and free. Colour harmony uses real colour theory (neutrals, analogous and complementary hues) on the hex value detected from each photo.

## Run it locally

You need **Node.js 22.13 or newer** (it uses Node's built-in SQLite, so there is nothing to compile and no database to install).

**1. Backend**

```bash
cd server
npm install
cp .env.example .env      # on Windows: copy .env.example .env
npm run dev               # http://localhost:5002
```

**2. Frontend** (new terminal)

```bash
cd client
npm install
npm run dev               # http://localhost:5173
```

Open http://localhost:5173, create an account and start in the Studio.

**3. Turn on real AI (optional)**

Get a free key at [Google AI Studio](https://aistudio.google.com/apikey) and put it in `server/.env`:

```
GEMINI_API_KEY=your_key_here
```

Restart the server. The "Demo AI" badge disappears and try-ons become real.

## Environment variables

| File | Variable | Default | Purpose |
|---|---|---|---|
| `server/.env` | `PORT` | `5002` | API port |
| | `CLIENT_URL` | `http://localhost:5173` | Allowed origin for CORS |
| | `JWT_SECRET` | random per run | Signs login tokens. Set one so logins survive restarts |
| | `GEMINI_API_KEY` | empty | Empty means demo mode |
| | `GEMINI_MODEL` | `gemini-2.5-flash` | Text and vision model |
| | `GEMINI_IMAGE_MODEL` | `gemini-2.5-flash-image` | Try-on image model |
| `client/.env` | `VITE_API_URL` | `http://localhost:5002` | Where the frontend finds the API |

## API

| Method | Route | What it does |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | Create account, sign in |
| GET / DELETE | `/api/auth/me` | Current user, delete account and all photos |
| GET / POST | `/api/wardrobe` | List with stats and gaps, upload up to 10 garments |
| PATCH / DELETE | `/api/wardrobe/:id` | Edit tags, remove |
| POST | `/api/tryon` | Run a try-on (new photo or reuse one, wardrobe item or new garment) |
| GET / PATCH / DELETE | `/api/tryon`, `/api/tryon/:id` | Lookbook, favourite, delete |
| GET / POST | `/api/style` | Style profile, analyse |
| POST | `/api/style/outfits` | Plan outfits for an occasion and weather |

## Privacy

Photos are stored only on your own server, resized, and stripped of EXIF and GPS data. Deleting your account deletes every photo you uploaded.

## Author

**Megha Raykar** · [GitHub](https://github.com/Megharaykar27) · [LinkedIn](https://www.linkedin.com/in/megha-raykar-335617337)
