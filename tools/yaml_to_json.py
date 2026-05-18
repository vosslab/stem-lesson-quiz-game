#!/usr/bin/env python3
"""Convert data/stems/lesson_NN.yaml files into data/stems_bundle.json AND
data/stems_all.yaml for the game build.

Source of truth: data/stems/lesson_NN.yaml (one file per lesson). Both
stems_all.yaml and stems_bundle.json are regenerated from those files,
which keeps any hand-edit applied to a single lesson from drifting out of
the combined artifacts. The browser fetches stems_bundle.json at runtime.
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
		'-i', '--input-dir', dest='input_dir',
		default='data/stems',
		help='Input directory of lesson_NN.yaml files (default: data/stems)',
	)
	parser.add_argument(
		'-o', '--output', dest='output_file',
		default='data/stems_bundle.json',
		help='Output JSON path (default: data/stems_bundle.json)',
	)
	parser.add_argument(
		'--all-yaml', dest='all_yaml_file',
		default='data/stems_all.yaml',
		help='Combined YAML output path (default: data/stems_all.yaml)',
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
def write_yaml(data, path):
	"""Write data to path as YAML."""
	parent = os.path.dirname(path)
	if parent and not os.path.isdir(parent):
		os.makedirs(parent)
	with open(path, 'w', encoding='ascii') as handle:
		yaml.safe_dump(
			data, handle,
			sort_keys=False, default_flow_style=False, allow_unicode=False,
		)


#============================================
def load_lessons(input_dir):
	"""Read every lesson_NN.yaml from input_dir in lesson-number order."""
	lessons = []
	for i in range(1, 21):
		path = os.path.join(input_dir, f'lesson_{i:02d}.yaml')
		if not os.path.exists(path):
			raise FileNotFoundError(f"Missing lesson file: {path}")
		data = load_yaml(path)
		if data['lesson'] != i:
			raise ValueError(
				f"{path}: lesson field {data['lesson']} does not match filename number {i}"
			)
		lessons.append(data)
	return lessons


#============================================
def main():
	args = parse_args()
	repo_root = get_repo_root()
	input_dir = os.path.join(repo_root, args.input_dir)
	output_path = os.path.join(repo_root, args.output_file)
	all_yaml_path = os.path.join(repo_root, args.all_yaml_file)
	lessons = load_lessons(input_dir)
	stem_count = sum(len(lesson['stems']) for lesson in lessons)
	if len(lessons) != 20:
		raise ValueError(f"Expected 20 lessons, got {len(lessons)}")
	if stem_count != 140:
		raise ValueError(f"Expected 140 stems, got {stem_count}")
	bundle = {'lessons': lessons}
	write_yaml(bundle, all_yaml_path)
	write_json(bundle, output_path)
	sys.stdout.write(
		f"Wrote {all_yaml_path} and {output_path}: "
		f"{len(lessons)} lessons, {stem_count} stems\n"
	)


if __name__ == '__main__':
	main()
