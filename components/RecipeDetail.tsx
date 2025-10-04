'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Recipe, Ingredient, MealKind } from '@/lib/types/database'
import Link from 'next/link'
import { useState } from 'react'

const MEAL_KIND_LABELS: Record<MealKind, string> = {
  appetizer: 'Appetizer',
  main_course: 'Main Course',
  second_course: 'Second Course',
  dessert: 'Dessert',
}

interface RecipeDetailProps {
  recipe: Recipe
  ingredients: Ingredient[]
  isFavorite: boolean
  userId: string
}

export default function RecipeDetail({ recipe, ingredients, isFavorite, userId }: RecipeDetailProps) {
  const [favorite, setFavorite] = useState(isFavorite)
  const router = useRouter()
  const supabase = createClient()

  const toggleFavorite = async () => {
    if (favorite) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('recipe_id', recipe.id)
      setFavorite(false)
    } else {
      await supabase
        .from('favorites')
        .insert({ user_id: userId, recipe_id: recipe.id })
      setFavorite(true)
    }
  }

  const deleteRecipe = async () => {
    if (!confirm('Are you sure you want to delete this recipe?')) return

    await supabase.from('recipes').delete().eq('id', recipe.id)
    router.push('/recipes')
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/recipes" className="text-blue-600 hover:text-blue-800">
          ← Back to recipes
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
            <p className="text-lg text-gray-600">{MEAL_KIND_LABELS[recipe.meal_kind]}</p>
          </div>
          <button onClick={toggleFavorite} className="text-4xl">
            {favorite ? '⭐' : '☆'}
          </button>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Ingredients</h2>
          <ul className="space-y-2">
            {ingredients.map((ingredient) => (
              <li key={ingredient.id} className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-800">{ingredient.name}</span>
                <span className="text-gray-600 font-medium">{ingredient.grams}g</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Instructions</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{recipe.instructions}</p>
          </div>
        </div>

        <div className="flex gap-4 pt-6 border-t border-gray-200">
          <Link
            href={`/recipes/${recipe.id}/edit`}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Edit Recipe
          </Link>
          <button
            onClick={deleteRecipe}
            className="px-6 py-3 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
          >
            Delete Recipe
          </button>
        </div>
      </div>
    </div>
  )
}
