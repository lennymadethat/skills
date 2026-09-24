#!/bin/bash
# usage: MODEL=... ASPECT=16:9 nb.sh OUT.png "prompt" [refs...]
OUT="$1"; PROMPT="$2"; shift 2
MODEL="${MODEL:-gemini-3-pro-image-preview}"; ASPECT="${ASPECT:-16:9}"
KEY="${GEMINI_API_KEY:?set GEMINI_API_KEY in the environment}"
python - "$OUT" "$PROMPT" "$ASPECT" "$@" <<'PY'
import sys,json,base64,io
from PIL import Image
out,prompt,aspect,refs=sys.argv[1],sys.argv[2],sys.argv[3],sys.argv[4:]
parts=[]
for r in refs:
    im=Image.open(r).convert("RGB"); im.thumbnail((1024,1024)); b=io.BytesIO(); im.save(b,"JPEG",quality=88)
    parts.append({"inline_data":{"mime_type":"image/jpeg","data":base64.b64encode(b.getvalue()).decode()}})
parts.append({"text":prompt})
json.dump({"contents":[{"parts":parts}],"generationConfig":{"responseModalities":["IMAGE"],"imageConfig":{"aspectRatio":aspect}}},open("req.json","w"))
PY
curl -s -H "Content-Type: application/json" -d @req.json "https://generativelanguage.googleapis.com/v1beta/models/$MODEL:generateContent?key=$KEY" -o resp.json
python - "$OUT" <<'PY'
import sys,json,base64
r=json.load(open("resp.json"))
if "error" in r: print("ERR",r["error"].get("message","")[:300]); sys.exit(1)
ok=False
for p in r["candidates"][0]["content"]["parts"]:
    if "inlineData" in p: open(sys.argv[1],"wb").write(base64.b64decode(p["inlineData"]["data"])); ok=True
    elif "text" in p: print("TEXT:",p["text"][:150])
print("saved" if ok else "NO IMAGE", sys.argv[1])
PY
