# Migrate From TTS

Given a workshop ID, full workshop URL, or location of a `.bin` file, use `extract_tts.py` to parse a TTS save into structured JSON and optionally download referenced assets.

Checked-in private example extracts live at the repo root as `Nemesis-Retaliation/` and `WorkshopUpload/`. Keep those folders out of the private Dreamboard skill source, because the public CLI repo mirrors that skill into `/skills/dreamboard`.

## Prereqs

- Python 3
- `steamcmd` (only needed when passing a Workshop ID instead of a local `.bin` file)

Verify `steamcmd`:

```sh
steamcmd +quit
```

### macOS

```sh
brew install --cask steamcmd
```

### Windows

1. Download `steamcmd.zip` from Valve: `https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip`
2. Extract to a permanent folder, e.g. `C:\steamcmd\`
3. Add that folder to your `PATH`
4. Run once so it self-updates:

```cmd
steamcmd +quit
```

## Basic Usage

```sh
python3 extract_tts.py <workshop_id> [output_dir]
python3 extract_tts.py <workshop_url> [output_dir]
python3 extract_tts.py <save.bin> [output_dir]
```

Workshop ID is the numeric `id` from the Steam Workshop URL, e.g.
`https://steamcommunity.com/sharedfiles/filedetails/?id=3385562324` -> `3385562324`.

## Download Referenced Assets

Use `--download` to fetch assets referenced in `asset_urls.json` and write `asset_files.json` with local relative paths.

```sh
python3 extract_tts.py <workshop_id|workshop_url|save.bin> [output_dir] --download
```

Optional tuning:

```sh
python3 extract_tts.py <workshop_id|workshop_url|save.bin> [output_dir] --download --download-workers 8 --download-rps 2.5
```

- `--download-workers`: max concurrent workers (default `6`, capped internally)
- `--download-rps`: global request rate limit across workers (default `3.0` req/s)

Downloaded files are stored under `assets/` with inferred subfolders such as `assets/pdf/`, `assets/deck/`, `assets/image/`, and `assets/mesh/`.

## Recommended Flow Into Dreamboard

```sh
python3 extract_tts.py <workshop_id> [output_dir] --download
dreamboard new <slug> ...
mv [output_dir] <slug>/assets
```

## Output Files

| File                 | Contents                                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| `metadata.json`      | Save name, date, version, tags, table/sky URLs, play time, player counts                        |
| `asset_urls.json`    | Asset URLs grouped by TTS object nickname/type, with deck/card/PDF metadata                     |
| `asset_urls.txt`     | Flat list of every unique URL                                                                   |
| `asset_files.json`   | Same shape as `asset_urls.json`, but with local relative file paths (when `--download` is used) |
| `objects.json`       | Per-object summary (GUID, name, custom deck/image/PDF info, contained objects)                  |
| `scripts/`           | Each unique Lua script and XML UI saved as individual files                                     |
| `scripts_index.json` | Maps each scripted object (GUID/path) to its script file                                        |
| `full_save.json`     | Full parsed save tree with large script bodies replaced by placeholders                         |
| `tab_states.json`    | Player-colour tab contents (if present)                                                         |
| `snap_points.json`   | Table snap point positions (if present)                                                         |

## How To Use The Extracted Data

- Use `CustomPDF` / `PDFUrl` entries in `asset_urls.json` (or local files in `asset_files.json`) as source material for `rule.md`.
- Use `TableURL` and `SkyURL` as references for UI tone and color direction.
- Use `FaceURL` plus card grid metadata (`numWidth`, `numHeight`, `row`, `column`) to reconstruct decks/cards in `manifest.json`.
- Use card metadata (`nickname`, `count`, `description`, `gmNotes`) to seed content and balancing decisions.
