-- ═══════════════════════════════════════════════════════════════════════════
-- VEXA CHAT — Supabase Storage Policies (v2.1 upgrade)
-- 3 ALAG Supabase PROJECTS हैं — नीचे के तीनों sections अपने-अपने project के
-- SQL Editor में अलग-अलग चलाओ (एक ही editor में नहीं):
--   [1] ygbkjnwuvjcgdzbqwgwv.supabase.co → bucket vexa-media    (avatars)
--   [2] qrrcyvtvwjzhsdklxluh.supabase.co → bucket vexa-posts    (post images)
--   [3] kjsfenhmlhgdlhqipqts.supabase.co → bucket vexa-chat-guild (guild media + 🎬 REELS videos)
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

-- ─────────────── [3] SUPABASE PROJECT 3 — vexa-chat-guild (guild/group media + 🎬 REELS) ───────────────
-- ⚠️ पहले DASHBOARD में bucket name VERIFY करो!
-- ⚠️ v2.8.2-R3 REELS FIX: bucket ki Allowed MIME types में video/mp4 (+ video/webm)
--    होना चाहिए — वरना app में "mime type video/mp4 is not supported" error आएगा.
--    Dashboard: Storage → vexa-chat-guild → Settings → Allowed MIME types:
--    video/mp4, video/webm  (या field KHALI छोड़ो = सब types allowed)
--    नीचे का SQL चलाने से भी हो जाएगा (allowed_mime_types NULL = सब allowed,
--    file_size_limit 3MB = reels की 2.8MB limit के साथ):
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vexa-chat-guild', 'vexa-chat-guild', true, 3145728, null)
on conflict (id) do update set public = true, file_size_limit = 3145728, allowed_mime_types = null;

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

-- ═══════════════════════════════════════════════════════════════════════════
-- 🚨 QUICK FIX — "Storage policy ne block kiya" ERROR के लिए (PROJECT 3)
-- App me ye error aa raha hai? → Supabase-3 (kjsfenhmlhgdlhqipqts) SQL Editor
-- me SIRF ye block chalao — pehle purani policies drop, phir fresh banao.
-- Ye block: bucket bhi banata/pakka karta hai + सारी policies fresh set karta hai.
-- ═══════════════════════════════════════════════════════════════════════════
drop policy if exists "vexa_guild_public_read"   on storage.objects;
drop policy if exists "vexa_guild_anon_insert"   on storage.objects;
drop policy if exists "vexa_guild_anon_update"   on storage.objects;
drop policy if exists "vexa_guild_anon_delete"   on storage.objects;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vexa-chat-guild', 'vexa-chat-guild', true, 3145728, null)
on conflict (id) do update set public = true, file_size_limit = 3145728, allowed_mime_types = null;

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
-- ✅ Bas — ab app me reel upload try karo (Settings → 📊 Storage Check se verify)

-- 🚨 QUICK FIX — PROJECT 2 (vexa-posts) ke liye same pattern:
-- drop policy if exists "vexa_posts_public_read" on storage.objects;
-- drop policy if exists "vexa_posts_anon_insert" on storage.objects;
-- drop policy if exists "vexa_posts_anon_update" on storage.objects;
-- drop policy if exists "vexa_posts_anon_delete" on storage.objects;
-- (phir upar section [2] ke create policy statements RUN karo)
