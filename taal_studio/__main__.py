"""taal-studio: serve the app locally and open it in the browser."""
import argparse
import logging
import sys
import threading
import webbrowser

from werkzeug.serving import make_server

from . import __version__
from .app import create_app, default_data_dir


def main(argv=None):
    ap = argparse.ArgumentParser(prog='taal-studio', description='Serve Taal Studio locally and open it in the browser.')
    ap.add_argument('--port', type=int, default=3000, help='port (default: %(default)s)')
    ap.add_argument('--host', default='127.0.0.1',
                    help='address to listen on (default: %(default)s, this computer only)')
    ap.add_argument('--data-dir', help=f'where compositions, presets and sargam lines are saved (default: {default_data_dir()})')
    ap.add_argument('--no-browser', action='store_true', help="don't open the browser")
    ap.add_argument('--version', action='version', version=f'%(prog)s {__version__}')
    args = ap.parse_args(argv)

    app = create_app(args.data_dir)
    # A local app for one person: Werkzeug's threaded server, without its
    # development-server banner and per-request log.
    logging.getLogger('werkzeug').setLevel(logging.ERROR)
    try:
        server = make_server(args.host, args.port, app, threaded=True)
    except OSError as e:
        sys.exit(f"Can't listen on port {args.port} ({e.strerror}); try --port with another number.")
    url = f'http://localhost:{args.port}/'
    print(f'Taal Studio on {url}  (Ctrl+C to stop)')
    print(f'Saving to {app.config["DATA_DIR"]}', flush=True)
    if not args.no_browser:
        threading.Timer(1.0, webbrowser.open, (url,)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
