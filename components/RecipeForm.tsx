'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MealKind } from '@/lib/types/database'

interface Ingredient {
  id?: string
  name: string
  grams: number
}

interface RecipeFormProps {
  userId: string
  recipeId?: string
  initialData?: {
    title: string
    instructions: string
    meal_kind: MealKind
    ingredients: Ingredient[]
  }
}

export default function RecipeForm({ userId, recipeId, initialData }: RecipeFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [instructions, setInstructions] = useState(initialData?.instructions || '')
  const [mealKind, setMealKind] = useState<MealKind>(initialData?.meal_kind || 'main_course')
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialData?.ingredients || [{ name: '', grams: 0 }]
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', grams: 0 }])
  }

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const updateIngredient = (index: number, field: 'name' | 'grams', value: string | number) => {
    const updated = [...ingredients]
    updated[index] = { ...updated[index], [field]: value }
    setIngredients(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (ingredients.some(ing => !ing.name || ing.grams <= 0)) {
        setError('All ingredients must have a name and valid grams')
        setLoading(false)
        return
      }

      let finalRecipeId = recipeId

      if (recipeId) {
        const { error: recipeError } = await supabase
          .from('recipes')
          .update({
            title,
            instructions,
            meal_kind: mealKind,
            updated_at: new Date().toISOString(),
          })
          .eq('id', recipeId)

        if (recipeError) throw recipeError

        await supabase.from('ingredients').delete().eq('recipe_id', recipeId)
      } else {
        const { data: recipeData, error: recipeError } = await supabase
          .from('recipes')
          .insert({
            user_id: userId,
            title,
            instructions,
            meal_kind: mealKind,
          })
          .select()
          .single()

        if (recipeError) throw recipeError
        finalRecipeId = recipeData.id
      }

      const { error: ingredientsError } = await supabase
        .from('ingredients')
        .insert(
          ingredients.map(ing => ({
            recipe_id: finalRecipeId,
            name: ing.name,
            grams: ing.grams,
          }))
        )

      if (ingredientsError) throw ingredientsError

      router.push('/recipes')
    } catch (err) {
      setError('Failed to save recipe')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Recipe Title
        </label>
        <input
          id="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="mealKind" className="block text-sm font-medium text-gray-700 mb-1">
          Meal Type
        </label>
        <select
          id="mealKind"
          value={mealKind}
          onChange={(e) => setMealKind(e.target.value as MealKind)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="appetizer">Appetizer</option>
          <option value="main_course">Main Course</option>
          <option value="second_course">Second Course</option>
          <option value="dessert">Dessert</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>
        <div className="space-y-3">
          {ingredients.map((ingredient, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                placeholder="Ingredient name"
                value={ingredient.name}
                onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Grams"
                value={ingredient.grams || ''}
                onChange={(e) => updateIngredient(index, 'grams', parseInt(e.target.value) || 0)}
                className="w-32 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {ingredients.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addIngredient}
          className="mt-3 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
        >
          + Add Ingredient
        </button>
      </div>

      <div>
        <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-1">
          Instructions
        </label>
        <textarea
          id="instructions"
          required
          rows={8}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Saving...' : recipeId ? 'Update Recipe' : 'Create Recipe'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/recipes')}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
