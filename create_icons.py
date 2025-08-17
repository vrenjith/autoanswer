#!/usr/bin/env python3
"""
Simple icon generator for AutoAnswer Chrome Extension
Creates PNG icons in 16x16, 48x48, and 128x128 sizes
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os
    
    # Create icons directory if it doesn't exist
    icons_dir = "icons"
    if not os.path.exists(icons_dir):
        os.makedirs(icons_dir)
    
    # Define colors (RGB tuples)
    bg_color = (102, 126, 234)  # Purple gradient start
    text_color = (255, 255, 255)  # White
    accent_color = (118, 75, 162)  # Purple gradient end
    
    def create_icon(size):
        # Create image with solid background
        img = Image.new('RGBA', (size, size), bg_color + (255,))
        draw = ImageDraw.Draw(img)
        
        # Create gradient effect
        for i in range(size):
            alpha = i / size
            r = int(bg_color[0] * (1-alpha) + accent_color[0] * alpha)
            g = int(bg_color[1] * (1-alpha) + accent_color[1] * alpha)
            b = int(bg_color[2] * (1-alpha) + accent_color[2] * alpha)
            draw.line([(0, i), (size, i)], fill=(r, g, b, 255))
        
        # Draw question mark symbol
        if size >= 32:
            # For larger icons, draw a question mark
            font_size = max(size // 2, 16)
            try:
                # Try to load default font
                font = ImageFont.load_default()
            except:
                font = None
            
            # Position question mark in center
            text = "?"
            if font:
                bbox = draw.textbbox((0, 0), text, font=font)
                text_width = bbox[2] - bbox[0]
                text_height = bbox[3] - bbox[1]
            else:
                text_width = size // 3
                text_height = size // 2
            
            x = (size - text_width) // 2
            y = (size - text_height) // 2 - 2
            
            # Draw shadow for depth
            shadow_color = (0, 0, 0, 100)
            draw.text((x+2, y+2), text, font=font, fill=shadow_color)
            # Draw main text
            draw.text((x, y), text, font=font, fill=text_color)
        else:
            # For small icon (16px), draw a simple dot
            margin = size // 3
            draw.ellipse([margin, margin, size-margin, size-margin], 
                        fill=text_color, outline=text_color)
        
        return img
    
    # Create icons in different sizes
    sizes = [16, 48, 128]
    for size in sizes:
        icon = create_icon(size)
        filename = f"{icons_dir}/icon{size}.png"
        icon.save(filename, "PNG")
        print(f"✅ Created {filename}")
    
    print("\n🎉 All icons created successfully!")
    print("Icons are ready for Chrome Web Store submission.")

except ImportError:
    print("❌ PIL (Pillow) not installed.")
    print("Install with: pip install Pillow")
    print("\nAlternatively, create icons manually:")
    print("- Use any image editor (Canva, GIMP, Photoshop)")
    print("- Create 16x16, 48x48, and 128x128 PNG files")
    print("- Use a purple gradient background with white '?' symbol")
    print("- Save as icon16.png, icon48.png, icon128.png in icons/ folder")
    
except Exception as e:
    print(f"❌ Error creating icons: {e}")
    print("Create icons manually or use online icon generators")
