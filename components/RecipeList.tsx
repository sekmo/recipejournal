'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RecipeWithIngredients, MealKind } from '@/lib/types/database'
import Link from 'next/link'

const MEAL_KIND_LABELS: Record<MealKind, string> = {
  appetizer: 'Appetizer',
  main_course: 'Main Course',
  second_course: 'Second Course',
  dessert: 'Dessert',
}

interface RecipeListProps {
  userId: string
}

export default function RecipeList({ userId }: RecipeListProps) {
  const [recipes, setRecipes] = useState<RecipeWithIngredients[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [mealKindFilter, setMealKindFilter] = useState<MealKind | 'all'>('all')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadRecipes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadRecipes = async () => {
    setLoading(true)
    try {
      const { data: recipesData, error: recipesError } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (recipesError) throw recipesError

      const { data: favoritesData } = await supabase
        .from('favorites')
        .select('recipe_id')
        .eq('user_id', userId)

      const favoriteIds = new Set(favoritesData?.map(f => f.recipe_id) || [])

      const recipesWithIngredients = await Promise.all(
        (recipesData || []).map(async (recipe) => {
          const { data: ingredients } = await supabase
            .from('ingredients')
            .select('*')
            .eq('recipe_id', recipe.id)
            .order('created_at', { ascending: true })

          return {
            ...recipe,
            ingredients: ingredients || [],
            is_favorite: favoriteIds.has(recipe.id),
          }
        })
      )

      setRecipes(recipesWithIngredients)
    } catch (error) {
      console.error('Error loading recipes:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async (recipeId: string, isFavorite: boolean) => {
    if (isFavorite) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('recipe_id', recipeId)
    } else {
      await supabase
        .from('favorites')
        .insert({ user_id: userId, recipe_id: recipeId })
    }
    loadRecipes()
  }

  const deleteRecipe = async (recipeId: string) => {
    if (!confirm('Are you sure you want to delete this recipe?')) return

    await supabase.from('recipes').delete().eq('id', recipeId)
    loadRecipes()
  }

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.title.toLowerCase().includes(search.toLowerCase())
    const matchesMealKind = mealKindFilter === 'all' || recipe.meal_kind === mealKindFilter
    const matchesFavorites = !showFavoritesOnly || recipe.is_favorite
    return matchesSearch && matchesMealKind && matchesFavorites
  })

  if (loading) {
    return <div className="text-center py-8">Loading recipes...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Recipes</h1>
        <Link
          href="/recipes/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Recipe
        </Link>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex gap-4 flex-wrap">
          <input
            type="text"
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={mealKindFilter}
            onChange={(e) => setMealKindFilter(e.target.value as MealKind | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Meal Types</option>
            <option value="appetizer">Appetizers</option>
            <option value="main_course">Main Courses</option>
            <option value="second_course">Second Courses</option>
            <option value="dessert">Desserts</option>
          </select>
          <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={showFavoritesOnly}
              onChange={(e) => setShowFavoritesOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">Favorites only</span>
          </label>
        </div>
      </div>

      {filteredRecipes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No recipes found. Create your first recipe!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <div key={recipe.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <Link href={`/recipes/${recipe.id}`} className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                    {recipe.title}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {MEAL_KIND_LABELS[recipe.meal_kind]}
                  </p>
                </Link>
                <button
                  onClick={() => toggleFavorite(recipe.id, recipe.is_favorite || false)}
                  className="text-2xl"
                >
                  {recipe.is_favorite ? '⭐' : '☆'}
                </button>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Ingredients:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {recipe.ingredients.slice(0, 3).map((ing) => (
                    <li key={ing.id}>
                      {ing.name} - {ing.grams}g
                    </li>
                  ))}
                  {recipe.ingredients.length > 3 && (
                    <li className="text-gray-400">
                      +{recipe.ingredients.length - 3} more...
                    </li>
                  )}
                </ul>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/recipes/${recipe.id}/edit`}
                  className="flex-1 text-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Edit
                </Link>
                <button
                  onClick={() => deleteRecipe(recipe.id)}
                  className="flex-1 px-3 py-2 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
