import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { VideoService, VideoProject, VideoTemplate, AI_VOICES } from '../services/videoService'
import { 
  Play, 
  Plus, 
  Search, 
  Grid3X3, 
  List, 
  Clock, 
  Video, 
  Wand2, 
  FileText,
  Trash2,
  Download,
  Eye,
  Loader2
} from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<VideoProject[]>([])
  const [templates, setTemplates] = useState<VideoTemplate[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newProject, setNewProject] = useState({
    title: '',
    script: '',
    voiceId: 'alloy',
    templateId: 'template_1'
  })

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [projectsData, templatesData] = await Promise.all([
        VideoService.getProjects(),
        VideoService.getTemplates()
      ])
      setProjects(projectsData)
      setTemplates(templatesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateProject = async () => {
    if (!newProject.title.trim()) return

    setIsCreating(true)
    try {
      const project = await VideoService.createProject(newProject)
      setProjects(prev => [project, ...prev])
      setNewProject({ title: '', script: '', voiceId: 'alloy', templateId: 'template_1' })
      
      // Navigate to editor with the new project
      navigate(`/editor/${project.id}`)
    } catch (error) {
      console.error('Error creating project:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteProject = async (id: string) => {
    try {
      await VideoService.deleteProject(id)
      setProjects(prev => prev.filter(p => p.id !== id))
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  const generateScript = async () => {
    if (!newProject.title.trim()) return

    setIsCreating(true)
    try {
      const script = await VideoService.generateScript(newProject.title)
      setNewProject(prev => ({ ...prev, script }))
    } catch (error) {
      console.error('Error generating script:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.script && project.script.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'generating': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Video className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                EasyVid
              </span>
            </Link>

            <div className="flex items-center space-x-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    New Video
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Video</DialogTitle>
                    <DialogDescription>
                      Start creating your AI-powered video
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Video Title</Label>
                      <Input
                        id="title"
                        placeholder="Enter video title..."
                        value={newProject.title}
                        onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="template">Template</Label>
                      <Select value={newProject.templateId} onValueChange={(value) => setNewProject(prev => ({ ...prev, templateId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="voice">AI Voice</Label>
                      <Select value={newProject.voiceId} onValueChange={(value) => setNewProject(prev => ({ ...prev, voiceId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select voice" />
                        </SelectTrigger>
                        <SelectContent>
                          {AI_VOICES.map((voice) => (
                            <SelectItem key={voice.id} value={voice.id}>
                              {voice.name} - {voice.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="script">Script (Optional)</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generateScript}
                          disabled={isCreating || !newProject.title.trim()}
                        >
                          {isCreating ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <Wand2 className="h-3 w-3 mr-1" />
                          )}
                          Generate with AI
                        </Button>
                      </div>
                      <Textarea
                        id="script"
                        placeholder="Enter your script or generate one with AI..."
                        value={newProject.script}
                        onChange={(e) => setNewProject(prev => ({ ...prev, script: e.target.value }))}
                        rows={4}
                      />
                    </div>

                    <Button 
                      onClick={handleCreateProject} 
                      disabled={isCreating || !newProject.title.trim()}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Video className="h-4 w-4 mr-2" />
                          Create Video
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Video className="h-8 w-8 text-indigo-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Videos</p>
                  <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {projects.filter(p => p.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Loader2 className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Generating</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {projects.filter(p => p.status === 'generating').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Drafts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {projects.filter(p => p.status === 'draft').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="projects">My Videos</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            {/* Search and View Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Projects Grid/List */}
            {filteredProjects.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No videos yet</h3>
                  <p className="text-gray-600 mb-6">Create your first AI-powered video to get started</p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Video
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create New Video</DialogTitle>
                        <DialogDescription>
                          Start creating your AI-powered video
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="title">Video Title</Label>
                          <Input
                            id="title"
                            placeholder="Enter video title..."
                            value={newProject.title}
                            onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                          />
                        </div>
                        
                        <Button 
                          onClick={handleCreateProject} 
                          disabled={isCreating || !newProject.title.trim()}
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                        >
                          {isCreating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Video className="h-4 w-4 mr-2" />
                              Create Video
                            </>
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {filteredProjects.map((project) => (
                  <Card key={project.id} className="group hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">{project.title}</h3>
                          <Badge className={getStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/editor/${project.id}`)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteProject(project.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {project.thumbnail_url && (
                        <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
                          <img
                            src={project.thumbnail_url}
                            alt={project.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{formatDuration(project.duration)}</span>
                        <span>{new Date(project.created_at).toLocaleDateString()}</span>
                      </div>

                      {project.status === 'completed' && project.video_url && (
                        <Button
                          className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                          onClick={() => navigate(`/editor/${project.id}`)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          🎬 Watch AI Video
                        </Button>
                      )}

                      {project.status === 'draft' && (
                        <Button
                          className="w-full mt-4"
                          variant="outline"
                          onClick={() => navigate(`/editor/${project.id}`)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Continue Editing
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
                      <img
                        src={template.thumbnail_url}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="secondary">{template.category}</Badge>
                      <span className="text-sm text-gray-600">{formatDuration(template.duration)}</span>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                          Use Template
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Create Video with {template.name}</DialogTitle>
                          <DialogDescription>
                            Start creating your video using this template
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="title">Video Title</Label>
                            <Input
                              id="title"
                              placeholder="Enter video title..."
                              value={newProject.title}
                              onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value, templateId: template.id }))}
                            />
                          </div>
                          
                          <Button 
                            onClick={handleCreateProject} 
                            disabled={isCreating || !newProject.title.trim()}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                          >
                            {isCreating ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <Video className="h-4 w-4 mr-2" />
                                Create Video
                              </>
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}