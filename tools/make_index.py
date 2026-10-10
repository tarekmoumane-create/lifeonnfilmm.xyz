import json, os
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
items=json.load(open(os.path.join(root,'js','photos.json.tmp')))
open(os.path.join(root,'js','photos.js'),'w').write("// lifeonnfilmm photo index. Edit captions/chapters freely; src points at img/full and img/thumb.\nwindow.PHOTOS = "+json.dumps(items,indent=0,separators=(',',':'))+";\n")
os.remove(os.path.join(root,'js','photos.json.tmp')); print(len(items),'photos indexed')
