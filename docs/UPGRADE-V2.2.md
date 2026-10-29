# VEXA Chat v2.2 — Police / Support / Policies + Staff Panel

## Kya naya hai (is upgrade me)

### Main site (4 naye pages)
| Page | Route | Features |
|------|-------|----------|
| 👮 Police | `V.go('police')` | Community Rules (10 rules) · Enforcement ladder · **Report flow** (`reports` node) |
| 🆘 Support | `V.go('support')` | Account Recovery (Recovery Center link + TXT) · Email Support (`config/support` se) · In-app ticket (`supportTickets`) · **Admin/Mod direct chat** (`staffIndex` + presence → online-first) |
| 🔒 Privacy Policy | `V.go('privacy')` | Full policy — in-app page + modal (signup se bhi) |
| 📜 Terms of Service | `V.go('terms')` | Full terms — in-app page + modal (signup se bhi) |

- Signup ka "Terms & Conditions and Privacy Policy" ab **clickable** hai (login ke bina modal me khulta hai)
- Home tiles me Police + Support · QFab menu me bhi · Settings me links
- **"My VEXA ID" row Settings se HATA di** — sirf "My UID" hai (user request)

### Staff Panel — `/staff/` (ALAG folder, main files se attach NAHI)
- `staff/index.html` + `staff/staff.css` + `staff/staff.js` — standalone, apna CSS/JS
- Login: Firebase Auth + **role guard** (sirf owner/admin/moderator; non-staff auto signout)
- Tabs: Dashboard (8 stats) · Users (search username/UID/VEXA ID + ban/verify/VIP/role) · Reports (status update) · Tickets (reply + status) · Recovery (owner: approve/reject) · Tools (Version control, Support email config, **VEXA ID bulk migration** via vexaBackend, Supabase bucket probe, Staff directory)
- Layout: mobile-first, wrap-safe tabs — layout issue fixed
- Deploy: poora `staff/` folder repo me push karo → `https://animetubepro.github.io/vexa-chat/staff/` (ya alag repo me — code self-contained hai)

## Naye DB nodes (additive — safe)
| Node | Kaun likhta hai | Rule |
|------|-----------------|------|
| `staffIndex/{uid}` | staff khud (login pe auto-sync) | write: self + role staff |
| `supportTickets/{tid}` | user (create) / staff (reply+status) | read: owner + ticket-owner |
| `config/support` | staff panel | write: staff |
| `reports` (read) | pehle false tha | ab staff read (Police reports dekhne ke liye) |
| `recoveryRequests` (root read) | — | ab owner root-read (staff panel list) |
| `users/{uid}/tickets/{tid}` | user (apna index) | existing users rules cover karte hain |

## Deploy order
1. **Backup** — RTDB Export JSON + Rules text copy (MIGRATION.md Phase 0)
2. Firebase Console → Rules → `backend/database.rules.json` (comments hata ke) → Publish
3. Main site push: `index.html`, `script.js`, `style.css`, `vexa-upgrade.js`
4. Staff panel push: `staff/` folder (3 files)
5. Staff panel me login karke: Tools → Support Email set karo · Version save karo
6. Har staff (owner/admin/mod) **main app me ek baar login kare** — `staffIndex` entry auto ban jayegi (Support page ka staff list isi se dikhta hai)

## Testing checklist
- [ ] Home tiles: Police/Support khul rahe hain
- [ ] Police → Report submit → Firebase `reports` node me dikha
- [ ] Support → Staff list dikhi (staff ne login kiya ho to) → chat khuli
- [ ] Support → Ticket banao → staff panel ke Tickets tab me dikha → reply aaya → app me "Mere Tickets" me reply dikha
- [ ] Support → Email (agar set kiya) → mailto khula
- [ ] Signup screen → "Terms & Conditions" / "Privacy Policy" click → modal khula
- [ ] Settings → "My VEXA ID" NAHI hai, "My UID" hai
- [ ] Staff panel: non-staff login blocked · staff login → dashboard stats
- [ ] Staff panel → Users → search + ban/verify/VIP kaam kar rahe
- [ ] Owner → Tools → Migration batch → migrated count

## Rollback
- Frontend: 4 main files + `staff/` folder pehle wale version pe wapas
- Rules: pehle wale rules paste kar do (backup se)
- Naye nodes (`staffIndex`, `supportTickets`, `config/support`) delete kar sakte ho — purana app inhe ignore karta hai
