from PIL import Image, ImageOps, ImageEnhance
import argparse
import os
from pathlib import Path

def invert_image_colors(input_path, output_path=None):
    """
    Inverts the colors of an image (black to white and white to black)
   
    Args:
        input_path (str): Path to the input image
        output_path (str, optional): Path to save the inverted image.
                                     If None, adds '_inverted' to the input filename.
    """
    try:
        # Open the image
        image = Image.open(input_path)
        
        # Convert RGBA to RGB if necessary
        if image.mode == 'RGBA':
            # Create a white background image
            background = Image.new('RGB', image.size, (255, 255, 255))
            # Paste the image on the background using alpha channel
            background.paste(image, mask=image.split()[3])  # 3 is the alpha channel
            image = background
        elif image.mode != 'RGB':
            # Convert any other mode to RGB
            image = image.convert('RGB')
       
        # Invert the colors
        inverted_image = ImageOps.invert(image)
        
        # Enhance contrast to make whites whiter
        enhancer = ImageEnhance.Contrast(inverted_image)
        inverted_image = enhancer.enhance(1.2)  # Increase contrast by 20%
        
        # Enhance brightness to make whites even whiter
        enhancer = ImageEnhance.Brightness(inverted_image)
        inverted_image = enhancer.enhance(1.1)  # Increase brightness by 10%
       
        # Save the inverted image
        inverted_image.save(output_path)
        print(f"Inverted image saved to {output_path}")
       
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

def process_directory(input_dir, output_dir):
    """
    Process all images in a directory and save inverted versions to output directory
    
    Args:
        input_dir (str): Path to input directory containing images
        output_dir (str): Path to output directory where inverted images will be saved
    """
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Supported image extensions
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif'}
    
    # Process each file in the input directory
    for file_path in Path(input_dir).iterdir():
        if file_path.suffix.lower() in image_extensions:
            # Create corresponding output path
            relative_path = file_path.relative_to(input_dir)
            output_path = Path(output_dir) / relative_path
            
            # Create any necessary subdirectories
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Process the image
            invert_image_colors(str(file_path), str(output_path))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Invert image colors (black to white and white to black)")
    parser.add_argument("input", help="Path to input image or directory")
    parser.add_argument("-o", "--output", help="Path to save the inverted image or directory", required=True)
   
    args = parser.parse_args()
    
    input_path = Path(args.input)
    output_path = Path(args.output)
    
    if input_path.is_dir():
        process_directory(input_path, output_path)
    else:
        # Create output directory if it doesn't exist
        output_path.parent.mkdir(parents=True, exist_ok=True)
        invert_image_colors(str(input_path), str(output_path))