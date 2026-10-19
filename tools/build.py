"""Build the static Pmenu demo from the design sources in src/.

Run from the repo root:  python3 tools/build.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'src'

ASSETS = {
    '049e92a00bf77ff8ff360eb67800e5f0': 'assets/latte.jpg',
    '180e7683b31119fe5e372edcb2673be9': 'assets/wordmark-cream.svg',
    '26c19d4192f17d853aae7c4f2cd39d85': 'assets/wordmark-green.svg',
    '6b7575ca47bf3cb57980503ea567bb10': 'assets/counter.jpg',
    '8fa87bf0280ddc6d70958400c13a767a': 'assets/iced-coffee.jpg',
    '9d167fd45658d101a5c46f34d84c3993': 'assets/mango-cheesecake.jpg',
    'cbe12c1da4c6581ed9e89c7c08e9a6a1': 'assets/motif-sand.svg',
    'cf3e70c0de50761053d88353688b5a86': 'assets/smores.jpg',
    'ed67cfafe78b2f6ba4611f02485a7892': 'assets/iced-black.jpg',
}

RIBBON = '''<div class="demo-badge" role="note"><i aria-hidden="true"></i><span class="db-long">عرض تجريبي وتخيّلي فقط</span><span class="db-short">عرض تجريبي</span></div>'''

NAV = '''<nav class="demo-nav" aria-label="تنقل العرض">
  <a href="index.html" class="demo-brand" dir="ltr"><span>P</span>menu</a>
  <a href="index.html">القصة</a>
  <a href="site.html">الموقع</a>
  <a href="Dashboard-Overview.html">لوحة التحكم</a>
  <a href="menus.html">منيو العميل</a>
</nav>'''


def out_name(src_name):
    return 'site.html' if src_name == 'Main.dc.html' else src_name.replace('.dc.html', '.html')


def rewrite(text):
    for blob, path in ASSETS.items():
        text = text.replace('/_blob/' + blob, path)
    text = text.replace('Main.dc.html', 'site.html')
    return re.sub(r'([A-Za-z][\w-]*)\.dc\.html', r'\1.html', text)


def parse(path):
    raw = rewrite(path.read_text())
    title = re.search(r'<title>(.*?)</title>', raw, re.S).group(1)
    helmet = re.search(r'<helmet>(.*?)</helmet>', raw, re.S).group(1)
    body = re.search(r'</helmet>(.*?)</x-dc>', raw, re.S).group(1)
    script = re.search(r'<script type="text/x-dc"[^>]*data-props=\'(.*?)\'>(.*?)</script>', raw, re.S)
    props, code = json.loads(script.group(1)), script.group(2)

    body = re.sub(r'<sc-for list="([^"]*)" as="([^"]*)"[^>]*>', r'<template data-for="\1" data-as="\2">', body)
    body = body.replace('</sc-for>', '</template>')
    body = re.sub(r'<sc-if value="([^"]*)"[^>]*>', r'<template data-if="\1">', body)
    body = body.replace('</sc-if>', '</template>')

    def dc_import(m):
        attrs = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(1)))
        name = attrs.pop('name')
        attrs.pop('hint-size', None)
        return "<div data-import=\"%s\" data-props='%s'></div>" % (name, json.dumps(attrs, ensure_ascii=False))

    body = re.sub(r'<dc-import([^>]*)></dc-import>', dc_import, body)
    imports = re.findall(r'data-import="([^"]+)"', body)
    return {'title': title, 'helmet': helmet, 'body': body, 'code': code, 'props': props, 'imports': imports}


def define(name, page):
    return "DC.define('%s', document.getElementById('tpl-%s'), (function () {\n%s\nreturn Component;\n})());" % (name, name, page['code'])


def build_page(src_path):
    page = parse(src_path)
    is_phone = page['props'].get('$preview', {}).get('width') == 390
    templates = ['<template id="tpl-main">%s</template>' % page['body']]
    defines = []
    for name in dict.fromkeys(page['imports']):
        child = parse(SRC / (name + '.dc.html'))
        templates.append('<template id="tpl-%s">%s</template>' % (name, child['body']))
        defines.append(define(name, child))
    defines.append(define('main', page))
    html = '''<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>%(title)s</title>
<link rel="icon" href="assets/favicon.svg">
%(helmet)s
<link rel="stylesheet" href="css/demo.css">
</head>
<body class="%(cls)s">
%(templates)s
%(ribbon)s
<div id="app"></div>
%(nav)s
<script src="js/morphdom.min.js"></script>
<script src="js/dc.js"></script>
<script>
%(defines)s
DC.mount('main', document.getElementById('app'));
</script>
</body>
</html>
''' % {
        'title': page['title'], 'helmet': page['helmet'].strip(), 'cls': 'is-phone' if is_phone else 'is-page',
        'templates': '\n'.join(templates), 'nav': NAV, 'ribbon': RIBBON, 'defines': '\n'.join(defines),
    }
    (ROOT / out_name(src_path.name)).write_text(html)
    return out_name(src_path.name)


if __name__ == '__main__':
    for p in sorted(SRC.glob('*.dc.html')):
        if p.name != 'Sidebar.dc.html':
            print('built', build_page(p))
