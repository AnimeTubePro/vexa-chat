-- ═══════════════════════════════════════════════════════════════════════════
-- VEXA CHAT — Supabase Storage Policies (v2.1 upgrade)
-- 3 ALAG Supabase PROJECTS हैं — नीचे के तीनों sections अपने-अपने project के
-- SQL Editor में अलग-अलग चलाओ (एक ही editor में नहीं):
--   [1] ygbkjnwuvjcgdzbqwgwv.supabase.co → bucket vexa-media    (avatars)
--   [2] qrrcyvtvwjzhsdklxluh.supabase.co → bucket vexa-posts    (post images)
--   [3] kjsfenhmlhgdlhqipqts.supabase.co → bucket vexa-chat-guild (guild media)
--
-- ⚠️ PATTERN: app anon/publishable key से upload करता है (Supabase user login
--    नहीं है)। इसलिए policies "anon" role को app-path prefixes तक limit करती हैं।
-- ⚠️ BUCKET NAME VERIFY (spec): Supabase-3 dashboard → Storage में bucket का
--    exact नाम 'vexa-chat-guild' होना चाहिए। अलग हो तो script.js के
--    VEXA_STORAGE.guilds.bucket में वही नाम डालो।
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────── [1] SUPABASE PROJECT 1 — vexa-media (avatars) ───────────────
-- पहले पुरानी policies देखो: Storage → Policies. नीचे के statements duplicate
-- policy error दें तो मौजूदा policies ही सही रखो — sirf missing ones add karo.

-- Buckets exist? नहीं तो बनाओ (public = avatar/post URLs browser से readable)
insert into storage.buckets (id, name, public)
values ('vexa-media', 'vexa-media', true)
on conflict (id) do update set public = true;

-- Public read
create policy "vexa_media_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'vexa-media');

-- Upload sirf app prefixes me: profile/, posts/, chats/
create policy "vexa_media_anon_insert_app_paths"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id = 'vexa-media'
  and (
    (storage.foldername(name))[1] = 'profile'
    or (storage.foldername(name))[1] = 'posts'
    or (storage.foldername(name))[1] = 'chats'
  )
);

-- Upsert (avatar replace)
create policy "vexa_media_anon_update_app_paths"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'vexa-media' and (storage.foldername(name))[1] in ('profile','posts','chats'));

-- Cleanup (account delete) — upload करने वाला ही remove कर सके
create policy "vexa_media_anon_delete_app_paths"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'vexa-media' and (storage.foldername(name))[1] in ('profile','posts','chats'));

-- ─────────────── [2] SUPABASE PROJECT 2 — vexa-posts (post images) ───────────────
insert into storage.buckets (id, name, public)
values ('vexa-posts', 'vexa-posts', true)
on conflict (id) do update set public = true;

create policy "vexa_posts_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'vexa-posts');

create policy "vexa_posts_anon_insert"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'vexa-posts' and (storage.foldername(name))[1] = 'posts');

create policy "vexa_posts_anon_update"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'vexa-posts' and (storage.foldername(name))[1] = 'posts');

create policy "vexa_posts_anon_delete"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'vexa-posts' and (storage.foldername(name))[1] = 'posts');

-- ─────────────── [3] SUPABASE PROJECT 3 — vexa-chat-guild (guild/group media) ───────────────
-- ⚠️ पहले DASHBOARD में bucket name VERIFY करो!
insert into storage.buckets (id, name, public)
values ('vexa-chat-guild', 'vexa-chat-guild', true)
on conflict (id) do update set public = true;

create policy "vexa_guild_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'vexa-chat-guild');

create policy "vexa_guild_anon_insert"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'vexa-chat-guild' and (storage.foldername(name))[1] = 'guilds');

create policy "vexa_guild_anon_update"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'vexa-chat-guild' and (storage.foldername(name))[1] = 'guilds');

create policy "vexa_guild_anon_delete"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'vexa-chat-guild' and (storage.foldername(name))[1] = 'guilds');

-- ═══════════════════════════ NOTES (सभी 3 projects) ═══════════════════════════
-- 1. अगर "policy already exists" आए: drop policy "<name>" on storage.objects; फिर दोबारा।
-- 2. Strict security चाहिए (delete केवल backend): delete policies हटा दो और
--    cleanup Cloud Function से service-key use करो (SUPABASE_SECRET_KEY_* env var)।
-- 3. 200KB limit client-side enforce होती है (vexa-upgrade.js VexaStorage.validate) —
--    server-side limit के लिए Edge Function wrapper चाहिए (v2.2 roadmap)।
