// Mechanical PNG export for browser tabs, search results and home-screen shortcuts.
// swift -module-cache-path /tmp/site-icon-swift-cache tools/build-site-icons.swift
import Foundation
import ImageIO
import UniformTypeIdentifiers
let directory=URL(fileURLWithPath:"assets/site-icons",isDirectory:true)
let source=CGImageSourceCreateWithURL(directory.appendingPathComponent("dragon-artwork.png") as CFURL,nil)!
for (name,size) in [("favicon-32",32),("favicon-48",48),("favicon-192",192),("favicon-512",512),("apple-touch-icon",180)] {
 let image=CGImageSourceCreateThumbnailAtIndex(source,0,[kCGImageSourceCreateThumbnailFromImageAlways:true,kCGImageSourceThumbnailMaxPixelSize:size,kCGImageSourceCreateThumbnailWithTransform:true] as CFDictionary)!
 precondition(image.width==size && image.height==size,"The artwork must be square")
 let output=CGImageDestinationCreateWithURL(directory.appendingPathComponent(name+".png") as CFURL,UTType.png.identifier as CFString,1,nil)!
 CGImageDestinationAddImage(output,image,nil)
 precondition(CGImageDestinationFinalize(output))
 print(name+".png: \(size) x \(size)")
}
