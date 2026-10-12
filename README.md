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

## Keys
- `N` toggles night mode
- Arrow keys / Esc in playback

## Rebuilding the photo set
`manifest.txt` is the source of truth: one line per photo, `source path in ~/Desktop/pics | slug | chapter | caption | hero`.
Edit it (remove lines to cut photos, add lines to add them), then from this folder run:

    python3 tools/sequence.py && python3 tools/export.py && python3 tools/make_index.py

That re-exports `img/full` + `img/thumb` and rewrites `js/photos.js`.

## State as of Oct 11 2026
- 372 frames, 8 rolls: lil yachty, after dark, live, new york, new orleans, urbans, streets, sun
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
