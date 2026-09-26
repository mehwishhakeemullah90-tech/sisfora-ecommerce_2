"""Usage: python scripts/generate-product-renders.py public/images/sisfora

Procedural 'studio render' generator for Sisfora product imagery.
Draws luxury skincare packaging as layered SVG (cylindrical shading, metallic
gold, glass, labels) and rasterises with Chromium to WebP."""
import itertools, os, sys
from playwright.sync_api import sync_playwright
from PIL import Image

OUT = sys.argv[1] if len(sys.argv) > 1 else 'out'
os.makedirs(OUT, exist_ok=True)
_uid = itertools.count()

def uid(p):
    return f'{p}{next(_uid)}'

def hex2rgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def shade(h, f):
    r, g, b = hex2rgb(h)
    if f >= 1:
        r, g, b = [int(c + (255 - c) * (f - 1)) for c in (r, g, b)]
    else:
        r, g, b = [int(c * f) for c in (r, g, b)]
    return '#%02x%02x%02x' % (max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b)))

DEFS = []

def cyl_grad(base, strength=1.0, spec=1.55):
    """Horizontal gradient that makes a flat shape read as a cylinder."""
    i = uid('cg')
    s = strength
    stops = [(0, shade(base, 1 - .55 * s)), (.08, shade(base, 1 - .3 * s)), (.22, shade(base, 1 + .12 * s)),
             (.3, shade(base, spec)), (.36, shade(base, 1 + .15 * s)), (.6, base), (.82, shade(base, 1 - .28 * s)),
             (.92, shade(base, 1 + .08 * s)), (1, shade(base, 1 - .6 * s))]
    DEFS.append(f'<linearGradient id="{i}" x1="0" x2="1" y1="0" y2="0">' +
                ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops) + '</linearGradient>')
    return f'url(#{i})'

def gold_grad(vertical=False):
    i = uid('gg')
    stops = [(0, '#6b4a17'), (.1, '#a8792c'), (.24, '#f3d58f'), (.32, '#fff1c8'), (.4, '#e2b862'),
             (.62, '#b8862f'), (.8, '#7e5719'), (.9, '#caa052'), (1, '#5a3c10')]
    x2, y2 = ('0', '1') if vertical else ('1', '0')
    DEFS.append(f'<linearGradient id="{i}" x1="0" y1="0" x2="{x2}" y2="{y2}">' +
                ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops) + '</linearGradient>')
    return f'url(#{i})'

def vgrad(c1, c2, o1=1, o2=1):
    i = uid('vg')
    DEFS.append(f'<linearGradient id="{i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{c1}" stop-opacity="{o1}"/><stop offset="1" stop-color="{c2}" stop-opacity="{o2}"/></linearGradient>')
    return f'url(#{i})'

def radial(c, o=1, o2=0, cx=.5, cy=.5, r=.5):
    i = uid('rg')
    DEFS.append(f'<radialGradient id="{i}" cx="{cx}" cy="{cy}" r="{r}"><stop offset="0" stop-color="{c}" stop-opacity="{o}"/><stop offset="1" stop-color="{c}" stop-opacity="{o2}"/></radialGradient>')
    return f'url(#{i})'

def highlight(x, y, w, h, o=.55):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{w/2}" fill="#fff" opacity="{o}" filter="url(#soft)"/>'

