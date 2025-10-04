import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import RecipeDetail from '@/components/RecipeDetail'

export default async function RecipeDetailPage({ params }: { params: { id: string } }) {
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

  const { data: favorite } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('recipe_id', params.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RecipeDetail
          recipe={recipe}
          ingredients={ingredients || []}
          isFavorite={!!favorite}
          userId={user.id}
        />
      </main>
    </div>
  )
}
