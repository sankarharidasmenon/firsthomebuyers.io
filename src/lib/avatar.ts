/**
 * Dummy avatar helper (POC only).
 *
 * Infers a likely gender from a first name and ALWAYS returns a matching
 * placeholder portrait (Unsplash). Recognised names use the dictionary; unknown
 * names fall back to a lightweight suffix heuristic, then to a stable hash — so
 * a photo is always shown.
 *
 * TODO: replace with real user-uploaded avatars.
 */

// Curated common first names (English + Indian, lowercased).
const FEMALE_NAMES = new Set([
  'sarah', 'emma', 'olivia', 'sophia', 'ava', 'isabella', 'mia', 'charlotte',
  'amelia', 'harper', 'evelyn', 'abigail', 'emily', 'ella', 'grace', 'chloe',
  'lily', 'zoe', 'hannah', 'lucy', 'ruby', 'jessica', 'lauren', 'megan',
  'rachel', 'anna', 'maria', 'laura', 'kate', 'katie', 'sophie', 'jasmine',
  'lekha', 'priya', 'anjali', 'aisha', 'diya', 'neha', 'pooja', 'divya',
  'sneha', 'kavya', 'ananya', 'meera', 'riya', 'shreya', 'nisha', 'deepa',
  'sunita', 'geeta', 'radha', 'lakshmi', 'sita', 'aarti', 'swati', 'rekha',
]);

const MALE_NAMES = new Set([
  'james', 'john', 'robert', 'michael', 'william', 'david', 'daniel', 'matthew',
  'joseph', 'thomas', 'charles', 'liam', 'noah', 'oliver', 'ethan', 'lucas',
  'mason', 'logan', 'jack', 'harry', 'george', 'jacob', 'ryan', 'luke',
  'adam', 'ben', 'sam', 'tom', 'alex', 'chris', 'nathan', 'montu',
  'raj', 'amit', 'rahul', 'arjun', 'vikram', 'rohan', 'aditya', 'karan',
  'sanjay', 'vijay', 'anil', 'suresh', 'ramesh', 'deepak', 'manoj', 'nikhil',
  'ravi', 'kiran', 'akash', 'varun', 'ashok', 'gaurav', 'sachin', 'rohit',
]);

// Stable, curated Unsplash portrait photos (square crops applied via params).
const PHOTO_PARAMS = 'auto=format&fit=crop&w=200&h=200&q=80';
const FEMALE_PHOTOS = [
  'photo-1494790108377-be9c29b29330',
  'photo-1438761681033-6461ffad8d80',
  'photo-1544005313-94ddf0286df2',
  'photo-1517841905240-472988babdf9',
  'photo-1489424731084-a5d8b219a5bb',
];
const MALE_PHOTOS = [
  'photo-1500648767791-00dcc994a43e',
  'photo-1507003211169-0a1dd7228f2d',
  'photo-1506794778202-cad84cf45f1d',
  'photo-1633332755192-727a05c4013d',
  'photo-1519085360753-af0119f7cbe7',
];

export type Gender = 'male' | 'female';

function firstNameOf(name?: string | null): string {
  return (name ?? '').trim().split(/\s+/)[0].toLowerCase();
}

// Stable non-negative hash from a string.
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

/** Best-effort gender guess. Always returns a value (dictionary → suffix → hash). */
export function guessGender(name?: string | null): Gender {
  const first = firstNameOf(name);
  if (!first) return 'female';
  if (FEMALE_NAMES.has(first)) return 'female';
  if (MALE_NAMES.has(first)) return 'male';
  // Suffix heuristic — many female given names end in these vowels.
  if (/(a|i|e|ya|ia|isha|ika)$/.test(first)) return 'female';
  // Deterministic fallback so the same name always resolves the same way.
  return hash(first) % 2 === 0 ? 'male' : 'female';
}

/** A gender-appropriate dummy portrait URL (always returns a photo). */
export function dummyAvatarUrl(name?: string | null): string {
  const gender = guessGender(name);
  const pool = gender === 'female' ? FEMALE_PHOTOS : MALE_PHOTOS;
  const id = pool[hash(firstNameOf(name) || 'x') % pool.length];
  return `https://images.unsplash.com/${id}?${PHOTO_PARAMS}`;
}
