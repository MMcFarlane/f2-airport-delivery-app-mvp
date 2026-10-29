/**
 * Demo menus for Places restaurants. Places has no menus, so each restaurant gets four dishes from its
 * cuisine group. The four slots keep the same price, prep time, and flags in every group, so the delivery
 * window always has a quick item, a standard plate, one long prep that misses a tight connection, and a bundle.
 * Each dish names a bundled stock photo by `imageKey` (`{group}-{slot}`).
 */

export const MENU_SLOTS = [
  {
    slug: 'quick',
    priceCents: 900,
    prepMinutes: 8,
    imageColor: '#F2B36B',
    featured: true,
    popular: true,
    kind: 'item' as const,
    badge: null,
    compareAtCents: null,
  },
  {
    slug: 'plate',
    priceCents: 1400,
    prepMinutes: 14,
    imageColor: '#E7C48A',
    featured: false,
    popular: true,
    kind: 'item' as const,
    badge: null,
    compareAtCents: null,
  },
  {
    slug: 'roast',
    priceCents: 2100,
    prepMinutes: 48,
    imageColor: '#D4B08A',
    featured: false,
    popular: false,
    kind: 'item' as const,
    badge: null,
    compareAtCents: null,
  },
  {
    slug: 'bundle',
    priceCents: 1600,
    prepMinutes: 12,
    imageColor: '#A8C48A',
    featured: false,
    popular: false,
    kind: 'special' as const,
    badge: 'BUNDLE',
    compareAtCents: 1900,
  },
] as const;

export type MenuSlug = (typeof MENU_SLOTS)[number]['slug'];

export type Dish = {
  name: string;
  description: string;
  /** Menu tab. Bundles have none. Browse hub categories also read it ("coffee", "burger", "bowl", "beer"). */
  category: string | null;
  tags: string[];
  /** Words for the stock photo search in scripts/fetch-food-photos.ts. */
  photoQuery: string;
};

export type CuisineGroup = {
  id: string;
  primaryTypes: readonly string[];
  dishes: Record<MenuSlug, Dish>;
};

function dish(name: string, description: string, category: string | null, photoQuery: string, tags: string[] = []): Dish {
  return { name, description, category, tags, photoQuery };
}

const BUNDLE_TAGS = ['Combos'];
const BREAKFAST_TAGS = ['Breakfast'];

