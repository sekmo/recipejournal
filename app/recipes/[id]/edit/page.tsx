import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import RecipeForm from '@/components/RecipeForm'

export default async function EditRecipePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: recipe } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!recipe) {
    redirect('/recipes')
  }

  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('*')
    .eq('recipe_id', params.id)
    .order('created_at', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Recipe</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <RecipeForm
            userId={user.id}
            recipeId={recipe.id}
            initialData={{
              title: recipe.title,
              instructions: recipe.instructions,
              meal_kind: recipe.meal_kind,
              ingredients: ingredients || [],
            }}
          />
        </div>
      </main>
    </div>
  )
}
