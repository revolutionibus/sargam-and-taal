"""Taal Studio: a taal, lehra and sargam practice app, served locally with Flask.

    taal-studio                 # serve on http://localhost:3000 and open the browser
    taal-studio --help

The site itself is the `public/` folder of the repository, shipped in the
package as `taal_studio/web`. Saved compositions, presets and sargam lines
live in a per-user folder (see app.default_data_dir).
"""
__version__ = '0.1.0'

from .app import create_app  # noqa: E402,F401
