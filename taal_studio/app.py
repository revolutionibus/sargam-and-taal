"""The Flask app: serves the site and lets it save its JSON files.

Same behaviour as server.py: static files, plus PUT /compositions.json (and
the others in FILES), which replaces that file. Here the files live in a
data folder outside the package, filled from the bundled copies on first run.
Sound samples put in <data dir>/sounds are served before the shipped ones.
"""
import json
import os
import shutil
from pathlib import Path

from flask import Flask, abort, request, send_from_directory

# Writable file -> the list it must hold.
FILES = {'compositions.json': 'custom', 'presets.json': 'presets',
         'sargam-lines.json': 'sargamLines'}
MAX_BYTES = 32 << 20   # room for a few thousand imported sargam lines

HERE = Path(__file__).resolve().parent


def web_dir():
    """The site: taal_studio/web when installed, the repo's public/ from source."""
    shipped = HERE / 'web'
    return shipped if shipped.is_dir() else HERE.parent / 'public'


def default_data_dir():
    """$TAAL_STUDIO_DATA, or ~/.taal-studio."""
    return Path(os.environ.get('TAAL_STUDIO_DATA') or Path.home() / '.taal-studio')


def seed_data(data, web):
    """Copy the bundled JSON files into the data folder where they're missing."""
    data.mkdir(parents=True, exist_ok=True)
    for name in FILES:
        if not (data / name).exists() and (web / name).exists():
            shutil.copyfile(web / name, data / name)


def create_app(data_dir=None):
    web = web_dir()
    data = Path(data_dir) if data_dir else default_data_dir()
    seed_data(data, web)
    app = Flask(__name__, static_folder=None)
    app.config['MAX_CONTENT_LENGTH'] = MAX_BYTES
    app.config['DATA_DIR'] = data

    @app.get('/')
    def index():
        return site('index.html')

    @app.get('/<path:path>')
    def site(path):
        if path in FILES:
            if not (data / path).exists():
                abort(404)        # the app then creates it from the browser's copy
            res = send_from_directory(data, path, max_age=0)
            res.headers['Cache-Control'] = 'no-store'
            return res
        # Samples in <data dir>/sounds (your own copies) come before the shipped ones.
        own = path.startswith('sounds/') and (data / path).is_file()
        res = send_from_directory(data if own else web, path, max_age=0)
        # Revalidate app files on every load, so the browser never mixes a
        # cached old script with a newer page after an update.
        res.headers['Cache-Control'] = 'no-cache'
        return res

    @app.put('/<name>')
    def put(name):
        if name not in FILES:
            abort(405)
        try:
            body = json.loads(request.get_data() or b'null')
            if not isinstance(body, dict) or not isinstance(body.get(FILES[name]), list):
                raise ValueError(FILES[name] + ' must be a list')
        except ValueError as e:
            return str(e), 400
        # Write to a temp file and rename, so a failed write never leaves half a file.
        path = data / name
        tmp = path.with_suffix('.json.tmp')
        with open(tmp, 'w', encoding='utf-8') as f:
            json.dump(body, f, indent=2, ensure_ascii=False)
            f.write('\n')
        os.replace(tmp, path)
        return '', 204

    return app
