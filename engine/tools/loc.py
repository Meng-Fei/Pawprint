import sys,fitz,json
d=fitz.open(sys.argv[1])
Q=json.load(open(sys.argv[2]))
for k,(pg,ph) in Q.items():
    p=d[pg-1];W,H=p.rect.width,p.rect.height
    r=p.search_for(ph)
    if not r: print(k,pg,'NOT FOUND',repr(ph));continue
    s=' | '.join(f'[{a.x0/W:.3f},{a.y0/H:.4f},{(a.x1-a.x0)/W:.3f},{(a.y1-a.y0)/H:.4f}]' for a in r[:4])
    print(k,pg,s)
