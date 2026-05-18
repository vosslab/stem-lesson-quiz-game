#!/usr/bin/env python3
"""Convert data/stems_all.yaml into data/stems_bundle.json for the game build.

The browser fetches stems_bundle.json at runtime. Generated, not hand-edited.
"""

# Standard Library
import os
import sys
import json
import argparse
import subprocess

# PIP3 modules
import yaml


#============================================
def parse_args():
	"""Parse command-line arguments."""
	parser = argparse.ArgumentParser(description=__doc__)
	parser.add_argument(
		'-i', '--input', dest='input_file',
		default='data/stems_all.yaml',
		help='Input YAML path (default: data/stems_all.yaml)',
	)
	parser.add_argument(
		'-o', '--output', dest='output_file',
		default='data/stems_bundle.json',
		help='Output JSON path (default: data/stems_bundle.json)',
	)
	args = parser.parse_args()
	return args


#============================================
def get_repo_root():
	"""Return the git repo root."""
	result = subprocess.run(
		['git', 'rev-parse', '--show-toplevel'],
		capture_output=True, text=True, check=True,
	)
	root = result.stdout.strip()
	return root


#============================================
def load_yaml(path):
	"""Load a YAML file and return its parsed contents."""
	with open(path, 'r', encoding='ascii') as handle:
		data = yaml.safe_load(handle)
	return data


#============================================
def write_json(data, path):
	"""Write data to path as compact JSON (one line per stem entry)."""
	parent = os.path.dirname(path)
	if parent and not os.path.isdir(parent):
		os.makedirs(parent)
	with open(path, 'w', encoding='ascii') as handle:
		json.dump(data, handle, ensure_ascii=True, indent=2)
		handle.write('\n')


#============================================
def main():
	args = parse_args()
	repo_root = get_repo_root()
	input_path = os.path.join(repo_root, args.input_file)
	output_path = os.path.join(repo_root, args.output_file)
	data = load_yaml(input_path)
	lesson_count = len(data['lessons'])
	stem_count = sum(len(lesson['stems']) for lesson in data['lessons'])
	if lesson_count != 20:
		raise ValueError(f"Expected 20 lessons, got {lesson_count}")
	if stem_count != 140:
		raise ValueError(f"Expected 140 stems, got {stem_count}")
	write_json(data, output_path)
	sys.stdout.write(
		f"Wrote {output_path}: {lesson_count} lessons, {stem_count} stems\n"
	)


if __name__ == '__main__':
	main()