def label(x, y, w, h, name, sub='', bg='#f5eee3', ink='#2a211c', gold='#b58a3c', rx=3, small=False):
    fs = w * (0.12 if not small else 0.115)
    s = f'<g><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{bg}"/>'
    s += f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{cyl_grad("#ffffff", .9, 1.0)}" opacity=".22" style="mix-blend-mode:multiply"/>'
    cx = x + w / 2
    s += f'<text x="{cx}" y="{y + h*0.34}" text-anchor="middle" font-family="Lora, Georgia, serif" font-size="{fs}" letter-spacing="{fs*0.22}" fill="{ink}" font-weight="600">SISFORA</text>'
    s += f'<line x1="{cx - w*0.18}" x2="{cx + w*0.18}" y1="{y + h*0.45}" y2="{y + h*0.45}" stroke="{gold}" stroke-width="{max(1, w*0.012)}"/>'
    if name:
        s += f'<text x="{cx}" y="{y + h*0.62}" text-anchor="middle" font-family="Poppins, Arial, sans-serif" font-size="{fs*0.52}" letter-spacing="{fs*0.12}" fill="{ink}">{name}</text>'
    if sub:
        s += f'<text x="{cx}" y="{y + h*0.8}" text-anchor="middle" font-family="Poppins, Arial, sans-serif" font-size="{fs*0.4}" letter-spacing="{fs*0.08}" fill="{gold}">{sub}</text>'
    return s + '</g>'

# ---------------------------------------------------------------- objects
# Each returns (svg, width, height) drawn with bottom-centre at (0,0).

def dropper(glass='#9a5220', name='RADIANCE', sub='SERUM · 30 ML', label_bg='#f5eee3'):
    w, H = 130, 250
    s = ''
    # glass body with shoulder
    body = f'M{-w/2},-18 Q{-w/2},0 {-w/2+18},0 H{w/2-18} Q{w/2},0 {w/2},-18 V{-H+46} Q{w/2},{-H+6} 26,{-H} H-26 Q{-w/2},{-H+6} {-w/2},{-H+46} Z'
    s += f'<path d="{body}" fill="{cyl_grad(glass, 1.0, 1.9)}"/>'
    s += f'<path d="{body}" fill="{vgrad("#000", "#000", 0, .25)}"/>'
    # label
    s += label(-w/2 + 8, -H + 78, w - 16, 128, name, sub, bg=label_bg)
    s += highlight(-w/2 + 12, -H + 30, 9, H - 50, .45)
    s += highlight(w/2 - 20, -H + 40, 4, H - 70, .25)
    # neck + collar
    s += f'<rect x="-24" y="{-H-18}" width="48" height="22" fill="{cyl_grad(shade(glass,.8))}"/>'
    s += f'<rect x="-33" y="{-H-66}" width="66" height="52" rx="5" fill="{gold_grad()}"/>'
    s += ''.join(f'<rect x="-33" y="{-H-60+k*9}" width="66" height="1.3" fill="#5a3c10" opacity=".35"/>' for k in range(5))
    # bulb
    s += f'<path d="M-24,{-H-64} C-26,{-H-110} -22,{-H-140} 0,{-H-142} C22,{-H-140} 26,{-H-110} 24,{-H-64} Z" fill="{cyl_grad("#1c1714", 1.0, 3.2)}"/>'
    return s, w + 10, H + 150

def jar(body='#efe6d8', lid=None, name='HYDRA', sub='MOISTURISER · 50 ML', w=210, h=112, lidh=58, dark_label=False):
    s = ''
    rx, ry = w / 2, 16
    s += f'<path d="M{-rx},{-h} V-6 Q{-rx},{ry-8} 0,{ry-6} Q{rx},{ry-8} {rx},-6 V{-h} Z" fill="{cyl_grad(body, .9, 1.35)}"/>'
    lab_bg = '#1b1715' if dark_label else '#f7f1e7'
    ink = '#e9d4a5' if dark_label else '#2a211c'
    s += label(-rx * .62, -h + 22, rx * 1.24, h - 40, name, sub, bg=lab_bg, ink=ink, rx=2, small=True)
    lidc = lid or gold_grad()
    s += f'<path d="M{-rx-4},{-h-lidh} V{-h+4} Q{-rx-4},{-h+14} 0,{-h+14} Q{rx+4},{-h+14} {rx+4},{-h+4} V{-h-lidh} Z" fill="{lidc}"/>'
    s += ''.join(f'<rect x="{-rx-4}" y="{-h-lidh+6+k*7}" width="{w+8}" height="1" fill="#000" opacity=".12"/>' for k in range(7))
    s += f'<ellipse cx="0" cy="{-h-lidh}" rx="{rx+4}" ry="{ry}" fill="{radial("#fff6dc", .95, .2, .38, .3, .8)}"/>'
    s += f'<ellipse cx="0" cy="{-h-lidh}" rx="{rx+4}" ry="{ry}" fill="none" stroke="#7e5719" stroke-width="1.5" opacity=".6"/>'
    s += highlight(-rx + 16, -h + 8, 8, h - 20, .35)
    return s, w + 20, h + lidh + 30

