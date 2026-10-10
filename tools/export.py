import os, json
from PIL import Image, ImageOps
SRC=os.path.expanduser('~/Desktop/pics')
OUT=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'img')
os.makedirs(OUT+'/full',exist_ok=True); os.makedirs(OUT+'/thumb',exist_ok=True)
items=[]
for i,l in enumerate([l for l in open(os.path.join(os.path.dirname(OUT),'manifest.txt')) if l.strip() and not l.startswith('#')]):
    src,slug,chap,cap,hero=[x.strip() for x in l.split('|')]
    im=ImageOps.exif_transpose(Image.open(os.path.join(SRC,src))).convert('RGB')
    w,h=im.size
    name=f"{i+1:02d}-{slug}.jpg"
    f=im.copy(); f.thumbnail((1600,1600)); f.save(f"{OUT}/full/{name}",quality=80,optimize=True,progressive=True)
    t=im.copy(); t.thumbnail((720,720)); t.save(f"{OUT}/thumb/{name}",quality=78,optimize=True)
    items.append(dict(id=i+1,src=name,slug=slug,chapter=chap,caption=cap,hero=hero=='1',w=f.width,h=f.height))
    print(name, f.width, f.height)
json.dump(items,open(os.path.join(os.path.dirname(OUT),'js','photos.json.tmp'),'w'),indent=1)
print(len(items))
