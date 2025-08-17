#!/usr/bin/env python3
"""
Simple icon generator using basic shapes
Creates PNG icons without complex dependencies
"""

import os
from PIL import Image, ImageDraw

def create_simple_icon(size):
    """Create a simple icon with AutoAnswer branding"""
    # Create image with purple gradient background
    img = Image.new('RGBA', (size, size), (102, 126, 234, 255))  # #667eea
    draw = ImageDraw.Draw(img)
    
    # Add subtle gradient effect
    for i in range(size):
        alpha = min(255, int(255 * (1 - i / size * 0.3)))
        color = (102, 126, 234, alpha)
        draw.line([(0, i), (size, i)], fill=color)
    
    # Draw question mark or AI symbol based on size
    center_x, center_y = size // 2, size // 2
    
    if size >= 48:
        # For larger icons, draw a stylized "?" 
        margin = size // 6
        
        # Question mark circle (top part)
        circle_size = size // 3
        circle_top = margin
        draw.ellipse([
            center_x - circle_size//2, 
            circle_top, 
            center_x + circle_size//2, 
            circle_top + circle_size
        ], outline='white', width=max(2, size//32), fill=None)
        
        # Question mark stem
        stem_start = circle_top + circle_size * 0.7
        stem_end = center_y + circle_size//4
        stem_width = max(2, size//32)
        draw.line([
            (center_x, stem_start), 
            (center_x, stem_end)
        ], fill='white', width=stem_width)
        
        # Question mark dot
        dot_size = max(2, size//16)
        dot_y = stem_end + dot_size * 2
        draw.ellipse([
            center_x - dot_size, 
            dot_y - dot_size,
            center_x + dot_size, 
            dot_y + dot_size
        ], fill='white')
        
    elif size >= 32:
        # Medium size - simplified question mark
        # Draw "?" using simple shapes
        margin = size // 4
        
        # Top arc
        draw.arc([
            margin, margin, 
            size - margin, center_y + margin//2
        ], start=0, end=180, fill='white', width=2)
        
        # Vertical line
        draw.line([
            (center_x, center_y), 
            (center_x, center_y + margin)
        ], fill='white', width=2)
        
        # Dot
        dot_size = 1
        draw.ellipse([
            center_x - dot_size, size - margin - dot_size,
            center_x + dot_size, size - margin + dot_size
        ], fill='white')
        
    else:
        # Small size - just a simple circle with contrast
        margin = size // 3
        draw.ellipse([
            margin, margin, 
            size - margin, size - margin
        ], fill='white')
        
        # Inner circle for contrast
        inner_margin = margin + max(1, size // 8)
        draw.ellipse([
            inner_margin, inner_margin,
            size - inner_margin, size - inner_margin
        ], fill=(102, 126, 234, 255))
    
    return img

def main():
    # Create icons directory
    icons_dir = "icons"
    os.makedirs(icons_dir, exist_ok=True)
    
    # Create icons in required sizes
    sizes = [16, 48, 128]
    
    print("🎨 Creating AutoAnswer extension icons...")
    
    for size in sizes:
        try:
            icon = create_simple_icon(size)
            filename = f"{icons_dir}/icon{size}.png"
            icon.save(filename, "PNG")
            print(f"✅ Created {filename} ({size}x{size})")
        except Exception as e:
            print(f"❌ Error creating icon{size}.png: {e}")
    
    print("\n🎉 Icon creation complete!")
    print("📁 Icons saved in: icons/")
    print("🔧 Ready for Chrome extension installation!")

if __name__ == "__main__":
    main()
