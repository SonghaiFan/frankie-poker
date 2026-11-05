#!/usr/bin/env python3
"""Build portable Swiss-style README SVG banners. Python standard library only."""
import argparse
import base64
import copy
import json
import mimetypes
import shutil
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
LAYOUTS = {
    'screenshot': [(1024, 112, 816, 416)],
    'grid': [(1200, 80, 480, 480)],
    'gallery': [(1032, 144, 224, 384), (1320, 96, 252, 432), (1636, 144, 224, 384)],
}

def node(parent, tag, **attrs):
    return ET.SubElement(parent, f'{{{NS}}}{tag}', {
        key.replace('_', '-'): str(value) for key, value in attrs.items()
    })

def label(root, value, x, y, size, **attrs):
    element = node(root, 'text', x=x, y=y, font_size=size,
                   font_family='Helvetica Neue, Helvetica, Arial, sans-serif', **attrs)
    element.text = value

def asset(root, defs, path, box, config, index):
    x, y, width, height = box
    fit = config.get('fit', 'contain')
    if fit not in ('contain', 'cover'):
        raise ValueError('Asset fit must be contain or cover')
    align = config.get('align', 'xMidYMid')
    if align not in ('xMinYMin', 'xMidYMin', 'xMaxYMin', 'xMinYMid', 'xMidYMid',
                     'xMaxYMid', 'xMinYMax', 'xMidYMax', 'xMaxYMax'):
        raise ValueError('Invalid asset alignment')
    clip = node(defs, 'clipPath', id=f'asset-{index}')
    node(clip, 'rect', x=x, y=y, width=width, height=height, rx=config.get('radius', 0))
    mime = mimetypes.guess_type(path.name)[0]
    if mime not in ('image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'):
        raise ValueError(f'Unsupported asset type: {path.name}')
    data = base64.b64encode(path.read_bytes()).decode('ascii')
    aspect = f'{align} {"slice" if fit == "cover" else "meet"}'
    if config.get('crop'):
        crop = config['crop']
        source_size = config['source_size']
        if len(crop) != 4 or len(source_size) != 2 or min(crop[2:]) <= 0:
            raise ValueError('crop requires [x, y, width, height] and source_size [width, height]')
        if min(crop[:2]) < 0 or crop[0] + crop[2] > source_size[0] or crop[1] + crop[3] > source_size[1]:
            raise ValueError('Crop must stay inside the source image')
        group = node(root, 'g', clip_path=f'url(#asset-{index})')
        viewport = node(group, 'svg', x=x, y=y, width=width, height=height,
                        viewBox=' '.join(map(str, crop)), preserveAspectRatio=aspect)
        node(viewport, 'image', href=f'data:{mime};base64,{data}',
             width=source_size[0], height=source_size[1])
    else:
        node(root, 'image', href=f'data:{mime};base64,{data}', x=x, y=y,
             width=width, height=height, preserveAspectRatio=aspect,
             clip_path=f'url(#asset-{index})')

def build(config_path, output=None, png=False):
    config_path = Path(config_path).resolve()
    config = json.loads(config_path.read_text())
    title, tagline = config['title'], config['tagline']
    if len(title) > 20 or len(tagline) > 65:
        raise ValueError('Keep title within 20 characters and tagline within 65; use tagline_lines for longer copy')
    layout = config['layout']
    if layout not in LAYOUTS:
        raise ValueError(f'Unknown layout: {layout}')
    assets = config['assets']
    if len(assets) != len(LAYOUTS[layout]):
        raise ValueError(f'{layout} requires {len(LAYOUTS[layout])} asset(s)')
    root = ET.Element(f'{{{NS}}}svg', {'viewBox': '0 0 1920 640', 'width': '1920', 'height': '640',
                                    'role': 'img', 'aria-labelledby': 'title desc'})
    node(root, 'title', id='title').text = f'Frankie {title}'
    node(root, 'desc', id='desc').text = config.get('description', tagline)
    defs = node(root, 'defs')
    node(root, 'rect', width=1920, height=640, fill='#FFFFFF')
    signature_path = (config_path.parent / config['signature']).resolve() if 'signature' in config else ROOT / 'assets/frankie.svg'
    signature = ET.parse(signature_path).getroot()
    group = node(root, 'g', transform='translate(80 56) scale(0.40)', fill='#111111')
    for element in signature:
        if element.tag.split('}')[-1] == 'path':
            group.append(copy.deepcopy(element))
    node(root, 'line', x1=80, y1=168, x2=880, y2=168, stroke='#D9D9D9', stroke_width=1)
    if config.get('category'):
        label(root, config['category'].upper(), 80, 222, 15, fill='#666666', letter_spacing=3)
    # Shared baseline and type scale; longer project names use the smaller family size.
    title_size = 124 if len(title) <= 11 else 88
    label(root, title, 76, 360, title_size, font_weight=700, letter_spacing=-4, fill='#111111')
    lines = config.get('tagline_lines', [tagline])
    if not 1 <= len(lines) <= 2 or any(len(line) > 57 for line in lines):
        raise ValueError('Use one or two tagline lines, each at most 57 characters')
    for index, line in enumerate(lines):
        label(root, line, 80, 422 + index * 38, 29, fill='#555555')
    for index, (item, box) in enumerate(zip(assets, LAYOUTS[layout])):
        asset(root, defs, config_path.parent / item['src'], box, item, index)
    if config.get('icon'):
        asset(root, defs, config_path.parent / config['icon'], (1736, 80, 56, 56), {}, 'icon')
    if config.get('aura_sparkle'):
        # Original current-app AuraHeroCard sparkle, preserved as a vector path.
        g = node(root, 'g', transform='translate(1348 132) scale(0.55)', fill='#FFFFFF')
        node(g, 'path', d='M50 0C54 34 66 46 100 50 66 54 54 66 50 100 46 66 34 54 0 50 34 46 46 34 50 0Z')
    output = Path(output).resolve() if output else config_path.parent / 'banner.svg'
    output.parent.mkdir(parents=True, exist_ok=True)
    ET.ElementTree(root).write(output, encoding='utf-8', xml_declaration=True)
    print(output)
    if png:
        try:
            import cairosvg
        except (ImportError, OSError) as error:
            raise RuntimeError('PNG export needs CairoSVG and the Cairo system library; SVG was saved successfully.') from error
        cairosvg.svg2png(url=str(output), write_to=str(output.with_suffix('.png')))
        print(output.with_suffix('.png'))
    return output

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('config', nargs='?', type=Path)
    parser.add_argument('--all', action='store_true', help='Build all included examples')
    parser.add_argument('--out', type=Path, help='Output SVG path for a single config')
    parser.add_argument('--png', action='store_true', help='Also render a PNG (requires CairoSVG and Cairo)')
    parser.add_argument('--projects', action='store_true', help='Build installed sibling Frankie project banners')
    args = parser.parse_args()
    if args.all and args.projects:
        parser.error('Choose --all or --projects')
    if args.projects and ROOT.name != 'readme-banner-template':
        parser.error('--projects is available in the shared readme-banner-template directory')
    if args.all or args.projects:
        if args.config or args.out:
            parser.error('--all cannot be combined with config or --out')
        pattern = ROOT.parent.glob('frankie-*/docs/readme/banner.json') if args.projects else (ROOT / 'examples').glob('*/banner.json')
        for config in sorted(pattern):
            if args.projects:
                shutil.copy2(ROOT / 'build.py', config.parent / 'build.py')
            build(config, png=args.png)
    elif args.config:
        build(args.config, args.out, png=args.png)
    else:
        parser.error('Provide a banner.json path or --all')