def tube(body='#ecd3c8', name='PETAL SOFT', sub='CREAM CLEANSER', h=330):
    s = ''
    cap_h = 62
    s += f'<rect x="-36" y="{-cap_h}" width="72" height="{cap_h}" rx="6" fill="{gold_grad()}"/>'
    s += ''.join(f'<rect x="-36" y="{-cap_h+8+k*10}" width="72" height="1.2" fill="#5a3c10" opacity=".3"/>' for k in range(5))
    top_w = 128
    path = f'M-36,{-cap_h} L{-top_w/2},{-h+26} L{-top_w/2},{-h} L{top_w/2},{-h} L{top_w/2},{-h+26} L36,{-cap_h} Z'
    s += f'<path d="{path}" fill="{cyl_grad(body, .8, 1.3)}"/>'
    s += f'<rect x="{-top_w/2}" y="{-h-4}" width="{top_w}" height="22" fill="{cyl_grad(shade(body,.93), .6, 1.2)}"/>'
    s += ''.join(f'<rect x="{-top_w/2+4+k*8}" y="{-h}" width="1.2" height="14" fill="#000" opacity=".15"/>' for k in range(int(top_w/8)))
    s += label(-46, -h + 70, 92, 130, name, sub, bg='transparent', ink='#3a2c27', small=True)
    s += highlight(-top_w/2 + 18, -h + 30, 7, h - 110, .4)
    return s, top_w + 20, h + 10

def tall_bottle(glass='#d9cbb8', name='ROSEWATER', sub='BALANCING TONER', frost=True, h=300, w=112, cap='gold'):
    s = ''
    body = f'M{-w/2},-14 Q{-w/2},0 {-w/2+14},0 H{w/2-14} Q{w/2},0 {w/2},-14 V{-h+38} Q{w/2},{-h} 20,{-h} H-20 Q{-w/2},{-h} {-w/2},{-h+38} Z'
    s += f'<path d="{body}" fill="{cyl_grad(glass, .75, 1.5)}" opacity="{.92 if frost else 1}"/>'
    # liquid line
    s += f'<rect x="{-w/2+6}" y="{-h*0.82}" width="{w-12}" height="2" fill="#fff" opacity=".35"/>'
    s += label(-w/2 + 10, -h + 92, w - 20, 120, name, sub, bg='#faf6ef', small=True)
    s += highlight(-w/2 + 10, -h + 30, 7, h - 45, .5)
    capc = gold_grad() if cap == 'gold' else cyl_grad('#1c1714', 1, 3)
    s += f'<rect x="-24" y="{-h-8}" width="48" height="12" fill="{cyl_grad(shade(glass,.8))}"/>'
    s += f'<rect x="-30" y="{-h-86}" width="60" height="82" rx="5" fill="{capc}"/>'
    return s, w + 10, h + 90

