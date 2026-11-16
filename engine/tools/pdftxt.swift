import PDFKit
// usage: swiftc -O pdftxt.swift -o pdftxt; ./pdftxt file.pdf > out.txt   (each page starts with "=== pN")
let d=PDFDocument(url:URL(fileURLWithPath:CommandLine.arguments[1]))!
for i in 0..<d.pageCount { print("=== p\(i+1)"); print(d.page(at:i)?.string ?? "") }
