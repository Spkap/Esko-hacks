"""Compose real browser captures, graphic overlays, narration, and original music."""
import json, subprocess, math, wave, array, textwrap
from pathlib import Path
ROOT=Path(__file__).resolve().parent
scenes=json.loads((ROOT/'scenes.json').read_text())
shots={s['id']:s for s in json.loads((ROOT/'capture-log.json').read_text())['shots']}
def run(cmd): subprocess.run(cmd,check=True,stdout=subprocess.DEVNULL)
def stamp(t):
    ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
subtitles=[];cursor=0;count=0
for s in scenes:
    sid=s['id'];duration=s['duration'];out=ROOT/'renders'/f'{sid}.mp4'
    args=['ffmpeg','-hide_banner','-loglevel','error','-y']
    if sid in shots:
        shot=shots[sid];args+=['-ss',str(shot['start']),'-t',str(duration),'-i',str(ROOT/shot['file'])]
        base='[0:v]scale=1728:864:flags=lanczos,pad=1920:1080:96:106:color=0x080d15,setsar=1,fps=30[b0]'
    else:
        args+=['-loop','1','-framerate','30','-i',str(ROOT/'frames'/f'{sid}-card.png')]
        base="[0:v]scale=1920:1080,setsar=1,zoompan=z='1+0.018*(1-cos(PI*on/"+str(round(duration*30))+"))/2':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=1920x1080:fps=30[b0]"
    args+=['-i',str(ROOT/'audio'/f'{sid}.mp3')]
    chunks=s['captions'];weights=[len(c.split()) for c in chunks];total=sum(weights);start=.22
    filters=[base]
    for j,caption in enumerate(chunks):
        end=.22+s['audioDuration']*sum(weights[:j+1])/total
        if j==len(chunks)-1:end=duration
        args+=['-i',str(ROOT/'frames'/f'{sid}-overlay-{j}.png')]
        filters.append(f"[b{j}][{j+2}:v]overlay=0:0:enable='gte(t,{0 if j==0 else start})*lt(t,{end})'[b{j+1}]")
        count+=1
        subtitles.append(f'{count}\n{stamp(cursor+start)} --> {stamp(cursor+min(end,duration-.1))}\n'+textwrap.fill(caption,80)+'\n')
        start=end
    filters.append('[1:a]adelay=220|220,apad,aresample=48000[a]')
    args+=['-filter_complex',';'.join(filters),'-map',f'[b{len(chunks)}]','-map','[a]','-t',str(duration),'-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-ar','48000','-r','30','-movflags','+faststart',str(out)]
    print('RENDER',sid,flush=True);run(args);cursor+=duration
(ROOT/'wavelength-demo.srt').write_text('\n'.join(subtitles))
(ROOT/'renders'/'concat.txt').write_text('\n'.join("file '"+str(ROOT/'renders'/f'{s["id"]}.mp4')+"'" for s in scenes))
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(ROOT/'renders'/'concat.txt'),'-c','copy',str(ROOT/'renders'/'assembled.mp4')])
# Original, quiet four-chord ambient bed. No third-party music or licensing dependency.
rate=24000;buf=array.array('h');chords=[(130.81,164.81,196),(110,130.81,164.81),(87.31,130.81,174.61),(98,146.83,196)]
for n in range(math.ceil((cursor+1)*rate)):
    t=n/rate;phase=t%8;env=min(1,phase/1.8)*min(1,(8-phase)/2.0)*min(1,t/3)*min(1,max(0,(cursor-t)/4))
    notes=chords[int(t/8)%4]
    sound=sum(math.sin(2*math.pi*f*t)+.18*math.sin(2*math.pi*f*2*t) for f in notes)/3
    buf.append(int(32767*.027*env*sound))
with wave.open(str(ROOT/'audio'/'original-ambient.wav'),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(buf.tobytes())
print('MASTER',round(cursor,2),'seconds',flush=True)
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(ROOT/'renders'/'assembled.mp4'),'-i',str(ROOT/'audio'/'original-ambient.wav'),'-i',str(ROOT/'wavelength-demo.srt'),'-filter_complex','[0:a]loudnorm=I=-16:TP=-1.5:LRA=8[voice];[1:a]volume=0.42[music];[voice][music]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]','-map','0:v','-map','[a]','-map','2:s','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-c:s','mov_text','-metadata','title=Wavelength — Clarity before the shelf','-metadata','comment=Real browser capture of the seeded hackathon prototype. Simulated findings; no live AI analysis. Narration: synthetic voice. Original generated ambient soundtrack.','-metadata:s:s:0','language=eng','-movflags','+faststart',str(ROOT/'Wavelength-Hackathon-Demo.mp4')])
print('DONE',flush=True)
