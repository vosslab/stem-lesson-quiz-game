#!/usr/bin/env python3
"""
Extract STEM word definitions from PDF lessons into YAML format.

Reads Stems_Lesson_NN.pdf files, parses the 4-column table (STEM, MEANING,
EXAMPLE WORD, EXAMPLE WORD DEFINITION), normalizes UTF-8 to ASCII, and writes
per-lesson YAML files plus a combined corpus YAML.
"""

import argparse
import os
import re
import subprocess
import yaml

import unidecode

#============================================

def parse_args():
	"""
	Parse command-line arguments.
	"""
	parser = argparse.ArgumentParser(
		description="Extract STEM word definitions from PDF lessons into YAML"
	)
	parser.add_argument(
		'-i', '--input-dir',
		dest='input_dir',
		default='artifacts',
		help='Directory containing PDF files (default: artifacts)'
	)
	parser.add_argument(
		'-o', '--output-dir',
		dest='output_dir',
		default='data/stems',
		help='Output directory for YAML files (default: data/stems)'
	)
	args = parser.parse_args()
	return args

#============================================

def parse_pdf(pdf_path: str) -> dict:
	"""
	Extract text from PDF and parse into lesson data.

	Args:
		pdf_path: Path to the PDF file

	Returns:
		Dictionary with lesson number and list of stems

	Raises:
		ValueError: If PDF format does not match expected structure
	"""
	result = subprocess.run(
		['pdftotext', pdf_path, '-'],
		capture_output=True,
		text=True,
		check=True
	)
	text = result.stdout
	return parse_blocks(text, pdf_path)

#============================================

def parse_blocks(text: str, pdf_path: str) -> dict:
	"""
	Parse the text blocks extracted from PDF.

	Splits on blank lines, validates header structure, extracts 7 rows of stems.

	Args:
		text: Raw text from pdftotext
		pdf_path: Original PDF path (for error messages)

	Returns:
		Dictionary with lesson number and list of stems

	Raises:
		ValueError: If structure does not match expected format
	"""
	blocks = re.split(r'\n\n+', text)
	blocks = [b.strip() for b in blocks if b.strip()]

	if not blocks:
		raise ValueError(f"{pdf_path}: No content found in PDF")

	first_block = blocks[0]
	match = re.match(r'^STEMS LESSON (\d+)\nSTEM$', first_block)
	if not match:
		raise ValueError(f"{pdf_path}: First block does not match expected title+header pattern: {repr(first_block[:80])}")

	lesson_number = int(match.group(1))

	expected_headers = [
		'MEANING',
		'EXAMPLE\nWORD',
		'EXAMPLE WORD\nDEFINITION'
	]

	if len(blocks) < 4:
		raise ValueError(f"{pdf_path}: Lesson {lesson_number}: expected at least 4 blocks (title+stem + 3 headers), got {len(blocks)}")

	for i, expected in enumerate(expected_headers):
		actual = blocks[i + 1]
		if actual != expected:
			raise ValueError(
				f"{pdf_path}: Lesson {lesson_number}: header mismatch at index {i+1}. "
				f"Expected {repr(expected)}, got {repr(actual)}"
			)

	data_blocks = blocks[4:]
	if len(data_blocks) != 28:
		raise ValueError(
			f"{pdf_path}: Lesson {lesson_number}: expected 28 data cells (7 rows × 4 cols), "
			f"got {len(data_blocks)}"
		)

	stems = []
	for row_idx in range(7):
		start_idx = row_idx * 4
		stem_val = data_blocks[start_idx]
		meaning_val = data_blocks[start_idx + 1]
		example_word_val = data_blocks[start_idx + 2]
		example_def_val = data_blocks[start_idx + 3]

		stem_val = normalize_cell(stem_val)
		meaning_val = normalize_cell(meaning_val)
		example_word_val = normalize_cell(example_word_val)
		example_def_val = normalize_cell(example_def_val)

		stems.append({
			'stem': stem_val,
			'meaning': meaning_val,
			'example_word': example_word_val,
			'example_definition': example_def_val
		})

	return {
		'lesson': lesson_number,
		'stems': stems
	}

#============================================

def normalize_cell(cell_text: str) -> str:
	"""
	Normalize cell text: collapse whitespace, convert UTF-8 to ASCII.

	Args:
		cell_text: Raw cell text (may contain newlines and UTF-8)

	Returns:
		Normalized ASCII string
	"""
	normalized = ' '.join(cell_text.split())
	ascii_text = unidecode.unidecode(normalized)
	return ascii_text

#============================================

def write_lesson_yaml(output_dir: str, lesson_data: dict) -> None:
	"""
	Write a single lesson YAML file.

	Args:
		output_dir: Directory to write YAML files to
		lesson_data: Dictionary with lesson number and stems list
	"""
	lesson_num = lesson_data['lesson']
	filename = os.path.join(output_dir, f'lesson_{lesson_num:02d}.yaml')

	with open(filename, 'w') as f:
		yaml.safe_dump(
			lesson_data,
			f,
			sort_keys=False,
			default_flow_style=False,
			allow_unicode=False
		)

#============================================

def write_combined_yaml(output_dir: str, all_lessons: list) -> None:
	"""
	Write combined YAML with all lessons.

	Args:
		output_dir: Directory to write YAML files to
		all_lessons: List of lesson dictionaries
	"""
	combined = {
		'lessons': all_lessons
	}
	filename = os.path.join(output_dir, '..', 'stems_all.yaml')

	with open(filename, 'w') as f:
		yaml.safe_dump(
			combined,
			f,
			sort_keys=False,
			default_flow_style=False,
			allow_unicode=False
		)

#============================================

def main():
	"""
	Main entry point: extract all lessons, validate, write YAML.
	"""
	args = parse_args()

	input_dir = args.input_dir
	output_dir = args.output_dir

	os.makedirs(output_dir, exist_ok=True)

	all_lessons = []
	total_stems = 0

	for lesson_num in range(1, 21):
		pdf_filename = f'Stems_Lesson_{lesson_num:02d}.pdf'
		pdf_path = os.path.join(input_dir, pdf_filename)

		if not os.path.exists(pdf_path):
			raise ValueError(f"PDF file not found: {pdf_path}")

		lesson_data = parse_pdf(pdf_path)
		write_lesson_yaml(output_dir, lesson_data)
		all_lessons.append(lesson_data)
		total_stems += len(lesson_data['stems'])

		print(f"Extracted {pdf_filename}: {len(lesson_data['stems'])} stems")

	write_combined_yaml(output_dir, all_lessons)

	if total_stems != 140:
		raise ValueError(
			f"Total stems count mismatch: expected 140, got {total_stems}"
		)

	print(f"\nSuccess: {len(all_lessons)} lessons, {total_stems} total stems")

#============================================

if __name__ == '__main__':
	main()
