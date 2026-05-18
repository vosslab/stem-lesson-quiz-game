#!/usr/bin/env python3
"""Inline JS, CSS, and stems bundle JSON into a single portable HTML file.

Replaces the external <link rel="stylesheet"> tag with an inline <style>
block, replaces the external <script type="module"> tag with an inline
<script>, and injects window.__STEMS_BUNDLE__ in the head so data_loader.ts
can read the bundle without a fetch() (file:// fetch is blocked).
"""

# Standard Library
import argparse


#============================================
def parse_args():
	"""Parse command-line arguments."""
	parser = argparse.ArgumentParser(description=__doc__)
	parser.add_argument('--index', dest='index_path', required=True)
	parser.add_argument('--style', dest='style_path', required=True)
	parser.add_argument('--app', dest='app_path', required=True)
	parser.add_argument('--bundle', dest='bundle_path', required=True)
	parser.add_argument('--output', dest='output_path', required=True)
	args = parser.parse_args()
	return args


#============================================
def read_file(path):
	"""Read a file and return its contents."""
	with open(path, 'r', encoding='utf-8') as handle:
		text = handle.read()
	return text


#============================================
def inline(index_html, style_css, app_js, bundle_json):
	"""Replace external tags with inline content + bundle global."""
	# Inject __STEMS_BUNDLE__ as the first thing inside <head>.
	bundle_script = (
		'<script>window.__STEMS_BUNDLE__ = '
		+ bundle_json.strip()
		+ ';</script>'
	)
	html = index_html.replace('<head>', '<head>' + bundle_script, 1)
	# Inline stylesheet.
	style_block = '<style>\n' + style_css + '\n</style>'
	html = html.replace(
		'<link rel="stylesheet" href="style.css">',
		style_block,
		1,
	)
	# Inline script (module -> IIFE, no type=module).
	script_block = '<script>\n' + app_js + '\n</script>'
	html = html.replace(
		'<script type="module" src="main.js"></script>',
		script_block,
		1,
	)
	return html


#============================================
def main():
	args = parse_args()
	index_html = read_file(args.index_path)
	style_css = read_file(args.style_path)
	app_js = read_file(args.app_path)
	bundle_json = read_file(args.bundle_path)
	html = inline(index_html, style_css, app_js, bundle_json)
	with open(args.output_path, 'w', encoding='utf-8') as handle:
		handle.write(html)


if __name__ == '__main__':
	main()
