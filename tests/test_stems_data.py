"""
Validation tests for extracted STEM word definition YAML data.

Tests schema correctness, row counts, ASCII compliance, and corpus totals.
"""

import os
import pytest
import yaml

import git_file_utils

REPO_ROOT = git_file_utils.get_repo_root()
STEMS_DIR = os.path.join(REPO_ROOT, 'data', 'stems')

#============================================

def get_lesson_files():
	"""
	Get list of lesson YAML files in sorted order.
	"""
	files = []
	for i in range(1, 21):
		filename = os.path.join(STEMS_DIR, f'lesson_{i:02d}.yaml')
		if os.path.exists(filename):
			files.append(filename)
	return files

#============================================

def test_lesson_files_count():
	"""
	Verify exactly 20 lesson YAML files exist.
	"""
	files = get_lesson_files()
	assert len(files) == 20, f"Expected 20 lesson files, got {len(files)}"

#============================================

@pytest.mark.parametrize('lesson_file', get_lesson_files())
def test_lesson_schema(lesson_file):
	"""
	Verify each lesson YAML has correct schema and data types.

	Parametrized over all 20 lesson files.
	"""
	with open(lesson_file) as f:
		data = yaml.safe_load(f)

	lesson_name = os.path.basename(lesson_file)

	assert isinstance(data, dict), f"{lesson_name}: root is not a dict"
	assert 'lesson' in data, f"{lesson_name}: missing 'lesson' field"
	assert 'stems' in data, f"{lesson_name}: missing 'stems' field"

	lesson_num = data['lesson']
	expected_num = int(lesson_name.split('_')[1].split('.')[0])
	assert lesson_num == expected_num, \
		f"{lesson_name}: lesson number {lesson_num} does not match filename number {expected_num}"

	stems = data['stems']
	assert isinstance(stems, list), f"{lesson_name}: 'stems' is not a list"
	assert len(stems) == 7, f"{lesson_name}: expected 7 stems, got {len(stems)}"

#============================================

@pytest.mark.parametrize('lesson_file', get_lesson_files())
def test_stem_fields(lesson_file):
	"""
	Verify each stem has 4 non-empty string fields.

	Parametrized over all 20 lesson files.
	"""
	with open(lesson_file) as f:
		data = yaml.safe_load(f)

	lesson_name = os.path.basename(lesson_file)
	stems = data['stems']

	required_fields = ['stem', 'meaning', 'example_word', 'example_definition']

	for idx, stem in enumerate(stems):
		assert isinstance(stem, dict), \
			f"{lesson_name}: stem {idx} is not a dict"

		for field in required_fields:
			assert field in stem, \
				f"{lesson_name}: stem {idx} missing field '{field}'"
			value = stem[field]
			assert isinstance(value, str), \
				f"{lesson_name}: stem {idx} field '{field}' is not a string: {type(value)}"
			assert len(value) > 0, \
				f"{lesson_name}: stem {idx} field '{field}' is empty"

#============================================

@pytest.mark.parametrize('lesson_file', get_lesson_files())
def test_ascii_only(lesson_file):
	"""
	Verify all cell values are ASCII-only (no UTF-8).
	"""
	with open(lesson_file) as f:
		data = yaml.safe_load(f)

	lesson_name = os.path.basename(lesson_file)
	stems = data['stems']

	for idx, stem in enumerate(stems):
		for field, value in stem.items():
			if isinstance(value, str):
				assert value.isascii(), \
					f"{lesson_name}: stem {idx} field '{field}' contains non-ASCII: {repr(value)}"

#============================================

@pytest.mark.parametrize('lesson_file', get_lesson_files())
def test_no_header_leak(lesson_file):
	"""
	Guard against header values leaking into data cells.

	Rejects any cell that starts with 'STEM' or 'EXAMPLE' (header tokens).
	"""
	with open(lesson_file) as f:
		data = yaml.safe_load(f)

	lesson_name = os.path.basename(lesson_file)
	stems = data['stems']

	header_starts = ('STEM', 'EXAMPLE', 'MEANING')

	for idx, stem in enumerate(stems):
		for field, value in stem.items():
			if isinstance(value, str):
				upper_value = value.upper()
				for header_token in header_starts:
					assert not upper_value.startswith(header_token), \
						f"{lesson_name}: stem {idx} field '{field}' starts with header token '{header_token}': {value}"

#============================================

def test_total_stems_count():
	"""
	Verify corpus total is exactly 140 stems.
	"""
	files = get_lesson_files()
	total = 0

	for lesson_file in files:
		with open(lesson_file) as f:
			data = yaml.safe_load(f)
		total += len(data['stems'])

	assert total == 140, f"Expected 140 total stems, got {total}"

#============================================

@pytest.mark.parametrize('lesson_file', get_lesson_files())
def test_field_length_sanity(lesson_file):
	"""
	Guard against swapped columns by checking length invariants per row.

	A real stem is a short word part (typically 2-12 chars).
	A real example word is a full word containing the stem (typically 5-20 chars).
	A real example definition is a phrase or sentence (typically 10+ chars).

	Invariants enforced:
	  - len(stem) < len(example_word)
	  - len(example_definition) >= len(example_word)
	  - len(example_definition) >= len(stem)

	Catches the lesson_15 row 7 class of bug where the source PDF has stem
	and example_word swapped (osteo / osteoarthritis).
	"""
	with open(lesson_file) as f:
		data = yaml.safe_load(f)

	lesson_name = os.path.basename(lesson_file)
	stems = data['stems']

	for idx, stem in enumerate(stems):
		s_len = len(stem['stem'])
		w_len = len(stem['example_word'])
		d_len = len(stem['example_definition'])
		assert s_len < w_len, (
			f"{lesson_name}: stem {idx} 'stem' is not shorter than 'example_word' "
			f"(stem={stem['stem']!r} len={s_len}; "
			f"example_word={stem['example_word']!r} len={w_len}) -- columns may be swapped"
		)
		assert d_len >= w_len, (
			f"{lesson_name}: stem {idx} 'example_definition' is shorter than 'example_word' "
			f"(definition={stem['example_definition']!r} len={d_len}; "
			f"example_word={stem['example_word']!r} len={w_len}) -- columns may be swapped"
		)
		assert d_len >= s_len, (
			f"{lesson_name}: stem {idx} 'example_definition' is shorter than 'stem' "
			f"(definition={stem['example_definition']!r} len={d_len}; "
			f"stem={stem['stem']!r} len={s_len})"
		)
