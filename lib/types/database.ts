export type MealKind = 'appetizer' | 'main_course' | 'second_course' | 'dessert'

export interface Profile {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface Recipe {
  id: string
  user_id: string
  title: string
  instructions: string
  meal_kind: MealKind
  created_at: string
  updated_at: string
}

export interface Ingredient {
  id: string
  recipe_id: string
  name: string
  grams: number
  created_at: string
}

export interface Favorite {
  id: string
  user_id: string
  recipe_id: string
  created_at: string
}

export interface RecipeWithIngredients extends Recipe {
  ingredients: Ingredient[]
  is_favorite?: boolean
}
