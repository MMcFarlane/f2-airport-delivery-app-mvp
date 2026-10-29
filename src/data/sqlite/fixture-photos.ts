/** Stock photo search words for each fixture dish, by menu item id. The photo's key is `fixture-{id}`. */
export const FIXTURE_PHOTO_QUERIES: Record<string, string> = {
  'double-smash-burger': 'double smash burger',
  'crispy-chicken-sandwich': 'fried chicken sandwich',
  'classic-cheeseburger': 'cheeseburger',
  'loaded-fries': 'loaded fries cheese',
  'smoked-brisket-platter': 'smoked brisket platter',
  'cold-brew-croissant': 'cold brew coffee croissant',
  'acai-bowl': 'acai bowl',
  'chicken-tinga-tacos': 'chicken tacos',
  'spicy-tuna-poke-bowl': 'tuna poke bowl',
  'wood-fired-pizza': 'wood fired pizza',
  'pre-flight-combo': 'burger fries soda',
  'breakfast-for-two': 'breakfast pastries coffee',
  'carry-on-snack-pack': 'snack box cheese crackers fruit',
  'taco-duo': 'tacos agua fresca',
  'wings-draft': 'chicken wings beer',
};

export function fixtureImageKey(itemId: string): string {
  return `fixture-${itemId}`;
}