def pump(body='#1d1815', name='SUNLIT GLOW', sub='SPF 30 · 50 ML', h=250, w=124, dark=True):
    s = ''
    bpath = f'M{-w/2},-16 Q{-w/2},0 {-w/2+16},0 H{w/2-16} Q{w/2},0 {w/2},-16 V{-h+30} Q{w/2},{-h} {w/2-30},{-h} H{-w/2+30} Q{-w/2},{-h} {-w/2},{-h+30} Z'
    s += f'<path d="{bpath}" fill="{cyl_grad(body, 1, 3.0 if dark else 1.4)}"/>'
    s += label(-w/2 + 12, -h + 70, w - 24, 120, name, sub, bg='#1b1715' if dark else '#f7f1e7', ink='#ecd7a9' if dark else '#2a211c', small=True)
    s += f'<rect x="-28" y="{-h-26}" width="56" height="30" rx="4" fill="{gold_grad()}"/>'
    s += f'<rect x="-8" y="{-h-62}" width="16" height="38" fill="{gold_grad()}"/>'
    s += f'<path d="M-26,{-h-62} H40 Q52,{-h-62} 54,{-h-72} L56,{-h-68} Q54,{-h-52} 36,{-h-52} H-26 Z" fill="{gold_grad(True)}"/>'
    s += f'<rect x="-26" y="{-h-78}" width="52" height="18" rx="6" fill="{gold_grad()}"/>'
    s += highlight(-w/2 + 12, -h + 26, 7, h - 44, .22 if dark else .4)
    return s, w + 60, h + 90

def mist(glass='#e8d9cd', name='DEWY PETAL', sub='HYDRATING MIST', h=270, w=100):
    s, W, Hh = tall_bottle(glass, name, sub, h=h, w=w)
    # replace cap with spray head + clear overcap
    s = s.rsplit('<rect x="-30"', 1)[0]
    s += f'<rect x="-22" y="{-h-40}" width="44" height="36" rx="4" fill="{gold_grad()}"/>'
    s += f'<rect x="-14" y="{-h-62}" width="28" height="24" rx="4" fill="{cyl_grad("#f4efe8", .6, 1.2)}"/>'
    s += f'<circle cx="8" cy="{-h-52}" r="2.5" fill="#6b5e55"/>'
    s += f'<path d="M-34,{-h-14} V{-h-78} Q-34,{-h-96} -16,{-h-96} H16 Q34,{-h-96} 34,{-h-78} V{-h-14} Z" fill="#ffffff" opacity=".18" stroke="#fff" stroke-opacity=".6"/>'
    return s, W, Hh + 20

def lipstick(bullet='#8e1f2c'):
    s = ''
    s += f'<rect x="-30" y="-120" width="60" height="120" rx="3" fill="{gold_grad()}"/>'
    s += f'<rect x="-30" y="-126" width="60" height="8" fill="#3a2a14" opacity=".5"/>'
    s += f'<rect x="-24" y="-170" width="48" height="48" fill="{gold_grad()}"/>'
    s += f'<path d="M-20,-170 V-222 L20,-248 V-170 Z" fill="{cyl_grad(bullet, 1, 1.6)}"/>'
    return s, 80, 260

def perfume(glass='#f0d9b0'):
    s = ''
    s += f'<rect x="-80" y="-170" width="160" height="170" rx="14" fill="{cyl_grad(glass, .7, 1.6)}" opacity=".9"/>'
    s += f'<rect x="-62" y="-150" width="124" height="132" rx="8" fill="{cyl_grad(shade(glass,.85), .6, 1.4)}" opacity=".9"/>'
    s += label(-46, -120, 92, 70, 'AMBER BLOOM', 'EAU DE PARFUM', bg='#fbf7f0', small=True)
    s += f'<rect x="-20" y="-186" width="40" height="18" fill="{gold_grad()}"/>'
    s += f'<rect x="-44" y="-262" width="88" height="80" rx="6" fill="{gold_grad()}"/>'
    s += highlight(-70, -160, 8, 140, .5)
    return s, 180, 280

def shadow(w, o=.38):
    return f'<ellipse cx="0" cy="2" rx="{w*0.62}" ry="{max(8, w*0.09)}" fill="{radial("#1a120c", o, 0)}"/>'

# ---------------------------------------------------------------- scenes

