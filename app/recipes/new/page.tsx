import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import RecipeForm from '@/components/RecipeForm'

export default async function NewRecipePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Add New Recipe</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <RecipeForm userId={user.id} />
        </div>
      </main>
    </div>
  )
}
