import type { CoachSwapFigures } from './CoachSwapFigures';
import type { CoachSwapReplacement } from './CoachSwapReplacement';
import type { CoachSwapRow } from './CoachSwapRow';

/** Figures a time: calories, protein, carbohydrate and fat, and sodium where it is the replacement's known risk. */
const figures = (kcal: number, proteinG: number, carbsG: number, fatG: number, sodiumMg?: number): CoachSwapFigures => ({
  kcal,
  proteinG,
  carbsG,
  fatG,
  ...(sodiumMg === undefined ? {} : { sodiumMg }),
});

// The replacements more than one row offers, with how their figures add up.

/** 2 large eggs (100 g) 143 kcal, P 12.6, C 0.7, F 9.5; English muffin (57 g) 134, 5.1, 26, 1.0; cheddar slice (28 g) 113, 6.4, 0.9, 9.3. */
const eggsOnMuffin: CoachSwapReplacement = { words: 'two eggs on an English muffin with a slice of cheese', serving: figures(390, 24, 28, 20) };
const englishMuffin: CoachSwapReplacement = { words: 'an English muffin', serving: figures(134, 5, 26, 1) };
/** Chicken breast, roasted (100 g) 165 kcal, P 31, F 3.6; mixed vegetables, boiled (150 g) 98, 4.3, C 20, 0.2. */
const steamedChicken: CoachSwapReplacement = {
  words: 'steamed chicken with mixed vegetables, sauce on the side',
  serving: figures(265, 35, 20, 4),
};
/** Chicken breast, roasted (100 g); broccoli, boiled (1 cup, 156 g) 55 kcal, P 3.7, C 11, F 0.6. */
const chickenAndBroccoli: CoachSwapReplacement = { words: 'chicken and broccoli, sauce on the side', serving: figures(220, 35, 11, 4) };
/** Chicken breast, roasted (120 g): 198 kcal, P 37, F 4.3. */
const grilledChicken: CoachSwapReplacement = { words: 'a grilled chicken breast, sauce on the side', serving: figures(200, 37, 0, 4) };
/** Greek yogurt, plain, nonfat (170 g) 100 kcal, P 17.3, C 6.1, F 0.7; blueberries (74 g) 42, 0.5, 10.7, 0.2. */
const yogurtAndBerries: CoachSwapReplacement = { words: 'plain Greek yogurt with berries', serving: figures(140, 18, 17, 1) };
const yogurtCup: CoachSwapReplacement = { words: 'a cup of plain Greek yogurt', serving: figures(100, 17, 6, 1) };
/** A typical 60 g protein bar's label. */
const proteinBar: CoachSwapReplacement = { words: 'a protein bar', serving: figures(210, 20, 23, 7) };
/** Popcorn, air-popped (3 cups, 24 g): 93 kcal, P 3.1, C 18.7, F 1.1. */
const popcorn: CoachSwapReplacement = { words: 'three cups of air-popped popcorn', serving: figures(95, 3, 19, 1) };
/** Mixed greens, tomato and cucumber (2 cups) 35 kcal; Italian vinaigrette (1 tbsp, 15 g) 35 kcal, F 3. */
const sideSalad: CoachSwapReplacement = { words: 'a side salad, vinaigrette on the side', serving: figures(70, 2, 8, 3) };
/** Apple, medium (182 g): 95 kcal, P 0.5, C 25, F 0.3. */
const fruit: CoachSwapReplacement = { words: 'a piece of fruit', serving: figures(95, 0, 25, 0) };
/** Brewed coffee (16 fl oz) 5 kcal; 2% milk (60 g) 30 kcal, P 2, C 3, F 1.2. */
const coldBrew: CoachSwapReplacement = { words: 'a cold brew with a splash of milk', serving: figures(35, 2, 3, 1) };
const nothing = figures(0, 0, 0, 0);

const usda = 'USDA FoodData Central (SR Legacy and FNDDS), typical values, rounded';

/** Words that say a food is pasta, for a creamy sauce. */
const pasta = ['pasta', 'fettuccine', 'penne', 'linguine', 'spaghetti', 'noodle', 'rigatoni', 'tortellini', 'ravioli', 'macaroni', 'ziti'];
/** Words that say a drink has no sugar. */
const sugarFree = ['diet', 'zero', 'sugar free', 'sugarfree', 'no sugar', 'unsweetened', 'light', 'lite'];