SOFT = '<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter>' \
       '<filter id="blur30"><feGaussianBlur stdDeviation="30"/></filter>' \
       '<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .05 0"/></filter>'

def svg_doc(w, h, body):
    d = ''.join(DEFS); DEFS.clear()
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><defs>{SOFT}{d}</defs>{body}</svg>'

def backdrop(W, H, top='#f7f1e8', bottom='#e6d8c5', podium=True, podium_c='#eadfcf', px=None, py=None, pw=None):
    s = f'<rect width="{W}" height="{H}" fill="{vgrad(top, bottom)}"/>'
    s += f'<circle cx="{W*0.7}" cy="{H*0.25}" r="{W*0.45}" fill="{radial("#ffffff", .8, 0)}"/>'
    s += f'<circle cx="{W*0.15}" cy="{H*0.9}" r="{W*0.4}" fill="{radial("#c9a878", .25, 0)}"/>'
    if podium:
        px = px or W / 2; py = py or H * 0.8; pw = pw or W * 0.62
        ph = H * 0.14
        s += f'<path d="M{px-pw/2},{py} V{py+ph} Q{px},{py+ph+pw*0.14} {px+pw/2},{py+ph} V{py} Z" fill="{cyl_grad(podium_c, .5, 1.12)}"/>'
        s += f'<ellipse cx="{px}" cy="{py}" rx="{pw/2}" ry="{pw*0.12}" fill="{vgrad(shade(podium_c,1.1), shade(podium_c,.94))}"/>'
        s += f'<ellipse cx="{px}" cy="{py}" rx="{pw/2}" ry="{pw*0.12}" fill="none" stroke="#b58a3c" stroke-opacity=".45" stroke-width="2"/>'
    s += f'<rect width="{W}" height="{H}" filter="url(#grain)"/>'
    return s

def place(obj, x, y, scale=1.0, shadow_o=.35):
    s, w, h = obj
    return f'<g transform="translate({x},{y}) scale({scale})">{shadow(w, shadow_o)}{s}</g>'

# ---------------------------------------------------------------- build list
PRODUCTS = {
    'serum-radiance': lambda: dropper('#9a5220', 'RADIANCE', 'SERUM · 30 ML'),
    'moisturizer-hydra': lambda: jar('#efe6d8', None, 'PURE HYDRA', 'MOISTURISER'),
    'cleanser-petal': lambda: tube('#ecd3c8', 'PETAL SOFT', 'CREAM CLEANSER'),
    'toner-rosewater': lambda: tall_bottle('#e3cdbf', 'ROSEWATER', 'BALANCING TONER'),
    'mist-dewy': lambda: mist('#efe0d6', 'DEWY PETAL', 'HYDRATING MIST'),
    'spf-sunlit': lambda: pump('#1d1815', 'SUNLIT GLOW', 'SPF 30 · 50 ML'),
    'night-camellia': lambda: jar('#1f1a17', None, 'CAMELLIA', 'NIGHT REPAIR', dark_label=True),
    'serum-gold': lambda: dropper('#2b2320', 'GOLD ELIXIR', 'FACE OIL · 30 ML', label_bg='#f3e7cf'),
}

def product_scene(key, W=1000, H=1250):
    body = backdrop(W, H, py=H * 0.8)
    obj = PRODUCTS[key]()
    sc = min(3.4, (H * 0.6) / obj[2], (W * 0.56) / obj[1])
    body += place(obj, W / 2, H * 0.8 + 6, sc)
    return svg_doc(W, H, body)

def product_alt(key, W=1000, H=1250):
    """Second 'angle' — darker editorial backdrop for hover image."""
    body = f'<rect width="{W}" height="{H}" fill="{vgrad("#2a221d", "#120e0c")}"/>'
    body += f'<circle cx="{W*0.5}" cy="{H*0.45}" r="{W*0.42}" fill="{radial("#b58a3c", .35, 0)}"/>'
    body += f'<ellipse cx="{W/2}" cy="{H*0.8}" rx="{W*0.34}" ry="{W*0.07}" fill="{radial("#d2aa61", .35, 0)}"/>'
    obj = PRODUCTS[key]()
    sc = min(3.4, (H * 0.6) / obj[2], (W * 0.56) / obj[1])
    body += place(obj, W / 2, H * 0.8, sc, .6)
    body += f'<rect width="{W}" height="{H}" filter="url(#grain)"/>'
    return svg_doc(W, H, body)

