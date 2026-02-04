from PIL import Image

def add_white_background(input_path, output_path):
    img = Image.open(input_path)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Create a white background image of the same size
    white_bg = Image.new('RGBA', img.size, (255, 255, 255, 255))
    
    # Paste the transparent image onto the white background
    white_bg.paste(img, (0, 0), img)
    
    # Convert back to RGB for a solid background
    final_img = white_bg.convert('RGB')
    final_img.save(output_path, "PNG")
    print(f"Saved image with white background to {output_path}")

add_white_background("assets/logo_hand.png", "assets/logo_hand_white.png")
