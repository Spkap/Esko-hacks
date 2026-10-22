"""Check the delivered media without presenting unrun checks as successes."""
import json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parent
film=ROOT/'Wavelength-Hackathon-Demo.mp4'
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(film)]))
video=next(s for s in probe['streams'] if s['codec_type']=='video')
audio=next(s for s in probe['streams'] if s['codec_type']=='audio')
assert (video['width'],video['height'])==(1920,1080)
assert video['codec_name']=='h264' and video['pix_fmt']=='yuv420p'
assert audio['codec_name']=='aac'
assert any(s['codec_type']=='subtitle' for s in probe['streams'])
decode=subprocess.run(['ffmpeg','-v','error','-i',str(film),'-f','null','-'],capture_output=True,text=True,check=True)
assert not decode.stderr.strip(),decode.stderr
black=subprocess.run(['ffmpeg','-hide_banner','-i',str(film),'-vf','blackdetect=d=0.15:pix_th=0.10','-an','-f','null','-'],capture_output=True,text=True,check=True)
black_events=[line for line in black.stderr.splitlines() if 'black_start:' in line]
assert not black_events,black_events
level=subprocess.run(['ffmpeg','-hide_banner','-i',str(film),'-af','volumedetect','-vn','-sn','-f','null','-'],capture_output=True,text=True,check=True)
levels=[line for line in level.stderr.splitlines() if 'mean_volume:' in line or 'max_volume:' in line]
captures=json.loads((ROOT/'capture-log.json').read_text())
assert not captures['errors'],captures['errors']
result=dict(width=video['width'],height=video['height'],fps=video['avg_frame_rate'],durationSeconds=float(probe['format']['duration']),sizeBytes=int(probe['format']['size']),videoCodec=video['codec_name'],audioCodec=audio['codec_name'],audioChannels=audio['channels'],subtitleTrack=True,fullDecode='passed',blackFrameEvents=black_events,capturedPageErrors=captures['errors'],audioLevels=levels,visualReview='See PROGRESS.md for frames actually inspected; no claim of continuous human playback.')
(ROOT/'verification.json').write_text(json.dumps(result,indent=2)+'\n')
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(film),'-vf','fps=1/12,scale=480:270,tile=4x3','-frames:v','1',str(ROOT/'contact-sheet.jpg')],check=True)
print(json.dumps(result,indent=2))
