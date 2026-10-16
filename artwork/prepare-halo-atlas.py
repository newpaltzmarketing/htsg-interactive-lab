"""Extract approved Halo frames for a simulation-timed game sprite atlas.
No image synthesis or painted character modifications are performed.
Run with Pillow available: python artwork/prepare-halo-atlas.py
"""
from pathlib import Path
from PIL import Image
import hashlib
import json

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'artwork/originals/halo-entrance-source.webp'
IDLE = ROOT / 'artwork/originals/halo-idle-source.png'
SELECTED = list(range(0, 28, 2))
TILE = (256, 256)
ANCHOR = (112, 246)
COLUMNS, ROWS = 4, 4
RATIO = .66

animation = Image.open(SOURCE)
atlas = Image.new('RGBA', (COLUMNS*TILE[0], ROWS*TILE[1]), (0, 0, 0, 0))
records = []
for index, number in enumerate(SELECTED):
    animation.seek(number)
    frame = animation.convert('RGBA')
    box = frame.getbbox()
    alpha = frame.getchannel('A')
    band = alpha.crop((0, box[1], frame.width, min(frame.height, box[1]+100)))
    weights = [sum(band.crop((x, 0, x+1, band.height)).tobytes()) for x in range(frame.width)]
    center = sum(x*w for x, w in enumerate(weights))/sum(weights)
    resized = frame.resize((round(frame.width*RATIO), round(frame.height*RATIO)), Image.Resampling.LANCZOS)
    tile = Image.new('RGBA', TILE, (0, 0, 0, 0))
    tile.alpha_composite(resized, (round(ANCHOR[0]-center*RATIO), round(ANCHOR[1]-box[3]*RATIO)))
    atlas.alpha_composite(tile, ((index%COLUMNS)*TILE[0], (index//COLUMNS)*TILE[1]))
    records.append({'index':index,'source_frame':number,'helmet_center_x':round(center,2),'original_bounds':list(box),'atlas_bounds':list(tile.getbbox())})

atlas.save(ROOT/'public/assets/halo-runner-atlas.webp', 'WEBP', quality=95, method=6)
Image.open(IDLE).save(ROOT/'public/assets/halo-runner-idle.png', optimize=True)

def fingerprint(path):
    content=path.read_bytes()
    return {'path':str(path.relative_to(ROOT)).replace('\\','/'),'bytes':len(content),'sha256':hashlib.sha256(content).hexdigest()}

meta = {
    'source_release':'HTSG Halo Assistant return-wave-release-1.2.1, existing approved local artwork',
    'source_assets':[fingerprint(SOURCE),fingerprint(IDLE)],
    'method':'Decode selected existing transparent entrance frames; uniform Lanczos resize and helmet/boot alignment in isolated atlas tiles. No generation or painted character edits. Renderer mirrors the sprite to face approaching obstacles.',
    'recipe':'artwork/prepare-halo-atlas.py',
    'tile':list(TILE),'columns':COLUMNS,'rows':ROWS,'anchor':list(ANCHOR),'frames':records,'runtime':[]
}
for name in ['halo-runner-atlas.webp','halo-runner-idle.png']:
    path=ROOT/'public/assets'/name
    details=fingerprint(path)
    details['pixels']=list(Image.open(path).size)
    meta['runtime'].append(details)
(ROOT/'artwork/halo-runner-provenance.json').write_text(json.dumps(meta,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'atlas_bounds':[r['atlas_bounds'] for r in records],'runtime':meta['runtime']}))
