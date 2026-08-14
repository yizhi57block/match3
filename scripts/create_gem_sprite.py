#!/usr/bin/env python3
"""Create gem sprite sheet from individual gem images."""

from PIL import Image
import os

# Define gem files in order
gem_files = [
    'public/scene1/gems/gem_purple.webp',
    'public/scene1/gems/gem_orange.webp',
    'public/scene1/gems/gem_pink.webp',
    'public/scene1/gems/gem_green.webp',
]

# Target sprite sheet dimensions
frame_size = 100  # Each frame will be 100x100
frames_count = len(gem_files)

# Create sprite sheet (horizontal layout)
sprite_width = frame_size * frames_count
sprite_height = frame_size
sprite = Image.new('RGBA', (sprite_width, sprite_height), (0, 0, 0, 0))

# Load and paste each gem
for i, gem_file in enumerate(gem_files):
    if not os.path.exists(gem_file):
        print(f"Warning: {gem_file} not found!")
        continue

    # Load gem image
    gem = Image.open(gem_file).convert('RGBA')

    # Resize to fit frame (maintain aspect ratio and center)
    gem.thumbnail((frame_size, frame_size), Image.Resampling.LANCZOS)

    # Calculate position to center the gem in the frame
    x_offset = i * frame_size + (frame_size - gem.width) // 2
    y_offset = (frame_size - gem.height) // 2

    # Paste onto sprite sheet
    sprite.paste(gem, (x_offset, y_offset), gem)
    print(f"Added {gem_file} at position {i} (offset: {x_offset}, {y_offset})")

# Save sprite sheet
output_path = 'public/scene1/gems/gems.png'
sprite.save(output_path, 'PNG')
print(f"\nSprite sheet created: {output_path}")
print(f"Dimensions: {sprite_width}x{sprite_height}")
print(f"Frame size: {frame_size}x{frame_size}")
print(f"Frame count: {frames_count}")