export const CUISINE_GROUPS: readonly CuisineGroup[] = [
  {
    id: 'burgers',
    primaryTypes: ['hamburger_restaurant', 'fast_food_restaurant'],
    dishes: {
      quick: dish('Cheeseburger', 'Single patty, American cheese, pickles, and onion.', 'Burgers', 'cheeseburger'),
      plate: dish('Double smash burger', 'Two smashed patties, melted cheese, and house sauce.', 'Burgers', 'double smash burger'),
      roast: dish('Bacon burger platter', 'Half-pound burger with bacon and cheddar, cooked to order, with fries.', 'Burgers', 'bacon burger fries plate'),
      bundle: dish('Burger + fries combo', 'A cheeseburger, fries, and a drink, packed together.', null, 'burger fries soda', BUNDLE_TAGS),
    },
  },
  {
    id: 'chicken',
    primaryTypes: ['chicken_restaurant', 'chicken_wings_restaurant'],
    dishes: {
      quick: dish('Chicken tenders', 'Three crispy tenders with honey mustard.', 'Chicken', 'chicken tenders'),
      plate: dish('Crispy chicken sandwich', 'Fried chicken breast, pickles, and mayo on a toasted bun.', 'Sandwiches', 'fried chicken sandwich'),
      roast: dish('Fried chicken dinner', 'Bone-in fried chicken with two sides and a biscuit, fried to order.', 'Chicken', 'fried chicken dinner plate'),
      bundle: dish('Wings + fries bundle', 'Eight wings, fries, and a drink, packed together.', null, 'chicken wings fries', BUNDLE_TAGS),
    },
  },
  {
    id: 'pizza',
    primaryTypes: ['pizza_restaurant', 'italian_restaurant'],
    dishes: {
      quick: dish('Pepperoni slice', 'A large New York slice, reheated in the oven.', 'Pizza', 'pepperoni pizza slice'),
      plate: dish('Margherita pizza', 'Personal pie with tomato, mozzarella, and basil.', 'Pizza', 'margherita pizza'),
      roast: dish('Baked lasagna', 'Layered beef lasagna, baked to order.', 'Pasta', 'lasagna'),
      bundle: dish('Slice + soda bundle', 'Two slices and a fountain drink, packed together.', null, 'pizza slices soda', BUNDLE_TAGS),
    },
  },
  {
    id: 'mexican',
    primaryTypes: ['mexican_restaurant', 'meal_takeaway', 'latin_american_restaurant'],
    dishes: {
      quick: dish('Chicken tacos', 'Two soft tacos with salsa verde and onion.', 'Tacos', 'chicken tacos'),
      plate: dish('Burrito bowl', 'Rice, beans, grilled chicken, pico, and cheese.', 'Bowls', 'burrito bowl'),
      roast: dish('Carne asada platter', 'Grilled steak with rice, beans, and tortillas, cooked to order.', 'Plates', 'carne asada plate'),
      bundle: dish('Chips + guacamole bundle', 'Tortilla chips, guacamole, salsa, and a drink.', null, 'chips guacamole salsa', BUNDLE_TAGS),
    },
  },
  {
    id: 'asian',
    primaryTypes: [
      'chinese_restaurant',
      'asian_restaurant',
      'asian_fusion_restaurant',
      'japanese_restaurant',
      'sushi_restaurant',
      'thai_restaurant',
      'ramen_restaurant',
    ],
    dishes: {
      quick: dish('Vegetable spring rolls', 'Four crispy rolls with sweet chili sauce.', 'Starters', 'spring rolls'),
      plate: dish('Orange chicken with rice', 'Crispy chicken in orange glaze over steamed rice.', 'Plates', 'orange chicken rice'),
      roast: dish('Teriyaki salmon bento', 'Grilled salmon, rice, and vegetables, cooked to order.', 'Plates', 'salmon bento box'),
      bundle: dish('Noodles + dumplings bundle', 'Lo mein, four dumplings, and a drink.', null, 'noodles dumplings', BUNDLE_TAGS),
    },
  },
  {
    id: 'breakfast',
    primaryTypes: ['breakfast_restaurant', 'brunch_restaurant', 'bagel_shop', 'bakery', 'donut_shop', 'cake_shop', 'cafe'],
    dishes: {
      quick: dish('Bagel + cream cheese', 'A toasted everything bagel with cream cheese.', 'Pastry', 'bagel cream cheese', BREAKFAST_TAGS),
      plate: dish('Egg + cheese croissant', 'Scrambled egg and cheddar on a warm croissant.', 'Breakfast', 'egg croissant sandwich', BREAKFAST_TAGS),
      roast: dish('Pancake breakfast platter', 'Pancakes, eggs, and bacon, made to order.', 'Breakfast', 'pancakes eggs bacon', BREAKFAST_TAGS),
      bundle: dish('Coffee + pastry bundle', 'A drip coffee and a pastry of the day.', null, 'coffee pastry', [...BUNDLE_TAGS, ...BREAKFAST_TAGS]),
    },
  },
  {
    id: 'coffee',
    primaryTypes: ['coffee_shop', 'dessert_shop', 'ice_cream_shop', 'snack_bar', 'tea_house'],
    dishes: {
      quick: dish('Iced latte', 'Espresso and cold milk over ice.', 'Coffee', 'iced latte'),
      plate: dish('Breakfast sandwich', 'Egg, cheese, and bacon on an English muffin.', 'Pastry', 'breakfast sandwich coffee shop', BREAKFAST_TAGS),
      roast: dish('Coffee box for the team', 'Brewed coffee for ten with cups and cream, brewed to order.', 'Coffee', 'coffee carafe cups'),
      bundle: dish('Latte + muffin bundle', 'A hot latte and a blueberry muffin.', null, 'latte muffin', BUNDLE_TAGS),
    },
  },
  {
    id: 'sandwiches',
    primaryTypes: ['sandwich_shop', 'deli', 'hot_dog_restaurant', 'food_court'],
    dishes: {
      quick: dish('Turkey club sandwich', 'Turkey, bacon, lettuce, and tomato on toasted bread.', 'Sandwiches', 'turkey club sandwich'),
      plate: dish('Italian sub', 'Salami, ham, provolone, and peppers on a hoagie roll.', 'Sandwiches', 'italian sub sandwich'),
      roast: dish('Party sub platter', 'A sliced six-foot sub for the gate, built to order.', 'Sandwiches', 'sandwich platter'),
      bundle: dish('Sandwich + chips combo', 'A half sandwich, chips, and a drink.', null, 'sandwich chips', BUNDLE_TAGS),
    },
  },
  {
    id: 'healthy',
    primaryTypes: ['salad_shop', 'mediterranean_restaurant', 'juice_shop', 'vegan_restaurant', 'vegetarian_restaurant'],
    dishes: {
      quick: dish('Açaí bowl', 'Açaí, banana, berries, and granola.', 'Bowls', 'acai bowl'),
      plate: dish('Chicken grain bowl', 'Grilled chicken, quinoa, greens, and tahini.', 'Bowls', 'chicken grain bowl'),
      roast: dish('Mezze platter', 'Hummus, falafel, tabbouleh, and warm pita, made to order.', 'Plates', 'mezze platter hummus'),
      bundle: dish('Salad + smoothie bundle', 'A garden salad and a berry smoothie.', null, 'salad smoothie', BUNDLE_TAGS),
    },
  },
  {
    id: 'bar',
    primaryTypes: ['bar', 'brewpub', 'bar_and_grill', 'sports_bar', 'pub', 'wine_bar', 'cocktail_bar'],
    dishes: {
      quick: dish('Draft beer', 'A cold pint of the local draft.', 'Beer', 'draft beer pint'),
      plate: dish('Bar wings', 'Ten wings tossed in buffalo sauce with ranch.', 'Wings', 'buffalo wings'),
      roast: dish('Smoked brisket plate', 'Sliced brisket with two sides, smoked in house.', 'Plates', 'smoked brisket plate'),
      bundle: dish('Wings + draft bundle', 'Six wings and a pint, packed to go.', null, 'wings beer', BUNDLE_TAGS),
    },
  },
  {
    id: 'seafood',
    primaryTypes: ['seafood_restaurant'],
    dishes: {
      quick: dish('Crab cake slider', 'A lump crab cake on a brioche bun.', 'Seafood', 'crab cake slider'),
      plate: dish('Fish tacos', 'Grilled fish, cabbage slaw, and lime crema.', 'Seafood', 'fish tacos'),
      roast: dish('Low country boil', 'Shrimp, sausage, corn, and potatoes, boiled to order.', 'Seafood', 'shrimp boil'),
      bundle: dish('Shrimp basket bundle', 'Fried shrimp, fries, and a drink.', null, 'fried shrimp basket', BUNDLE_TAGS),
    },
  },
  {
    id: 'barbecue',
    primaryTypes: ['barbecue_restaurant', 'steak_house'],
    dishes: {
      quick: dish('Pulled pork slider', 'Smoked pulled pork with slaw on a slider bun.', 'Sandwiches', 'pulled pork slider'),
      plate: dish('Brisket sandwich', 'Sliced brisket and pickles on Texas toast.', 'Sandwiches', 'brisket sandwich'),
      roast: dish('Smoked rib platter', 'A half rack of ribs with two sides, finished to order.', 'Plates', 'bbq ribs'),
      bundle: dish('BBQ plate + sweet tea', 'Pulled pork, one side, and a sweet tea.', null, 'bbq plate sweet tea', BUNDLE_TAGS),
    },
  },
  {
    id: 'grill',
    primaryTypes: [],
    dishes: {
      quick: dish('Chicken Caesar wrap', 'Grilled chicken, romaine, and parmesan in a flour wrap.', 'Wraps', 'chicken caesar wrap'),
      plate: dish('Grilled chicken plate', 'Grilled chicken breast with rice and vegetables.', 'Plates', 'grilled chicken plate'),
      roast: dish('Slow-roasted half chicken', 'Herb-roasted half chicken with two sides.', 'Plates', 'roasted half chicken'),
      bundle: dish('Wrap + side bundle', 'A wrap, a side salad, and a drink.', null, 'wrap salad drink', BUNDLE_TAGS),
    },
  },
];

/** `grill` covers "restaurant", "american_restaurant", and anything without a closer match. */
export const DEFAULT_GROUP_ID = 'grill';

export function cuisineGroupFor(primaryType: string | null): CuisineGroup {
  const match = primaryType ? CUISINE_GROUPS.find((group) => group.primaryTypes.includes(primaryType)) : undefined;
  return match ?? CUISINE_GROUPS.find((group) => group.id === DEFAULT_GROUP_ID)!;
}

export function dishImageKey(groupId: string, slug: MenuSlug): string {
  return `${groupId}-${slug}`;
}
