# Quizwerk online stellen (Supabase + Vercel)

Online läuft Quizwerk ohne eigenen Server: **Supabase** speichert die Quizze und überträgt das Live-Spiel,
**Vercel** hostet die Webseite. Beides ist im Gratis-Tarif nutzbar. Dauer: ca. 15 Minuten.

## 1. Supabase einrichten

1. Auf <https://supabase.com> ein Konto und ein neues Projekt anlegen (Region z. B. *Central EU (Frankfurt)*).
2. Links **SQL Editor** → *New query* → den kompletten Inhalt von [`supabase/schema.sql`](supabase/schema.sql)
   einfügen → **Run**.
3. **Project Settings → API** öffnen und diese drei Werte notieren:
   - *Project URL* → `SUPABASE_URL`
   - *anon public* Key → `SUPABASE_ANON_KEY`
   - *service_role* Key → `SUPABASE_SERVICE_ROLE_KEY` (geheim, nie weitergeben)
4. Unter **Realtime → Settings** darf „Nur private Kanäle erlauben“ **nicht** aktiviert sein.

## 2. Code zu GitHub hochladen

1. Auf <https://github.com/new> ein neues (gerne privates) Repository `quizwerk` anlegen, **ohne** README.
2. In diesem Ordner im Terminal:

   ```bash
   git remote add origin https://github.com/<DEIN-NAME>/quizwerk.git
   git push -u origin main
   ```

## 3. Auf Vercel deployen

1. Auf <https://vercel.com> mit dem GitHub-Konto anmelden → **Add New… → Project** → Repository `quizwerk`
   importieren. Framework *Next.js* wird automatisch erkannt.
2. Unter **Environment Variables** die drei Supabase-Werte aus Schritt 1 eintragen.
3. **Deploy** klicken. Nach ca. 1 Minute ist die Seite unter `https://quizwerk-xxxx.vercel.app` erreichbar.

### Alternative: Cloudflare Workers statt Vercel

Das Projekt ist mit `wrangler.jsonc` und `open-next.config.ts` bereits für Cloudflare vorbereitet.

1. Auf <https://dash.cloudflare.com> → **Workers & Pages** → **Create** → **Import a repository** →
   GitHub verbinden und das Repository wählen.
2. Projektname: z. B. `quiz` (kurz halten – ergibt `quiz.<subdomain>.workers.dev`; muss mit `name` in `wrangler.jsonc` übereinstimmen).
3. **Build command:** `npx opennextjs-cloudflare build` · **Deploy command:** `npx opennextjs-cloudflare deploy`
4. **Deploy** klicken. Build-Variablen sind nicht nötig – es wird nichts in den Build eingebaut.
5. Danach im Worker unter **Settings → Variables and Secrets** als Typ *Secret* hinzufügen:
   `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` und `ADMIN_PASSWORD`.
   Optional `PUBLIC_BASE_URL` (Text, z. B. eigene Domain für die QR-Codes).
   Die Werte werden zur Laufzeit gelesen, ein neuer Build ist nach einer Änderung nicht nötig.

   Alternativ per CLI: `npx wrangler secret put SUPABASE_URL` usw., oder alle auf einmal beim Deploy mit
   `npx wrangler deploy --secrets-file .dev.vars`.

   **Wichtig:** Keine echten Werte in `.env`/`.env.local` ablegen, wenn für Cloudflare gebaut wird –
   `opennextjs-cloudflare build` übernimmt diese Dateien in das Worker-Bundle.

Lokal testen wie bei Cloudflare: `npm run cf:preview`.

## 4. Prüfen

- `https://<deine-domain>/api/health` muss `"storage":"supabase","realtime":"supabase"` zeigen.
- `/admin` öffnen → anmelden → „Beispielquiz anlegen“ → „Hosten“ → QR-Code mit dem Handy scannen (mobiles Netz genügt).

Jeder weitere `git push` auf `main` aktualisiert die Webseite automatisch.

## Wichtig: Zugriffsschutz

Die Startseite `/` dient nur zum Beitreten. Erstellen, Bearbeiten und Hosten liegen unter `/admin` und sind mit
`ADMIN_PASSWORD` geschützt. Ohne diese Variable ist `/admin` für alle offen – online also immer setzen
(bei Vercel unter *Environment Variables*, bei Cloudflare als *Secret*).
