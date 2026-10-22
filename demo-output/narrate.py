"""Generate narration with Edge TTS, then fit shot lengths to the actual speech."""
import concurrent.futures, json, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parent
scenes=json.loads((ROOT/'scenes.json').read_text())
def make(s):
    out=ROOT/'audio'/f'{s["id"]}.mp3'
    if not out.exists():
        subprocess.run(['uvx','--from','edge-tts','edge-tts','--voice','en-US-AndrewNeural','--rate=+3%','--file',str(ROOT/'narration'/f'{s["id"]}.txt'),'--write-media',str(out)],check=True)
    duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(out)]))
    s['audioDuration']=duration
    s['duration']=max(s['duration'],round(duration+1.0,2))
    print(s['id'],s['duration'],flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    list(pool.map(make,scenes))
(ROOT/'scenes.json').write_text(json.dumps(scenes,indent=2)+'\n')
