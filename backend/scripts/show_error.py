import re

log = open("data/server.log", encoding="utf-8", errors="ignore").read()
idx = log.rfind("unhandled error")
chunk = log[idx : idx + 8000] if idx != -1 else log[-8000:]
# deepest app frame: last file-in-app line plus following source lines
app_frames = [(m.start(), m.group(0)) for m in re.finditer(r'File "[^"]*prohori-ai[^"]*backend[^"]*", line \d+', chunk)]
if app_frames:
    pos, header = app_frames[-1]
    print(header)
    print(chunk[pos : pos + 700])
else:
    # fallback: any final exception line
    tail = [l for l in chunk.splitlines() if l.strip().startswith(("NameError", "AttributeError", "KeyError", "TypeError", "ValueError", "IndexError"))]
    print("\n".join(tail[-5:]) or chunk[-1500:])
