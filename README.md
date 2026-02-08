# NoorTilesWebsite

NoorTiles is a colorful, fast-paced Piano Tiles game featuring nasheed-themed levels. Earn 3 stars per level to unlock the next stage. Progress saves locally and syncs with Supabase when configured.

## Tech Stack
- Next.js (App Router)
- Supabase (database)
- Tailwind CSS

## Local Development
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

## Supabase Setup
Create a Supabase project and add a `progress` table.

```sql
create table if not exists progress (
  user_id text not null,
  level int not null,
  best_stars int not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, level)
);

alter table progress enable row level security;

create policy "Allow anon read"
  on progress for select
  to anon
  using (true);

create policy "Allow anon upsert"
  on progress for insert
  to anon
  with check (true);

create policy "Allow anon update"
  on progress for update
  to anon
  using (true);
```

Create `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Restart the dev server after adding env vars.

## Custom Nasheeds
Add your own audio in `public/nasheeds` and map the tracks inside `src/app/page.tsx`.
