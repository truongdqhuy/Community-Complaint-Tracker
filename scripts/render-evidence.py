from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import textwrap

root = Path(__file__).resolve().parents[1]
font = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 19)
heading = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 28)

def render(source, destination, title, subtitle):
    content = source.read_text(encoding='utf-8').replace(chr(0x2714), '[PASS]').replace(chr(0x2139), '[INFO]')
    lines = []
    for line in content.splitlines():
        lines.extend(textwrap.wrap(line, width=108, replace_whitespace=False, subsequent_indent='  ') or [''])
    image = Image.new('RGB', (1320, 145 + 27 * len(lines)), '#101b24')
    draw = ImageDraw.Draw(image)
    draw.text((32, 24), title, font=heading, fill='#edf7ef')
    draw.text((32, 72), subtitle, font=font, fill='#aebfc9')
    for index, line in enumerate(lines):
        color = '#86e3a5' if any(word in line for word in ['PASS:', 'SUCCESS:', 'VERIFIED:', 'pass 1', 'fail 0']) else '#e2e9ed'
        if 'REJECTED' in line: color = '#ffd58a'
        draw.text((32, 120 + index * 27), line, font=font, fill=color)
    image.save(destination)

render(root/'docs/evidence/test-output.txt', root/'docs/evidence/tests.png', 'Automated test evidence', 'Actual captured Node.js test output | Rendered text, not a desktop screenshot')
render(root/'docs/demo-results.txt', root/'docs/evidence/demonstration.png', 'Local Ganache demonstration evidence', 'Saved live transaction results | Rendered text, not a desktop screenshot')
