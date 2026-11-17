# lifeonnfilmm.xyz

Static site. No build step. Open `index.html` or serve the folder.

    python3 -m http.server 8000     # then http://localhost:8000

## Edit your links
`js/main.js`, top of file:

    const SOCIAL = {
      instagram: 'https://instagram.com/yourhandle',
      x:         'https://x.com/yourhandle',
      youtube:   'https://youtube.com/@yourhandle'
    };

Email: search `hello@lifeonnfilmm.xyz` in `index.html` and replace (two places).

## Edit photos / captions / chapters
`js/photos.js` is the index. Each entry has `caption`, `chapter`, and `hero` (true = rotates in the top hero).
Chapters feed the four rolls (see `ROLLS` in `js/main.js`) and the archive filter.

To add a photo: drop a 1800px JPEG in `img/full/` and a 720px one in `img/thumb/` with the same filename, then add an entry to `js/photos.js`.

## X sticker (live posts)
The X sticker on the wall shows the latest posts from @tarekmou333. `api/tweets.js` is a tiny
Vercel function that reads the public x.com profile page (no API key, no login) and returns JSON,
cached at the edge for 10 minutes. `js/tweets.json` is a saved copy the page falls back to when
the function is unreachable (plain `python3 -m http.server` has no /api, so it always uses the copy).
To change the handle: `HANDLE` at the top of `api/tweets.js`, plus the link in `js/main.js` and the
`@tarekmou333` label in `index.html`. If X ever changes its page and the feed goes blank, the sticker
still links to the profile.

## Wall tag replay
`js/tag.json` is a recorded session of spraying the wall. It replays on a loop when visitors reach the wall
(paint, buff, repeat); the moment a visitor sprays, picks a cap or buffs, the replay stops and its paint is wiped.
To record a new one: `python3 tools/record_server.py`, open http://127.0.0.1:8777/?record#wall, spray, hit
"save tag" (it writes js/tag.json), then deploy. Pauses longer than 1.5s are shortened. Delete js/tag.json to turn
the replay off.

## Background reel
`img/bg/bully.mp4`, `strike.mp4`, `symposium.mp4` play back to back behind the page (muted, darkened; list in
`js/main.js`, "background reel"). Re-encode new clips small and silent:

    ffmpeg -ss <first non-black second> -i in.mp4 -an -vf "scale='min(960,iw)':-2,fps=30" -c:v libx264 -preset slow -crf 30 -pix_fmt yuv420p -movflags +faststart img/bg/name.mp4

## Keys
- `N` toggles night mode
- Arrow keys / Esc in playback

## Rebuilding the photo set
`manifest.txt` is the source of truth: one line per photo, `source path in ~/Desktop/pics | slug | chapter | caption | hero`.
Edit it (remove lines to cut photos, add lines to add them), then from this folder run:

    python3 tools/sequence.py && python3 tools/export.py && python3 tools/make_index.py

That re-exports `img/full` + `img/thumb` and rewrites `js/photos.js`.

## State as of Oct 11 2026
- 361 frames, 8 rolls: lil yachty, after dark, live, new york, new orleans, urbans, streets, sun
- All film scans live in `~/Desktop/pics` (24 rolls)
- Still placeholder: social URLs in `js/main.js`, email in `index.html`

## Sequencing (Oct 11 2026)

`tools/sequence.py` reorders `manifest.txt` before export: heroes first, then one roll at a
time, with frames from the same source roll or the same scene spread apart so neighbours in a
strip never come from the same set when that can be avoided. Roll order lives at the top of
that script and must match `ROLLS` in js/main.js. Rolls are now: after dark, live (includes the
Lil Yachty Nike event and the Concrete Boys show), new york, new orleans, urbans, streets, sun.

## Deploy

Hosted on Vercel, project `lifeonnfilmm`, domain lifeonnfilmm.xyz (GoDaddy). From this folder:

    npx vercel deploy --prod --yes

`vercel.json` sets long cache headers on /img. `.vercelignore` keeps tools and the manifest out
of the upload.

## Sharing

Every frame has a link: `https://lifeonnfilmm.xyz/#f/<slug>` (the SHARE button in playback copies
it, or opens the native share sheet on phones). Opening that link loads the site with the frame in
playback. Links use the slug, not the archive number, so they survive re-cuts.

## Phones (720px and narrower)

Same tape and OSD, different interface (desktop is untouched):
- **MENU** (top right) opens a camcorder settings screen: rolls / wall / archive / contact / night mode. Replaces the nav strip.
- **The rolls ride a ferris wheel made of film.** One screen per roll: 12 frames hang off a sprocketed rim and stay
  upright, the one at the top fills the gate. Swipe sideways to spin (it coasts and settles), tap a frame to bring it
  up, tap the gate to play the roll, swipe the roll names to switch. Code: "rolls on phones: the reel wheel" in js/main.js.
- **Archive** is a 4-column contact sheet showing 40 frames; `FF` reveals the rest (`SHEET_CUT` in js/main.js).
- **Saving photos:** `img/save/` holds 3000px copies (quality 88, ~1.3MB each) made from the scans in ~/Desktop/pics.
  `SAVE` in playback fetches that copy and opens the share sheet ("Save Image" = camera roll); desktop downloads it.
  Holding a photo works too: once a visitor stays on a frame in playback or the wheel's gate for ~1s, the 3000px copy
  swaps in quietly, so the hold menu saves it. Flicking through never loads it, data saver never does, and the site
  falls back to the 1600px file if a save copy is missing. Thumbnails block the hold menu.
  `img/save` is not in git (too big); it's rebuilt by `python3 tools/export.py --save-only` and uploaded by
  `npx vercel deploy`. If you rebuild the photo set, the full export makes it too.
- Swipe the hero sideways to change frames; swipe down in playback to close.
