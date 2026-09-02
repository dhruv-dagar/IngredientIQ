# IngredientIQ server

## 1. Add your MongoDB connection string

Open `server/.env` and set `MONGODB_URI`. Do not commit or share this file.

## 2. Install packages

Run this inside `server`:

```powershell
npm install
```

## 3. Prepare cards for import

Create `data/processed/game_products.csv` from the reviewed candidate file. Only rows marked like this will be imported:

```text
game_ready=true
review_status=approved
```

## 4. Seed MongoDB

Run this inside `server`:

```powershell
npm run seed:foods
```

## 5. Start the API

```powershell
npm run dev
```

Then check `http://localhost:5000/api/health`.

## Game endpoints

- `POST /api/game/sessions` creates an anonymous session.
- `GET /api/game/questions?sessionId=...` returns a random approved food card without its NOVA answer.
- `POST /api/game/answers` verifies a guess and logs the result.
