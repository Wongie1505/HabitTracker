from PIL import Image, ImageDraw
for s in (192, 512):
    im = Image.new('RGB', (s, s), '#111111')
    d = ImageDraw.Draw(im)
    d.line([(s*.30, s*.52), (s*.44, s*.66), (s*.70, s*.36)], fill='#4ade80', width=max(s//12, 6), joint='curve')
    im.save(f'icon-{s}.png')