def cutout(key, pad=40):
    obj = PRODUCTS[key]()
    s, w, h = obj
    W, H = int(w + pad * 2 + 60), int(h + pad * 2)
    return svg_doc(W, H, place(obj, W / 2, H - pad, 1.0, .45)), W, H

def group_scene(W=1400, H=1400, dark=False):
    if dark:
        body = f'<rect width="{W}" height="{H}" fill="{vgrad("#231c18", "#0e0b09")}"/>'
        body += f'<circle cx="{W*0.5}" cy="{H*0.42}" r="{W*0.45}" fill="{radial("#b58a3c", .32, 0)}"/>'
    else:
        body = backdrop(W, H, podium=False)
    # tiered podiums
    for (px, py, pw, c) in [(W*0.3, H*0.78, W*0.36, '#e9dccb'), (W*0.68, H*0.72, W*0.4, '#efe5d7'), (W*0.5, H*0.86, W*0.5, '#e3d3bf')]:
        ph = H * 0.12
        body += f'<path d="M{px-pw/2},{py} V{py+ph} Q{px},{py+ph+pw*0.12} {px+pw/2},{py+ph} V{py} Z" fill="{cyl_grad(c, .5, 1.12)}"/>'
        body += f'<ellipse cx="{px}" cy="{py}" rx="{pw/2}" ry="{pw*0.11}" fill="{vgrad(shade(c,1.08), shade(c,.95))}"/>'
        body += f'<ellipse cx="{px}" cy="{py}" rx="{pw/2}" ry="{pw*0.11}" fill="none" stroke="#b58a3c" stroke-opacity=".5" stroke-width="2"/>'
    body += place(PRODUCTS['toner-rosewater'](), W*0.3, H*0.78, 1.7)
    body += place(PRODUCTS['serum-radiance'](), W*0.66, H*0.72, 1.8)
    body += place(PRODUCTS['moisturizer-hydra'](), W*0.44, H*0.87, 1.45)
    body += place(PRODUCTS['spf-sunlit'](), W*0.66, H*0.9, 1.25)
    body += f'<rect width="{W}" height="{H}" filter="url(#grain)"/>'
    return svg_doc(W, H, body)

def ritual_scene(keys, tone, W=900, H=1100):
    top, bottom = tone
    body = f'<rect width="{W}" height="{H}" fill="{vgrad(top, bottom)}"/>'
    body += f'<circle cx="{W*0.5}" cy="{H*0.4}" r="{W*0.5}" fill="{radial("#ffffff", .35, 0)}"/>'
    # arch window
    aw, ah = W * 0.62, H * 0.72
    ax, ay = (W - aw) / 2, H * 0.12
    body += f'<path d="M{ax},{ay+ah} V{ay+aw/2} A{aw/2},{aw/2} 0 0 1 {ax+aw},{ay+aw/2} V{ay+ah} Z" fill="#ffffff" opacity=".22" stroke="#b58a3c" stroke-opacity=".55" stroke-width="2"/>'
    n = len(keys)
    for i, k in enumerate(keys):
        obj = PRODUCTS[k]()
        sc = min(1.9, (H * 0.5) / obj[2])
        x = W * (0.5 if n == 1 else (0.36 + 0.28 * i))
        body += place(obj, x, ay + ah - 10 + (i % 2) * 24, sc * (1 if i == 0 else .85))
    body += f'<rect width="{W}" height="{H}" filter="url(#grain)"/>'
    return svg_doc(W, H, body)

