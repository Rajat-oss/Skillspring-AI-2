"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Sparkles } from "lucide-react"

export function SmartSearch() {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/smart-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      const data = await res.json()
      if (data.success) {
        setResponse(data.response)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center text-purple-400">
          <Sparkles className="w-6 h-6 mr-2" />
          AI Smart Search
        </CardTitle>
        <CardDescription>
          Ask anything about job applications, internships, or career advice
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Input
            placeholder="e.g., How to write a good cover letter?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="bg-gray-800 border-gray-600"
          />
          <Button 
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
        
        {response && (
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
            <p className="text-purple-100 whitespace-pre-wrap">{response}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}