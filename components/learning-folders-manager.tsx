
"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Plus, 
  Folder, 
  CheckCircle, 
  Clock,
  Target,
  Brain,
  Sparkles,
  FolderPlus,
  BookOpen,
  Edit3,
  Trash2
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"

interface LearningFolder {
  id: string
  name: string
  description: string
  color: string
  progress: number
  total_items: number
  completed_items: number
  created_at: string
}

interface LearningItem {
  id: string
  title: string
  description: string
  completed: boolean
  resources: string[]
  estimated_hours: number
  order_index: number
}

interface GeneratedPath {
  title: string
  description: string
  items: {
    title: string
    description: string
    estimated_hours: number
  }[]
  estimated_total_hours: number
  difficulty: string
  skills: string[]
}

export function LearningFoldersManager() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [folders, setFolders] = useState<LearningFolder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<LearningFolder | null>(null)
  const [folderItems, setFolderItems] = useState<LearningItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderDescription, setNewFolderDescription] = useState('')
  const [newFolderColor, setNewFolderColor] = useState('blue')
  const [aiGoal, setAiGoal] = useState('')
  const [aiSkillLevel, setAiSkillLevel] = useState('beginner')
  const [aiTimeCommitment, setAiTimeCommitment] = useState('10')
  const [generatedPath, setGeneratedPath] = useState<GeneratedPath | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const colors = [
    { name: 'blue', class: 'bg-blue-500', border: 'border-blue-500' },
    { name: 'green', class: 'bg-green-500', border: 'border-green-500' },
    { name: 'purple', class: 'bg-purple-500', border: 'border-purple-500' },
    { name: 'orange', class: 'bg-orange-500', border: 'border-orange-500' },
    { name: 'pink', class: 'bg-pink-500', border: 'border-pink-500' },
    { name: 'red', class: 'bg-red-500', border: 'border-red-500' }
  ]

  useEffect(() => {
    if (user) {
      fetchFolders()
    }
  }, [user])

  const fetchFolders = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/learning/folders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setFolders(data.folders)
      }
    } catch (error) {
      console.error('Error fetching folders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFolderItems = async (folderId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/learning/folders/${folderId}/items`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setFolderItems(data.items)
      }
    } catch (error) {
      console.error('Error fetching folder items:', error)
    }
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/learning/folders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFolderName,
          description: newFolderDescription,
          color: newFolderColor
        })
      })

      if (response.ok) {
        toast({
          title: "Folder Created!",
          description: `${newFolderName} folder created successfully`,
        })
        setNewFolderName('')
        setNewFolderDescription('')
        setShowCreateFolder(false)
        fetchFolders()
      }
    } catch (error) {
      console.error('Error creating folder:', error)
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive"
      })
    }
  }

  const generateLearningPath = async () => {
    if (!aiGoal.trim()) return

    setAiLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/ai/generate-learning-path', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal: aiGoal,
          skill_level: aiSkillLevel,
          time_commitment: aiTimeCommitment
        })
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedPath(data.generated_path)
      }
    } catch (error) {
      console.error('Error generating learning path:', error)
      toast({
        title: "Error",
        description: "Failed to generate learning path",
        variant: "destructive"
      })
    } finally {
      setAiLoading(false)
    }
  }

  const addGeneratedPathToFolder = async (folderId: string) => {
    if (!generatedPath) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/learning/add-generated-path', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folder_id: folderId,
          generated_path: generatedPath
        })
      })

      if (response.ok) {
        toast({
          title: "Path Added!",
          description: `${generatedPath.title} added to your learning folder`,
        })
        setGeneratedPath(null)
        setShowAIGenerator(false)
        fetchFolders()
        if (selectedFolder?.id === folderId) {
          fetchFolderItems(folderId)
        }
      }
    } catch (error) {
      console.error('Error adding generated path:', error)
      toast({
        title: "Error",
        description: "Failed to add learning path",
        variant: "destructive"
      })
    }
  }

  const toggleItemCompletion = async (itemId: string) => {
    if (!selectedFolder) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/learning/folders/${selectedFolder.id}/items/${itemId}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchFolderItems(selectedFolder.id)
        fetchFolders() // Refresh to update progress
        toast({
          title: "Progress Updated!",
          description: "Keep up the great work!",
        })
      }
    } catch (error) {
      console.error('Error toggling item:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading your learning folders...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Learning Folders</h2>
          <p className="text-gray-400">Organize your learning goals and track progress</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showAIGenerator} onOpenChange={setShowAIGenerator}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                <Sparkles className="w-4 h-4 mr-2" />
                AI Generate Path
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Generate Learning Path with AI</DialogTitle>
                <DialogDescription>
                  Let AI create a personalized learning roadmap for your goals
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Learning Goal</label>
                  <Input
                    placeholder="e.g., Learn React.js, Master Data Science, Frontend Development"
                    value={aiGoal}
                    onChange={(e) => setAiGoal(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Current Skill Level</label>
                    <select
                      value={aiSkillLevel}
                      onChange={(e) => setAiSkillLevel(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Weekly Time (hours)</label>
                    <Input
                      type="number"
                      value={aiTimeCommitment}
                      onChange={(e) => setAiTimeCommitment(e.target.value)}
                      className="mt-1"
                      min="1"
                      max="40"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={generateLearningPath}
                  disabled={aiLoading || !aiGoal.trim()}
                  className="w-full"
                >
                  {aiLoading ? (
                    <>
                      <Brain className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Generate Learning Path
                    </>
                  )}
                </Button>
                
                {generatedPath && (
                  <Card className="bg-gray-800 border-purple-500">
                    <CardHeader>
                      <CardTitle className="text-purple-400">{generatedPath.title}</CardTitle>
                      <CardDescription>{generatedPath.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>Total Time: {generatedPath.estimated_total_hours}h</span>
                          <Badge variant="outline">{generatedPath.difficulty}</Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium">Learning Steps:</h4>
                          {generatedPath.items.slice(0, 3).map((item, index) => (
                            <div key={index} className="flex items-start space-x-2 text-sm">
                              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                              <div>
                                <span className="font-medium">{item.title}</span>
                                <span className="text-gray-400 ml-2">({item.estimated_hours}h)</span>
                              </div>
                            </div>
                          ))}
                          {generatedPath.items.length > 3 && (
                            <div className="text-sm text-gray-400">
                              +{generatedPath.items.length - 3} more steps...
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4">
                          <h4 className="font-medium text-sm mb-2">Add to Folder:</h4>
                          <div className="grid gap-2">
                            {folders.map((folder) => (
                              <Button
                                key={folder.id}
                                variant="outline"
                                size="sm"
                                onClick={() => addGeneratedPathToFolder(folder.id)}
                                className="justify-start"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                {folder.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderPlus className="w-4 h-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Learning Folder</DialogTitle>
                <DialogDescription>
                  Organize your learning goals into structured folders
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Folder Name</label>
                  <Input
                    placeholder="e.g., Frontend Dev Bootcamp, DSA Mastery"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <Textarea
                    placeholder="Brief description of your learning goals..."
                    value={newFolderDescription}
                    onChange={(e) => setNewFolderDescription(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Color</label>
                  <div className="flex space-x-2 mt-2">
                    {colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setNewFolderColor(color.name)}
                        className={`w-8 h-8 rounded-full ${color.class} ${
                          newFolderColor === color.name ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                <Button onClick={createFolder} className="w-full" disabled={!newFolderName.trim()}>
                  Create Folder
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Folders Grid */}
      {folders.length === 0 ? (
        <Card className="border-dashed border-gray-600">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderPlus className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Learning Folders Yet</h3>
            <p className="text-gray-400 text-center mb-6">
              Create your first learning folder to organize your goals and track progress
            </p>
            <Button onClick={() => setShowCreateFolder(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Folder
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {folders.map((folder) => (
            <Card
              key={folder.id}
              className={`cursor-pointer transition-all hover:scale-105 ${
                selectedFolder?.id === folder.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => {
                setSelectedFolder(folder)
                fetchFolderItems(folder.id)
              }}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full bg-${folder.color}-500`} />
                    <CardTitle className="text-lg">{folder.name}</CardTitle>
                  </div>
                  <Badge variant="outline">{folder.progress}%</Badge>
                </div>
                {folder.description && (
                  <CardDescription>{folder.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Progress value={folder.progress} className="h-2" />
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{folder.completed_items}/{folder.total_items} completed</span>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>Active</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Selected Folder Details */}
      {selectedFolder && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-5 h-5 rounded-full bg-${selectedFolder.color}-500`} />
                <CardTitle className="text-xl">{selectedFolder.name}</CardTitle>
              </div>
              <Badge className="bg-blue-600">{selectedFolder.progress}% Complete</Badge>
            </div>
            {selectedFolder.description && (
              <CardDescription>{selectedFolder.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {folderItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-4" />
                    <p>No learning items yet. Use AI to generate a learning path!</p>
                  </div>
                ) : (
                  folderItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg border ${
                        item.completed ? 'bg-green-900/20 border-green-700' : 'bg-gray-800/50 border-gray-600'
                      }`}
                    >
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => toggleItemCompletion(item.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h4 className={`font-medium ${item.completed ? 'line-through text-gray-400' : ''}`}>
                          {item.title}
                        </h4>
                        <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                        <div className="flex items-center mt-2 space-x-4">
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            {item.estimated_hours}h
                          </div>
                          {item.resources.length > 0 && (
                            <div className="flex items-center text-xs text-gray-500">
                              <BookOpen className="w-3 h-3 mr-1" />
                              {item.resources.length} resources
                            </div>
                          )}
                        </div>
                      </div>
                      {item.completed && (
                        <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
