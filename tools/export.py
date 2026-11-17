# img/full (1600px, what the site shows), img/thumb (720px), img/save (3000px, what visitors save to their camera roll)
# python3 tools/export.py --save-only  re-exports just img/save
import os, sys, json
from multiprocessing import Pool
from PIL import Image, ImageOps
Image.MAX_IMAGE_PIXELS=None
SRC=os.path.expanduser('~/Desktop/pics')
OUT=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'img')
SAVE_EDGE, SAVE_Q = 3000, 88

def lines():
    return [l for l in open(os.path.join(os.path.dirname(OUT),'manifest.txt')) if l.strip() and not l.startswith('#')]

def save_copy(job):
    i,l=job
    src,slug=[x.strip() for x in l.split('|')][:2]
    im=ImageOps.exif_transpose(Image.open(os.path.join(SRC,src))).convert('RGB')
    im.thumbnail((SAVE_EDGE,SAVE_EDGE)); im.save(f"{OUT}/save/{i+1:02d}-{slug}.jpg",quality=SAVE_Q,optimize=True,progressive=True)
    return im.size

def main():
    for d in ('full','thumb','save'): os.makedirs(f'{OUT}/{d}',exist_ok=True)
    L=lines()
    with Pool(4) as pool:
        saving=pool.map_async(save_copy, list(enumerate(L)))  # big copies export alongside
        if '--save-only' in sys.argv:
            print(len(saving.get()),'saved'); return
        items=[]
        for i,l in enumerate(L):
            src,slug,chap,cap,hero=[x.strip() for x in l.split('|')]
            im=ImageOps.exif_transpose(Image.open(os.path.join(SRC,src))).convert('RGB')
            name=f"{i+1:02d}-{slug}.jpg"
            f=im.copy(); f.thumbnail((1600,1600)); f.save(f"{OUT}/full/{name}",quality=80,optimize=True,progressive=True)
            t=im.copy(); t.thumbnail((720,720)); t.save(f"{OUT}/thumb/{name}",quality=78,optimize=True)
            items.append(dict(id=i+1,src=name,slug=slug,chapter=chap,caption=cap,hero=hero=='1',w=f.width,h=f.height))
            print(name, f.width, f.height)
        saving.get()
    json.dump(items,open(os.path.join(os.path.dirname(OUT),'js','photos.json.tmp'),'w'),indent=1)
    print(len(items))

if __name__ == '__main__':  # required on macOS: worker processes re-import this file
    main()
