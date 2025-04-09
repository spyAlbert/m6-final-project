import loadDictionary from 'dictionary-en';
import nspell from 'nspell';

const inputWords = process.argv.slice(2);

loadDictionary((err, dict) => {
  if (err) {
    console.error("Failed to load dictionary:", err);
    process.exit(1);
  }

  const spell = nspell(dict);

  const corrected = inputWords.map(word => {
    if (!spell.correct(word)) {
      const suggestions = spell.suggest(word);
      return suggestions.length > 0 ? suggestions[0] : word;
    }
    return word;
  });

  console.log(corrected.join(' '));
});