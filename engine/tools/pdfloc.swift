import PDFKit
// usage: swiftc -O pdfloc.swift -o pdfloc; ./pdfloc file.pdf page "phrase"
// prints the box of the phrase in page fractions (top-left origin), the format REFS uses in index.html
let a=CommandLine.arguments, d=PDFDocument(url:URL(fileURLWithPath:a[1]))!, pg=Int(a[2])!-1, ph=a[3]
let page=d.page(at:pg)!, mb=page.bounds(for:.mediaBox)
print("size \(Int(mb.width))x\(Int(mb.height)) pages \(d.pageCount)")
let sels=d.findString(ph, withOptions:[.caseInsensitive]).filter{$0.pages.contains(page)}
if sels.isEmpty { print("NOT FOUND"); exit(1) }
for s in sels { let b=s.bounds(for:page)
  print(String(format:"x:%.3f,y:%.3f,w:%.3f,h:%.3f", (b.minX-mb.minX)/mb.width, (mb.maxY-b.maxY)/mb.height, b.width/mb.width, b.height/mb.height)) }
