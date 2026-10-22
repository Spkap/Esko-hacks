# Wavelength hackathon film

`Wavelength-Hackathon-Demo.mp4` is the finished 1920 × 1080 film: actual visible Chrome recordings, chapter graphics, burned-in captions, a selectable English subtitle track, synthetic Andrew narration, and an original quiet ambient bed.

The story follows the working prototype: landing → dashboard search → prepared sample setup → simulated check → evidence → uncertainty → reviewer decision → corrected artwork → scoped report → organizer material. The app's sample/live boundaries remain visible and are spoken in the narration. No live AI, OCR, certification, or legal approval is claimed.

## Skills selected

- Installed `alireza-demo-video`: narrative, scene focus, pacing, audio and delivery checks. Read from `/Users/sourabhkapure/.agents/skills/alireza-demo-video/SKILL.md`.
- Installed `playwright-skill`: visible browser rehearsal and real app capture. The project's existing Playwright package is reused because the skill folder itself has no installed Playwright module.
- Explicitly requested `search-skill`: scoped skill discovery. The official [Anthropic webapp-testing skill](https://github.com/anthropics/skills/blob/main/skills/webapp-testing/SKILL.md) and [Remotion's skill collection](https://www.skills.sh/remotion-dev/skills) were relevant findings. No external skill package was installed; the existing capture and FFmpeg toolchain was sufficient.
- Kev was available without starting a GPU. Story choice probabilities: focused walkthrough 0.9626; exhaustive walkthrough 0.0225; synthetic-only film 0.0148. These are decision-model probabilities, not measured quality. Product evidence and human-reviewable footage determine the final edit.

## Editable sources and rebuild

Run the production app on `http://127.0.0.1:3000`, then `sh demo-output/build.sh` from the repository root. Dependencies: Chrome, the project's installed Playwright, its small FFmpeg capture component (`pnpm -C frontend exec playwright install ffmpeg`), FFmpeg/ffprobe, Python 3, uv, and internet for Edge TTS.

- `plan.py` / `scenes.json`: narrative, timings, and captions.
- `narration/`: plain-text voice script per chapter.
- `capture.cjs`: actual app interactions and browser recordings.
- `graphics.cjs` / `scenes/`: editable branded HTML cards and overlays.
- `render.py`: rendering, original soundtrack, subtitles, final mux.
- `capture-log.json`: actual source clips, trim points, and captured page errors.
- `verification.json`: measured output properties and verification results.

Generated video/audio, raw footage, frame images, and verification outputs are retained locally and excluded from Git. Capture runs use fresh isolated browser contexts and do not change app code or the user's existing browser sessions. The end card links to the local demo; no public deployment is claimed.
