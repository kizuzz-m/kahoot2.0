# Quizwerk online stellen (Supabase + Vercel)

Online läuft Quizwerk ohne eigenen Server: **Supabase** speichert die Quizze und überträgt das Live-Spiel,
**Vercel** hostet die Webseite. Beides ist im Gratis-Tarif nutzbar. Dauer: ca. 15 Minuten.

## 1. Supabase einrichten

1. Auf <https://supabase.com> ein Konto und ein neues Projekt anlegen (Region z. B. *Central EU (Frankfurt)*).
2. Links **SQL Editor** → *New query* → den kompletten Inhalt von [`supabase/schema.sql`](supabase/schema.sql)
   einfügen → **Run**.
3. **Project Settings → API** öffnen und diese drei Werte notieren:
   - *Project URL* → `NEXT_PUBLIC_SUPABASE_URL`
   - *anon public* Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
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

## 4. Prüfen

- `https://<deine-domain>/api/health` muss `"storage":"supabase","realtime":"supabase"` zeigen.
- Startseite → „Beispielquiz anlegen“ → „Live spielen“ → QR-Code mit dem Handy scannen (mobiles Netz genügt).

Jeder weitere `git push` auf `main` aktualisiert die Webseite automatisch.

## Wichtig: Zugriffsschutz

Quizwerk hat **keine Anmeldung**. Wer die Adresse kennt, kann Quizze anlegen, bearbeiten und löschen. Für den
privaten Einsatz die Adresse nur gezielt weitergeben oder in Vercel unter **Settings → Deployment Protection**
den Zugriff einschränken (Achtung: Spieler müssen die Seite dann ebenfalls öffnen können).