/**
 * The coach's own table of classic swaps (MM-617), used when neither the
 * person's foods nor the catalog give one: reviewed, deterministic and in
 * order. The first row that matches a food's name wins, so the narrow rows
 * come before the broad ones (General Tso's chicken before fried chicken,
 * fried rice before fried, the biscuit before the sausage in it), and the
 * rows matched by tags alone come last, after the broad fried row. Within a row, the first replacement
 * that qualifies is offered (`tableSwapOf`). Figures are typical servings
 * from USDA FoodData Central, rounded; each row has an evidence row,
 * `coachSwapTable.<key>`.
 */
export const coachSwapTable: readonly CoachSwapRow[] = [
  // Chinese takeout and the buffet.
  {
    key: 'generalTso',
    match: [
      {
        words: ['general tso', 'general tsao', 'general gau', 'sweet and sour', 'sweet sour', 'orange chicken', 'sesame chicken', 'honey chicken', 'lemon chicken'],
      },
    ],
    replacements: [steamedChicken, chickenAndBroccoli],
    source: `${usda}: chicken breast, roasted (100 g); mixed vegetables, boiled (150 g); broccoli, boiled (156 g)`,
  },
  {
    key: 'friedRice',
    match: [{ words: ['fried rice'] }],
    // White rice, long-grain, cooked (1 cup, 158 g): 205 kcal, P 4.3, C 45, F 0.4.
    replacements: [{ words: 'a cup of steamed white rice', serving: figures(205, 4, 45, 0) }],
    source: `${usda}: rice, white, long-grain, cooked (1 cup, 158 g)`,
  },
  {
    key: 'loMein',
    match: [{ words: ['lo mein', 'chow mein', 'chow fun'] }],
    replacements: [{ ...steamedChicken, words: 'steamed vegetables with chicken, no noodles' }],
    source: `${usda}: chicken breast, roasted (100 g); mixed vegetables, boiled (150 g)`,
  },
  {
    key: 'eggRoll',
    match: [{ words: ['egg roll', 'spring roll', 'crab rangoon', 'rangoon', 'fried wonton', 'cream cheese wonton'] }],
    unless: ['fresh spring roll', 'summer roll'],
    replacements: [
      // Hot and sour soup (1 cup, 244 g): 95 kcal, P 6, C 9, F 3, sodium about 875 mg; offered only when the food was saltier.
      { words: 'a cup of hot and sour soup', serving: figures(95, 6, 9, 3, 875) },
      // Dumpling, steamed, meat-filled (2 pieces, 74 g): 130 kcal, P 7, C 14, F 5.
      { words: 'two steamed dumplings', serving: figures(130, 7, 14, 5) },
    ],
    source: `${usda}: hot and sour soup (FNDDS, 1 cup); dumpling, steamed, meat-filled (FNDDS, 2 pieces)`,
  },
  // Fried and breaded: the same protein, grilled.
  {
    key: 'friedChickenSandwich',
    match: [
      { words: ['chicken sandwich', 'chicken burger'], andWords: ['fried', 'crispy', 'breaded', 'battered'] },
      { words: ['chicken sandwich', 'chicken burger'], tags: ['fried'] },
      { words: ['chicken sandwich', 'chicken burger'], tags: ['breaded'] },
    ],
    // Chicken breast, roasted (120 g) 198 kcal, P 37, F 4.3; hamburger bun (44 g) 120, 4, C 21, 1.9; lettuce and tomato.
    replacements: [{ words: 'a grilled chicken sandwich', serving: figures(330, 42, 23, 6) }],
    source: `${usda}: chicken breast, roasted (120 g); hamburger bun (44 g)`,
  },
  {
    key: 'friedSteak',
    match: [{ words: ['chicken fried steak', 'country fried steak', 'chicken fried beef'] }],
    // Beef, top sirloin, lean, broiled (140 g): 250 kcal, P 41, F 9.
    replacements: [{ words: 'a grilled sirloin steak', serving: figures(250, 41, 0, 9) }],
    source: `${usda}: beef, top sirloin steak, lean only, broiled (140 g)`,
  },
  {
    key: 'friedChicken',
    match: [
      {
        words: [
          'fried chicken',
          'chicken nugget',
          'nugget',
          'mcnugget',
          'chicken tender',
          'chicken strip',
          'chicken finger',
          'popcorn chicken',
          'crispy chicken',
          'breaded chicken',
          'chicken katsu',
          'chicken schnitzel',
          'karaage',
          'chicken wing',
          'buffalo wing',
          'hot wing',
          'boneless wing',
        ],
      },
      { tags: ['fried'], andWords: ['chicken'] },
      { tags: ['breaded'], andWords: ['chicken'] },
    ],
    unless: ['stir fried', 'stir fry', 'air fried'],
    replacements: [grilledChicken],
    source: `${usda}: chicken breast, roasted (120 g)`,
  },
  {
    key: 'friedSeafood',
    match: [
      {
        words: ['fried shrimp', 'popcorn shrimp', 'coconut shrimp', 'shrimp tempura', 'tempura shrimp', 'breaded shrimp', 'fried fish', 'fish and chip', 'fish stick', 'fish finger', 'battered fish', 'breaded fish', 'fried catfish', 'fried clam', 'fried calamari', 'fried scallop'],
      },
      { tags: ['fried', 'seafood'] },
      { tags: ['breaded', 'seafood'] },
    ],
    unless: ['stir fried', 'stir fry', 'air fried'],
    // Cod, cooked, dry heat (150 g) 158 kcal, P 34, F 1.3; shrimp, cooked (120 g) 119, 29, 0.4.
    replacements: [{ words: 'grilled or baked fish or shrimp, the same size', serving: figures(140, 31, 0, 1) }],
    source: `${usda}: cod, Atlantic, cooked, dry heat (150 g); shrimp, cooked (120 g)`,
  },
  // Burgers and their sides.
  {
    key: 'doubleBurger',
    match: [{ words: ['double', 'triple'], andWords: ['burger', 'cheeseburger', 'hamburger', 'patty'] }],
    unless: ['veggie burger', 'turkey burger', 'chicken burger'],
    replacements: [
      // Cheeseburger, single patty, plain (fast food, about 113 g): 300 kcal, P 15, C 33, F 12.
      { words: 'a single-patty cheeseburger', serving: figures(300, 15, 33, 12) },
      // Ground beef, 90% lean, broiled (2 patties, 170 g) 369 kcal, P 44, F 20; lettuce and tomato.
      { words: 'two lean patties in a lettuce wrap, no bun', serving: figures(380, 44, 2, 20) },
    ],
    source: `${usda}: cheeseburger, single patty, plain (FNDDS); ground beef, 90% lean, broiled (170 g)`,
  },
  {
    key: 'burger',
    match: [{ words: ['burger', 'cheeseburger', 'hamburger'] }],
    unless: ['veggie burger', 'turkey burger', 'chicken burger', 'lettuce wrap', 'bunless', 'no bun'],
    // Ground beef, 90% lean, broiled (85 g) 184 kcal, P 22, F 10; lettuce and tomato.
    replacements: [{ words: 'a lean patty in a lettuce wrap, no bun', serving: figures(195, 22, 2, 10) }],
    source: `${usda}: ground beef, 90% lean, broiled (85 g)`,
  },
  {
    key: 'fries',
    match: [{ words: ['french fry', 'fry', 'tater tot', 'hash brown', 'onion ring', 'potato wedge'] }],
    unless: ['stir fry', 'fish fry', 'fry bread'],
    replacements: [sideSalad, fruit],
    source: `${usda}: mixed greens, tomato, cucumber (2 cups); Italian dressing (1 tbsp); apple, medium (182 g)`,
  },
  // Pizza.
  {
    key: 'deepDishPizza',
    match: [{ words: ['deep dish', 'stuffed crust', 'pan pizza', 'chicago style', 'sicilian pizza', 'detroit style'] }],
    // Thin-crust chicken pizza against deep-dish cheese pizza, a slice each of a 14-inch pie.
    replacements: [
      { words: 'thin-crust pizza topped with chicken, the same number of slices', ofFood: figures(0.6, 0.8, 0.5, 0.6) },
    ],
    source: `${usda}: pizza, thin crust, chicken topping, and pizza, deep dish, cheese (FNDDS), a slice of a 14-inch pie each`,
  },
  {
    key: 'pizza',
    match: [{ words: ['pizza', 'calzone', 'stromboli'] }],
    unless: ['thin crust', 'pizza sauce', 'cauliflower crust'],
    // Pizza, cheese, thin crust (2 slices, 152 g) 456 kcal, P 20, C 50, F 20; side salad 70 kcal.
    replacements: [{ words: 'two slices of thin-crust pizza and a side salad', serving: figures(525, 22, 58, 23) }],
    source: `${usda}: pizza, cheese, thin crust (FNDDS, 2 slices); mixed greens with vinaigrette`,
  },
  // Pasta.
  {
    key: 'macAndCheese',
    match: [{ words: ['mac and cheese', 'macaroni and cheese', 'mac n cheese', 'mac cheese', 'macaroni cheese'] }],
    // Half the portion, with broccoli, boiled (156 g) 55 kcal, P 3.7, C 11, F 0.6 and chicken breast (57 g) 94, 17.6, 0, 2.
    replacements: [
      {
        words: 'half the mac and cheese, with a cup of broccoli and some grilled chicken',
        ofFood: figures(0.5, 0.5, 0.5, 0.5),
        plus: figures(150, 21, 11, 3),
      },
    ],
    source: `${usda}: broccoli, boiled (1 cup, 156 g); chicken breast, roasted (57 g)`,
  },
  {
    key: 'alfredo',
    match: [{ words: ['alfredo', 'carbonara', 'vodka sauce', 'cream sauce'] }, { tags: ['creamy'], andWords: pasta }],
    // Spaghetti, cooked (140 g) 221 kcal, P 8.1, C 43, F 1.3; marinara (125 g) 66, 2, 10, 2; chicken breast (85 g) 140, 26.4, 0, 3.1.
    replacements: [{ words: 'pasta with marinara and grilled chicken', serving: figures(425, 36, 53, 6) }],
    source: `${usda}: spaghetti, cooked (140 g); pasta sauce, marinara (125 g); chicken breast, roasted (85 g)`,
  },
  // Mexican.
  {
    key: 'burrito',
    match: [{ words: ['burrito', 'chimichanga'] }],
    unless: ['bowl'],
    // The same fillings without a 10-inch flour tortilla (72 g): 220 kcal, P 6, C 36, F 6.
    replacements: [{ words: 'a burrito bowl: the same fillings, no tortilla', ofFood: figures(1, 1, 1, 1), less: figures(220, 6, 36, 6) }],
    source: `${usda}: tortilla, flour, 10-inch (72 g)`,
  },
  {
    key: 'quesadilla',
    match: [{ words: ['quesadilla'] }],
    // Corn tortillas (2, 52 g) 114 kcal, P 3, C 24, F 1.4; chicken breast (85 g) 140, 26.4, 0, 3.1; salsa (32 g) 10.
    replacements: [{ words: 'two chicken soft tacos on corn tortillas, with salsa', serving: figures(265, 30, 26, 5) }],
    source: `${usda}: tortilla, corn (2, 52 g); chicken breast, roasted (85 g); salsa (32 g)`,
  },
  {
    key: 'nachos',
    match: [{ words: ['nacho'] }],
    // Chicken breast (85 g) 140 kcal, P 26.4, F 3.1; black beans, boiled (86 g) 114, 7.6, C 20, 0.5; salsa and lettuce 15.
    replacements: [{ words: 'chicken, black beans, salsa and lettuce in a bowl, no chips', serving: figures(270, 35, 23, 4) }],
    source: `${usda}: chicken breast, roasted (85 g); black beans, boiled (86 g); salsa (32 g); lettuce (1 cup)`,
  },
  // Breakfast.
  {
    key: 'biscuit',
    match: [{ words: ['biscuit'] }],
    unless: ['dog biscuit'],
    replacements: [eggsOnMuffin, englishMuffin],
    source: `${usda}: egg, whole, cooked (2 large, 100 g); English muffin, plain (57 g); cheddar cheese (1 slice, 28 g)`,
  },
  {
    key: 'croissantSandwich',
    match: [{ words: ['croissant'], andWords: ['egg', 'sausage', 'bacon', 'ham', 'sandwich', 'cheese', 'breakfast'] }],
    replacements: [eggsOnMuffin, englishMuffin],
    source: `${usda}: egg, whole, cooked (2 large, 100 g); English muffin, plain (57 g); cheddar cheese (1 slice, 28 g)`,
  },
  {
    key: 'pancakes',
    match: [{ words: ['pancake', 'waffle', 'french toast', 'crepe'] }],
    unless: ['protein pancake', 'protein waffle'],
    // A whole-grain waffle (35 g) 95 kcal, P 2.6, C 15, F 3, with plain Greek yogurt and berries.
    replacements: [{ words: 'a whole-grain waffle topped with plain Greek yogurt and berries', serving: figures(235, 21, 32, 4) }],
    source: `${usda}: waffle, whole grain, frozen, toasted (35 g); Greek yogurt, plain, nonfat (170 g); blueberries (74 g)`,
  },
  {
    key: 'pastry',
    match: [
      {
        words: ['donut', 'doughnut', 'danish', 'croissant', 'pastry', 'cinnamon roll', 'cinnamon bun', 'sticky bun', 'honey bun', 'scone', 'muffin', 'turnover', 'strudel', 'toaster pastry', 'pop tart', 'bear claw', 'coffee cake', 'eclair', 'cruller', 'apple fritter'],
      },
    ],
    unless: ['english muffin', 'egg muffin'],
    replacements: [yogurtAndBerries],
    source: `${usda}: Greek yogurt, plain, nonfat (170 g); blueberries (74 g)`,
  },
  {
    key: 'sausage',
    match: [{ words: ['sausage', 'bratwurst', 'kielbasa', 'chorizo', 'breakfast link'] }],
    unless: ['turkey sausage', 'chicken sausage', 'plant based', 'vegan', 'veggie', 'meatless', 'gravy'],
    replacements: [
      // Turkey sausage, breakfast (2 links, 56 g): 110 kcal, P 9, C 1, F 7.
      { words: 'two turkey sausage links', serving: figures(110, 9, 1, 7) },
      // Egg white (3 large, 99 g): 51 kcal, P 10.8, C 0.7, F 0.2.
      { words: 'three scrambled egg whites', serving: figures(50, 11, 1, 0) },
    ],
    source: `${usda}: turkey sausage, breakfast links (56 g); egg white, raw (3 large, 99 g)`,
  },
  {
    key: 'bacon',
    match: [{ words: ['bacon'] }],
    unless: ['turkey bacon', 'canadian bacon', 'bacon bit'],
    // Canadian bacon, cooked (2 slices, 46 g): 68 kcal, P 11, C 0.8, F 2.6.
    replacements: [{ words: 'two slices of Canadian bacon', serving: figures(70, 11, 1, 3) }],
    source: `${usda}: Canadian bacon, cooked (2 slices, 46 g)`,
  },
  // Drinks.
  {
    key: 'milkshake',
    match: [{ words: ['milkshake', 'milk shake', 'shake', 'malt'] }],
    unless: ['protein shake', 'meal replacement', 'shake and bake', 'malt vinegar'],
    // Whey protein (30 g) 120 kcal, P 24, C 3, F 1.5 (a typical label); 1% milk (1 cup) 102, 8.2, 12, 2.4.
    replacements: [{ words: 'a protein shake made with milk', serving: figures(220, 32, 15, 4) }],
    source: `${usda}: milk, 1% (1 cup, 244 g); whey protein powder, a typical branded label (30 g)`,
  },
  {
    key: 'frappuccino',
    match: [{ words: ['frappuccino', 'frappe', 'blended coffee', 'frozen coffee', 'iced blended'] }],
    replacements: [coldBrew],
    source: `${usda}: coffee, brewed (16 fl oz); milk, 2% (60 g)`,
  },
  {
    key: 'sweetCoffee',
    match: [{ words: ['mocha', 'caramel macchiato', 'pumpkin spice latte', 'flavored latte', 'caramel latte', 'vanilla latte', 'chai latte', 'hazelnut latte'] }],
    // A 16 fl oz latte with 2% milk, no syrup: 185 kcal, P 12, C 17, F 7.
    replacements: [{ words: 'a plain latte, no syrup or whipped cream', serving: figures(185, 12, 17, 7) }, coldBrew],
    source: `${usda}: milk, 2% (360 g) with espresso (2 shots); coffee, brewed (16 fl oz)`,
  },
  {
    key: 'sweetTea',
    match: [{ words: ['sweet tea', 'sweetened tea', 'sweetened iced tea'] }],
    unless: sugarFree,
    groups: ['drinks'],
    replacements: [{ words: 'unsweetened iced tea', serving: nothing }],
    source: `${usda}: tea, brewed, unsweetened`,
  },
  {
    key: 'lemonade',
    match: [{ words: ['lemonade', 'limeade', 'fruit punch'] }],
    unless: sugarFree,
    groups: ['drinks'],
    replacements: [{ words: 'a zero-sugar lemonade, or sparkling water with lemon', serving: figures(5, 0, 1, 0) }],
    source: `${usda}: carbonated water; lemon juice (1 tbsp)`,
  },
  {
    key: 'soda',
    match: [
      {
        words: ['soda', 'cola', 'pop', 'soft drink', 'coke', 'pepsi', 'sprite', 'mountain dew', 'dr pepper', 'root beer', 'ginger ale', 'orange soda', 'energy drink', 'sports drink'],
      },
    ],
    unless: [...sugarFree, 'soda water', 'club soda', 'baking soda', 'soda bread', 'soda cracker', 'pop tart'],
    groups: ['drinks'],
    replacements: [{ words: 'the diet or zero-sugar version', serving: nothing }],
    source: `${usda}: carbonated beverage, low calorie (cola, diet)`,
  },
  {
    key: 'lightBeer',
    match: [{ words: ['beer', 'ale', 'lager', 'ipa', 'stout', 'porter', 'pilsner', 'hefeweizen'] }],
    unless: ['light beer', 'lite beer', 'root beer', 'ginger beer', 'ginger ale', 'non alcoholic', 'alcohol free', 'beer battered', 'beer cheese', 'beer bread'],
    groups: ['drinks'],
    // Beer, light (12 fl oz, 356 g): 103 kcal, P 0.9, C 5.8, F 0.
    replacements: [{ words: 'a light beer', serving: figures(103, 1, 6, 0) }],
    source: `${usda}: beer, light (12 fl oz)`,
  },
  {
    key: 'margarita',
    match: [{ words: ['margarita'] }],
    unless: ['pizza'],
    groups: ['drinks'],
    // Tequila, 80 proof (1.5 fl oz, 42 g) 97 kcal; lime juice (1 tbsp) 4 kcal, C 1.
    replacements: [{ words: 'tequila with soda water and lime', serving: figures(100, 0, 1, 0) }],
    source: `${usda}: distilled spirits, 80 proof (1.5 fl oz); lime juice (1 tbsp)`,
  },
  // Snacks and sweets.
  {
    key: 'chips',
    match: [
      { words: ['chip', 'crisp', 'potato chip', 'tortilla chip', 'corn chip', 'cheese puff', 'cheese curl', 'dorito', 'cheeto', 'pringle'] },
    ],
    unless: ['chocolate chip', 'chip cookie', 'fish and chip', 'apple crisp', 'fruit crisp', 'rice crisp'],
    replacements: [popcorn, yogurtCup],
    source: `${usda}: popcorn, air-popped (3 cups, 24 g); Greek yogurt, plain, nonfat (170 g)`,
  },
  {
    key: 'cookie',
    match: [
      { words: ['cookie', 'brownie', 'cake', 'cupcake', 'cheesecake', 'pie', 'tart', 'biscotti', 'macaron', 'blondie', 'churro'] },
    ],
    unless: ['fortune cookie', 'pot pie', 'pizza pie', 'shepherd pie', 'cottage pie', 'crab cake', 'fish cake', 'rice cake', 'tart cherry'],
    replacements: [yogurtAndBerries, proteinBar],
    source: `${usda}: Greek yogurt, plain, nonfat (170 g); blueberries (74 g); a typical branded 60 g protein bar`,
  },
  {
    key: 'candy',
    match: [
      { words: ['candy', 'candy bar', 'chocolate bar', 'chocolate', 'gummy', 'fudge', 'licorice', 'taffy', 'jelly bean', 'truffle', 'toffee'] },
    ],
    unless: ['chocolate milk', 'hot chocolate', 'protein'],
    replacements: [yogurtAndBerries, proteinBar],
    source: `${usda}: Greek yogurt, plain, nonfat (170 g); blueberries (74 g); a typical branded 60 g protein bar`,
  },
  {
    key: 'iceCream',
    match: [{ words: ['ice cream', 'gelato', 'frozen custard', 'sundae', 'soft serve', 'frozen yogurt', 'froyo'] }],
    replacements: [yogurtAndBerries, proteinBar],
    source: `${usda}: Greek yogurt, plain, nonfat (170 g); blueberries (74 g); a typical branded 60 g protein bar`,
  },
  // Dressings, soups and gravy.
  {
    key: 'creamySalad',
    match: [
      { words: ['caesar salad', 'cobb salad'] },
      { words: ['salad'], andWords: ['ranch', 'caesar', 'blue cheese', 'bleu cheese', 'thousand island', 'creamy'] },
    ],
    // About 4 tbsp of a creamy dressing (60 g ranch: 258 kcal, P 0.8, C 3.6, F 27) for 1 tbsp of vinaigrette (45 kcal, C 2, F 4).
    replacements: [
      { words: 'the same salad, a tablespoon of vinaigrette on the side', ofFood: figures(1, 1, 1, 1), less: figures(210, 1, 2, 23) },
    ],
    source: `${usda}: salad dressing, ranch (60 g); salad dressing, vinaigrette (1 tbsp)`,
  },
  {
    key: 'creamyDressing',
    match: [
      { words: ['ranch', 'blue cheese dressing', 'bleu cheese dressing', 'caesar dressing', 'thousand island', 'creamy dressing', 'creamy italian'] },
    ],
    unless: ['ranch style bean'],
    replacements: [{ words: 'a tablespoon of vinaigrette, on the side', serving: figures(45, 0, 2, 4) }],
    source: `${usda}: salad dressing, ranch (2 tbsp, 30 g); salad dressing, balsamic vinaigrette (1 tbsp)`,
  },
  {
    key: 'creamSoup',
    match: [{ words: ['chowder', 'cream of', 'bisque', 'broccoli cheddar soup', 'broccoli cheese soup', 'potato soup'] }],
    // Chicken vegetable soup (1.5 cups): 150 kcal, P 12, C 15, F 4.
    replacements: [{ words: 'a broth-based chicken and vegetable soup', serving: figures(150, 12, 15, 4) }],
    source: `${usda}: soup, chicken vegetable (FNDDS, 1.5 cups)`,
  },
  {
    key: 'withGravy',
    match: [{ words: ['gravy'], andWords: ['with', 'and', 'smothered'] }, { words: ['smothered'] }],
    // Country gravy (60 g): about 90 kcal with 6 g fat, a quarter of a plate's calories and half its fat.
    replacements: [{ words: 'the same without the gravy', ofFood: figures(0.75, 0.95, 0.85, 0.5) }],
    source: `${usda}: gravy, country or sausage (FNDDS, 1/4 cup)`,
  },
  {
    key: 'gravy',
    match: [{ words: ['gravy'] }],
    replacements: [{ words: 'no gravy', serving: nothing }],
    source: `${usda}: gravy, country or sausage (FNDDS, 1/4 cup)`,
  },
  {
    // The broadest: the same food grilled, baked or steamed, at about two thirds of the calories and a third of the fat.
    key: 'fried',
    match: [
      {
        words: ['fried', 'deep fried', 'crispy', 'breaded', 'battered', 'tempura', 'fritter', 'corn dog', 'mozzarella stick', 'jalapeno popper', 'hush puppy'],
      },
      { tags: ['fried'] },
      { tags: ['breaded'] },
    ],
    unless: ['stir fried', 'stir fry', 'air fried', 'steamed'],
    replacements: [{ words: 'the same food, grilled, baked or steamed instead of fried', ofFood: figures(0.65, 1, 0.8, 0.35) }],
    source: `${usda}: chicken, potato and fish, fried against roasted or baked (SR Legacy), per 100 g`,
  },
  // Matched by the tags alone, for a name no row above says.
  {
    key: 'sugaryDrink',
    match: [{ tags: ['sugaryDrink'] }],
    unless: [...sugarFree, 'soda water', 'club soda', 'baking soda', 'soda bread', 'soda cracker'],
    replacements: [{ words: 'water, or a zero-sugar version of the drink', serving: nothing }],
    source: `${usda}: water, carbonated or plain`,
  },
  {
    key: 'sweets',
    match: [{ tags: ['dessert'] }, { tags: ['candy'] }, { tags: ['pastry'] }],
    replacements: [yogurtAndBerries, proteinBar],
    source: `${usda}: Greek yogurt, plain, nonfat (170 g); blueberries (74 g); a typical branded 60 g protein bar`,
  },
  {
    key: 'snackFood',
    match: [{ tags: ['snackFood'] }],
    replacements: [popcorn, yogurtCup],
    source: `${usda}: popcorn, air-popped (3 cups, 24 g); Greek yogurt, plain, nonfat (170 g)`,
  },
];
