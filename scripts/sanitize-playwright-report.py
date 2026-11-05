"""Remove local home-directory paths from a Playwright HTML report before sharing."""
import base64
import io
import json
from pathlib import Path
import re
import zipfile

report = Path('playwright-report/index.html')
html = report.read_text(encoding='utf-8')
match = re.search(r'data:application/zip;base64,([A-Za-z0-9+/=]+)', html)
if not match:
    raise SystemExit('Relatório HTML do Playwright não encontrado ou formato inesperado.')

home = str(Path.home())
variants = {home, home.replace('\\', '/')}
encoded = [(json.dumps(value, ensure_ascii=False)[1:-1].encode(), b'<HOME>') for value in variants]
source = zipfile.ZipFile(io.BytesIO(base64.b64decode(match.group(1))))
output = io.BytesIO()
count = 0
with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED) as result:
    for item in source.infolist():
        data = source.read(item.filename)
        if item.filename.endswith('.json'):
            for original, replacement in encoded:
                count += data.count(original)
                data = data.replace(original, replacement)
            json.loads(data)
        result.writestr(item, data)
with zipfile.ZipFile(io.BytesIO(output.getvalue())) as check:
    if check.testzip() is not None:
        raise SystemExit('O relatório recompactado é inválido.')
updated = base64.b64encode(output.getvalue()).decode('ascii')
report.write_text(html[:match.start(1)] + updated + html[match.end(1):], encoding='utf-8')
print(f'Relatório validado; {count} caminhos locais removidos.')