def category_scene(W=1600, H=1000):
    body = backdrop(W, H, podium=False)
    body += f'<rect x="{W*0.55}" y="0" width="{W*0.45}" height="{H}" fill="{vgrad("#efe3d3", "#e2d1bb")}"/>'
    for (px, py, pw) in [(W*0.62, H*0.8, W*0.26), (W*0.82, H*0.74, W*0.24)]:
        ph = H * 0.14
        body += f'<path d="M{px-pw/2},{py} V{py+ph+60} H{px+pw/2} V{py} Z" fill="{cyl_grad("#e8dccb", .5, 1.12)}"/>'
        body += f'<ellipse cx="{px}" cy="{py}" rx="{pw/2}" ry="{pw*0.1}" fill="#f1e8dc" stroke="#b58a3c" stroke-opacity=".5" stroke-width="2"/>'
    body += place(PRODUCTS['serum-radiance'](), W*0.62, H*0.8, 1.55)
    body += place(PRODUCTS['moisturizer-hydra'](), W*0.82, H*0.74, 1.25)
    body += place(PRODUCTS['cleanser-petal'](), W*0.72, H*0.97, 1.1)
    body += f'<rect width="{W}" height="{H}" filter="url(#grain)"/>'
    return svg_doc(W, H, body)

# ---------------------------------------------------------------- render
_FONTS = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public', 'fonts')).replace(os.sep, '/')
FONT_CSS = f"""
@font-face{{font-family:Lora;src:url(file:///{_FONTS.lstrip('/')}/lora-var.woff) format('woff');font-weight:400 700}}
@font-face{{font-family:Poppins;src:url(file:///{_FONTS.lstrip('/')}/poppins-400.woff) format('woff')}}
"""

def render(page, svg, w, h, path, alpha=False, q=82):
    page.set_viewport_size({'width': int(w), 'height': int(h)})
    page.set_content(f'<html><head><style>{FONT_CSS}html,body{{margin:0;background:transparent}}</style></head><body>{svg}</body></html>')
    page.wait_for_timeout(120)
    png = path + '.png'
    page.screenshot(path=png, omit_background=alpha, clip={'x': 0, 'y': 0, 'width': int(w), 'height': int(h)})
    im = Image.open(png)
    im = im.convert('RGBA' if alpha else 'RGB')
    im.save(path + '.webp', 'WEBP', quality=q, method=6)
    os.remove(png)
    print(path + '.webp', os.path.getsize(path + '.webp') // 1024, 'KB')

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page()
    os.makedirs(f'{OUT}/products', exist_ok=True)
    os.makedirs(f'{OUT}/scene', exist_ok=True)
    for k in PRODUCTS:
        render(pg, product_scene(k), 1000, 1250, f'{OUT}/products/{k}')
        render(pg, product_alt(k), 1000, 1250, f'{OUT}/products/{k}-alt')
        svg, W, H = cutout(k)
        render(pg, svg, W, H, f'{OUT}/scene/cut-{k}', alpha=True, q=88)
    render(pg, group_scene(), 1400, 1400, f'{OUT}/scene/hero-group')
    render(pg, group_scene(dark=True), 1400, 1400, f'{OUT}/scene/hero-group-dark')
    render(pg, ritual_scene(['cleanser-petal', 'toner-rosewater'], ('#f1e4d8', '#e2cdbb')), 900, 1100, f'{OUT}/scene/ritual-prepare')
    render(pg, ritual_scene(['serum-radiance', 'serum-gold'], ('#eadbc6', '#d9c1a1')), 900, 1100, f'{OUT}/scene/ritual-treat')
    render(pg, ritual_scene(['spf-sunlit', 'moisturizer-hydra'], ('#e9ddd3', '#d6c3b3')), 900, 1100, f'{OUT}/scene/ritual-protect')
    render(pg, category_scene(), 1600, 1000, f'{OUT}/scene/category-skincare')
    b.close()
