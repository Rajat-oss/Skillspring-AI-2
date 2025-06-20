"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { 
  Search, 
  BookOpen, 
  Play, 
  Clock, 
  Star, 
  Bookmark, 
  CheckCircle,
  ExternalLink,
  Filter,
  Sparkles,
  Youtube,
  Globe,
  Award,
  Plus,
  FolderPlus,
  X,
  Maximize
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"

interface FreeResource {
  id: string
  title: string
  description: string
  provider: string
  category: string
  level: string
  duration: string
  url: string
  embed_url: string
  thumbnail: string
  language: string
  tags: string[]
  rating: number
  created_at: string
  bookmark_status?: string | null
  progress?: number
}

interface Filters {
  categories: string[]
  levels: string[]
  languages: string[]
}

export function FreeResourcesHub() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [resources, setResources] = useState<FreeResource[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [levels, setLevels] = useState<string[]>([])
  const [languages, setLanguages] = useState<string[]>([])
  const [bookmarks, setBookmarks] = useState<FreeResource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [recommendations, setRecommendations] = useState<FreeResource[]>([])
  const [selectedResource, setSelectedResource] = useState<FreeResource | null>(null)
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)
  const [currentVideo, setCurrentVideo] = useState<FreeResource | null>(null)
  const [learningFolders, setLearningFolders] = useState<any[]>([])
  const [showAddToPath, setShowAddToPath] = useState<FreeResource | null>(null)

  const categoryIcons: Record<string, any> = {
    'Web Development': Monitor,
    'Data Science': Database,
    'AI': Brain,
    'Computer Science': Brain,
    'Cybersecurity': Shield,
    'Design': Palette,
    'Mobile Development': Smartphone
  }

  const levelColors: Record<string, string> = {
    'Beginner': 'bg-green-500',
    'Intermediate': 'bg-yellow-500',
    'Advanced': 'bg-red-500'
  }

  // Fetch data with debouncing for search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length > 2) {
        fetchRealTimeSearch()
      } else {
        fetchData()
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery, selectedCategory, selectedLevel, selectedLanguage])

  const fetchRealTimeSearch = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // Real-time search with auto-suggestions
      const params = new URLSearchParams()
      params.append('q', searchQuery)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedLevel) params.append('level', selectedLevel)

      const searchResponse = await fetch(`/api/learning/free-resources/search?${params}`, { headers })
      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        setResources(searchData.resources)
      }

    } catch (error) {
      console.error('Error in real-time search:', error)
      // Fallback to regular search
      fetchData()
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // Fetch filters
      const filtersResponse = await fetch('/api/learning/free-resources/categories', { headers })
      if (filtersResponse.ok) {
        const filtersData = await filtersResponse.json()
        setCategories(filtersData.categories)
        setLevels(filtersData.levels)
        setLanguages(filtersData.languages)
      }

      // Fetch resources with current filters
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedLevel) params.append('level', selectedLevel)
      if (selectedLanguage) params.append('language', selectedLanguage)

      const resourcesResponse = await fetch(`/api/learning/free-resources?${params}`, { headers })
      if (resourcesResponse.ok) {
        const resourcesData = await resourcesResponse.json()
        setResources(resourcesData.resources)
      }

      // Fetch bookmarks
      const bookmarksResponse = await fetch('/api/learning/free-resources/bookmarks', { headers })
      if (bookmarksResponse.ok) {
        const bookmarksData = await bookmarksResponse.json()
        setBookmarks(bookmarksData.bookmarks)
      }

      // Fetch AI recommendations
      const recommendationsResponse = await fetch('/api/learning/free-resources/recommendations', { headers })
      if (recommendationsResponse.ok) {
        const recommendationsData = await recommendationsResponse.json()
        setRecommendations(recommendationsData.recommendations)
      }

    } catch (error) {
      console.error('Error fetching resources:', error)
      toast({
        title: "Error",
        description: "Failed to load resources. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/learning/free-resources/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories)
        setLevels(data.levels)
        setLanguages(data.languages)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchResources = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedLevel) params.append('level', selectedLevel)
      if (selectedLanguage) params.append('language', selectedLanguage)

      const response = await fetch(`/api/learning/free-resources?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setResources(data.resources)
      }
    } catch (error) {
      console.error('Error fetching resources:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBookmarks = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/learning/free-resources/bookmarks', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setBookmarks(data.bookmarks)
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error)
    }
  }

  const fetchRecommendations = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/learning/free-resources/recommendations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendations)
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error)
    }
  }

  const performSearch = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedLevel) params.append('level', selectedLevel)
      if (selectedLanguage) params.append('language', selectedLanguage)

      const response = await fetch(`/api/learning/free-resources?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setResources(data.resources)
      }
    } catch (error) {
      console.error('Error performing search:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProgress = async (resourceId: string, progress: number) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`/api/learning/free-resources/${resourceId}/progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress }),
      })
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  const handleBookmark = async (resourceId: string, status: string = 'bookmarked') => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/learning/free-resources/${resourceId}/bookmark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        toast({
          title: "Bookmarked!",
          description: "Resource saved to your bookmarks",
        })

        // Refresh resources to show updated bookmark status
        fetchResources()
        fetchBookmarks()
      }
    } catch (error) {
      console.error('Error bookmarking resource:', error)
      toast({
        title: "Error",
        description: "Failed to bookmark resource",
        variant: "destructive"
      })
    }
  }

  const handlePlayVideo = (resource: FreeResource) => {
    if (resource.embed_url) {
      setCurrentVideo(resource)
      setShowVideoPlayer(true)

      // Track learning activity
      updateProgress(resource.id, 10) // Start with 10% when video is opened
    } else {
      // Open in new tab if no embed URL
      window.open(resource.url, '_blank')
    }
  }

  const fetchLearningFolders = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/learning/folders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setLearningFolders(data.folders)
      }
    } catch (error) {
      console.error('Error fetching learning folders:', error)
    }
  }

  const handleAddToLearningPath = async (resource: FreeResource, folderId: string) => {
    try {
      const token = localStorage.getItem('token')

      // Create a simple learning item from the resource
      const learningItem = {
        title: `Study: ${resource.title}`,
        description: resource.description,
        resources: [resource.url],
        estimated_hours: 2
      }

      const response = await fetch('/api/learning/add-resource-to-folder', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folder_id: folderId,
          item: learningItem
        })
      })

      if (response.ok) {
        toast({
          title: "Added to Learning Path!",
          description: `${resource.title} added to your learning path`,
        })
        setShowAddToPath(null)
      }
    } catch (error) {
      console.error('Error adding to learning path:', error)
      toast({
        title: "Error",
        description: "Failed to add to learning path",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    if (user) {
      fetchCategories()
      fetchResources()
      fetchBookmarks()
      fetchRecommendations()
      fetchLearningFolders()
    }
  }, [user])

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery || selectedCategory || selectedLevel || selectedLanguage) {
        performSearch()
      } else {
        fetchResources()
      }
    }, 500)

    return () => clearTimeout(delayedSearch)
  }, [searchQuery, selectedCategory, selectedLevel, selectedLanguage])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setSelectedLevel('')
    setSelectedLanguage('')
  }

  const ResourceCard = ({ resource, showProgress = false }: { resource: FreeResource, showProgress?: boolean }) => {
    const CategoryIcon = categoryIcons[resource.category] || Monitor
    const isBookmarked = resource.bookmark_status
    const progress = resource.progress || 0

    return (
      <Card className="bg-gray-900/50 border-gray-700 hover:border-blue-500 transition-all duration-300 group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <CategoryIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg leading-tight">{resource.title}</CardTitle>
                <CardDescription className="text-sm mt-1">{resource.provider}</CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={`${levelColors[resource.level]} text-white text-xs`}>
                {resource.level}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleBookmark(resource.id, isBookmarked ? 'bookmarked' : 'bookmarked')}
                className="text-gray-400 hover:text-yellow-400"
              >
                {isBookmarked ? (
                  <BookmarkCheck className="w-4 h-4" />
                ) : (
                  <BookmarkPlus className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Thumbnail */}
          {resource.thumbnail && (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-800">
              <img 
                src={resource.thumbnail} 
                alt={resource.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              {resource.embed_url && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setSelectedResource(resource)
                      setShowVideoDialog(true)
                    }}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Watch
                  </Button>
                </div>
              )}
            </div>
          )}

          <p className="text-sm text-gray-300 line-clamp-3">{resource.description}</p>

          {/* Progress bar for bookmarked items */}
          {showProgress && progress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {resource.duration}
              </div>
              <div className="flex items-center">
                <Star className="w-3 h-3 mr-1 text-yellow-400" />
                {resource.rating}
              </div>
              <div className="flex items-center">
                <Globe className="w-3 h-3 mr-1" />
                {resource.language}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {resource.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {resource.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{resource.tags.length - 3}
              </Badge>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex space-x-2 pt-2">
            {resource.embed_url ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePlayVideo(resource)}
                          className="flex-1"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Watch
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(resource.url, '_blank')}
                          className="flex-1"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddToPath(resource)}
                        className="px-2"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>

            {isBookmarked && (
              <Select 
                value={resource.bookmark_status || 'bookmarked'}
                onValueChange={(value) => handleBookmark(resource.id, value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bookmarked">Bookmarked</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Progress slider for bookmarked items */}
          {isBookmarked && (
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Update Progress:</label>
              <Slider
                value={[progress]}
                onValueChange={(value) => updateProgress(resource.id, value[0])}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading free resources...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-blue-400 flex items-center">
            <Sparkles className="w-8 h-8 mr-3" />
            Learn from Free Resources
          </h2>
          <p className="text-gray-400 mt-2">
            Access curated free education from top platforms worldwide
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search courses, tutorials, topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-600"
                />
              </div>
            </div>

            <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}>
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLevel || "all"} onValueChange={(value) => setSelectedLevel(value === "all" ? "" : value)}>
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {levels.map((level) => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex space-x-2">
              <Select value={selectedLanguage || "all"} onValueChange={(value) => setSelectedLanguage(value === "all" ? "" : value)}>
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  {languages.map((language) => (
                    <SelectItem key={language} value={language}>{language}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-900/50">
          <TabsTrigger value="all" className="data-[state=active]:bg-blue-600">
            All Resources ({resources.length})
          </TabsTrigger>
          <TabsTrigger value="recommended" className="data-[state=active]:bg-green-600">
            AI Recommended ({recommendations.length})
          </TabsTrigger>
          <TabsTrigger value="bookmarks" className="data-[state=active]:bg-yellow-600">
            My Bookmarks ({bookmarks.length})
          </TabsTrigger>
          <TabsTrigger value="progress" className="data-[state=active]:bg-purple-600">
            In Progress ({bookmarks.filter(b => b.bookmark_status === 'in_progress').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
          {resources.length === 0 && (
            <Card className="bg-gray-900/50 border-gray-700">
              <CardContent className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No resources found</h3>
                <p className="text-gray-400">Try adjusting your search or filters</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommended" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {recommendations.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bookmarks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {bookmarks.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} showProgress={true} />
            ))}
          </div>
          {bookmarks.length === 0 && (
            <Card className="bg-gray-900/50 border-gray-700">
              <CardContent className="text-center py-12">
                <Bookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No bookmarks yet</h3>
                <p className="text-gray-400">Start bookmarking resources to build your learning library</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {bookmarks.filter(b => b.bookmark_status === 'in_progress').map((resource) => (
              <ResourceCard key={resource.id} resource={resource} showProgress={true} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Video Player Dialog */}
      <Dialog open={showVideoPlayer} onOpenChange={setShowVideoPlayer}>
        <DialogContent className="max-w-4xl w-full h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {currentVideo?.title}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVideoPlayer(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {currentVideo?.embed_url && (
            <div className="flex-1">
              <AspectRatio ratio={16 / 9} className="bg-muted">
                <iframe
                  src={currentVideo.embed_url}
                  title={currentVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full rounded-md"
                />
              </AspectRatio>

              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">{currentVideo.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline">{currentVideo.level}</Badge>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span className="text-sm">{currentVideo.duration}</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-500" />
                      <span className="text-sm">{currentVideo.rating}</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBookmark(currentVideo.id, 'in_progress')}
                  >
                    <Bookmark className="w-4 h-4 mr-2" />
                    Save Progress
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add to Learning Path Dialog */}
      <Dialog open={showAddToPath !== null} onOpenChange={() => setShowAddToPath(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Learning Path</DialogTitle>
            <DialogDescription>
              Choose a folder to add "{showAddToPath?.title}" to your learning path
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {learningFolders.length > 0 ? (
              <div className="grid gap-2">
                {learningFolders.map((folder) => (
                  <Button
                    key={folder.id}
                    variant="outline"
                    className="justify-start h-auto p-4"
                    onClick={() => showAddToPath && handleAddToLearningPath(showAddToPath, folder.id)}
                  >
                    <div className="flex items-center w-full">
                      <div className={`w-3 h-3 rounded-full bg-${folder.color}-500 mr-3`} />
                      <div className="flex-1 text-left">
                        <div className="font-medium">{folder.name}</div>
                        <div className="text-sm text-gray-400">
                          {folder.completed_items}/{folder.total_items} completed
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">
                        {folder.progress}%
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FolderPlus className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-400 mb-4">No learning folders yet</p>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Learning Folder
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}