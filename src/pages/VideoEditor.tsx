import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Progress } from '../components/ui/progress'
import { Badge } from '../components/ui/badge'
import { VideoService, VideoProject, VideoTemplate, AI_VOICES } from '../services/videoService'
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Download, 
  Save, 
  Wand2, 
  Video, 
  Volume2, 
  Settings, 
  Eye,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react'

export default function VideoEditor() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('project')

  const [project, setProject] = useState<VideoProject | null>(null)
  const [templates, setTemplates] = useState<VideoTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStep, setGenerationStep] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    script: '',
    voiceId: 'alloy',
    templateId: 'template_1'
  })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [templatesData, projectData] = await Promise.all([
        VideoService.getTemplates(),
        projectId ? VideoService.getProject(projectId) : Promise.resolve(null)
      ])
      
      setTemplates(templatesData)
      
      if (projectData) {
        setProject(projectData)
        setFormData({
          title: projectData.title,
          script: projectData.script || '',
          voiceId: projectData.voice_id || 'alloy',
          templateId: projectData.template_id || 'template_1'
        })
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSave = async () => {
    if (!project) return

    setIsSaving(true)
    try {
      const updatedProject = await VideoService.updateProject(project.id, {
        title: formData.title,
        script: formData.script,
        voice_id: formData.voiceId,
        template_id: formData.templateId
      })
      setProject(updatedProject)
    } catch (error) {
      console.error('Error saving project:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const generateScript = async () => {
    if (!formData.title.trim()) return

    setIsGenerating(true)
    setGenerationStep('Generating script with AI...')
    setGenerationProgress(25)

    try {
      const script = await VideoService.generateScript(formData.title)
      setFormData(prev => ({ ...prev, script }))
      setGenerationProgress(100)
      setGenerationStep('Script generated successfully!')
      
      setTimeout(() => {
        setGenerationProgress(0)
        setGenerationStep('')
      }, 2000)
    } catch (error) {
      console.error('Error generating script:', error)
      setGenerationStep('Failed to generate script')
    } finally {
      setIsGenerating(false)
    }
  }

  const generateVideo = async () => {
    if (!project || !formData.script.trim()) return

    setIsGenerating(true)
    setGenerationProgress(0)
    
    try {
      // Save current changes first
      await handleSave()
      
      // Simulate generation steps
      setGenerationStep('Preparing video generation...')
      setGenerationProgress(10)
      await new Promise(resolve => setTimeout(resolve, 1000))

      setGenerationStep('Generating AI voiceover...')
      setGenerationProgress(30)
      await new Promise(resolve => setTimeout(resolve, 2000))

      setGenerationStep('Creating video scenes...')
      setGenerationProgress(60)
      await new Promise(resolve => setTimeout(resolve, 2000))

      setGenerationStep('Rendering final video...')
      setGenerationProgress(90)

      // Generate the actual video
      const videoUrl = await VideoService.generateVideo(
        project.id,
        formData.script,
        formData.voiceId,
        formData.templateId
      )

      setGenerationProgress(100)
      setGenerationStep('Video generated successfully!')

      // Reload project to get updated data
      const updatedProject = await VideoService.getProject(project.id)
      if (updatedProject) {
        setProject(updatedProject)
      }

      setTimeout(() => {
        setGenerationProgress(0)
        setGenerationStep('')
      }, 3000)
    } catch (error) {
      console.error('Error generating video:', error)
      setGenerationStep('Failed to generate video')
    } finally {
      setIsGenerating(false)
    }
  }

  const selectedTemplate = templates.find(t => t.id === formData.templateId)
  const selectedVoice = AI_VOICES.find(v => v.id === formData.voiceId)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600">Loading video editor...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Project Not Found</h3>
            <p className="text-gray-600 mb-6">The video project you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{project.title}</h1>
                <div className="flex items-center space-x-2">
                  <Badge className={
                    project.status === 'completed' ? 'bg-green-100 text-green-800' :
                    project.status === 'generating' ? 'bg-blue-100 text-blue-800' :
                    project.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {project.status}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Last updated {new Date(project.updated_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>

              <Button
                onClick={generateVideo}
                disabled={isGenerating || !formData.script.trim()}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Video className="h-4 w-4 mr-2" />
                )}
                Generate Video
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Generation Progress */}
      {isGenerating && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">{generationStep}</p>
                <Progress value={generationProgress} className="mt-2" />
              </div>
              <span className="text-sm text-blue-700">{generationProgress}%</span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Editor */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Video Details</CardTitle>
                <CardDescription>Configure your video settings and content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="title">Video Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter video title..."
                  />
                </div>

                <div>
                  <Label htmlFor="template">Template</Label>
                  <Select value={formData.templateId} onValueChange={(value) => setFormData(prev => ({ ...prev, templateId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center space-x-2">
                            <span>{template.name}</span>
                            <Badge variant="secondary" className="text-xs">{template.category}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTemplate && (
                    <p className="text-sm text-gray-600 mt-1">{selectedTemplate.description}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="voice">AI Voice</Label>
                  <Select value={formData.voiceId} onValueChange={(value) => setFormData(prev => ({ ...prev, voiceId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_VOICES.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          <div>
                            <div className="font-medium">{voice.name}</div>
                            <div className="text-sm text-gray-500">{voice.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedVoice && (
                    <div className="flex items-center space-x-2 mt-2">
                      <Volume2 className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{selectedVoice.description}</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="script">Video Script</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateScript}
                      disabled={isGenerating || !formData.title.trim()}
                    >
                      {isGenerating ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Wand2 className="h-3 w-3 mr-1" />
                      )}
                      Generate with AI
                    </Button>
                  </div>
                  <Textarea
                    id="script"
                    value={formData.script}
                    onChange={(e) => setFormData(prev => ({ ...prev, script: e.target.value }))}
                    placeholder="Enter your video script or generate one with AI..."
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                    <span>{formData.script.length} characters</span>
                    <span>~{Math.ceil(formData.script.length / 10)} seconds</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline/Storyboard */}
            <Card>
              <CardHeader>
                <CardTitle>Video Timeline</CardTitle>
                <CardDescription>Preview your video structure</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-12 bg-indigo-100 rounded flex items-center justify-center">
                      <Video className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Intro Scene</h4>
                      <p className="text-sm text-gray-600">Opening with title and hook</p>
                    </div>
                    <Badge variant="outline">0:00 - 0:05</Badge>
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-12 bg-purple-100 rounded flex items-center justify-center">
                      <Volume2 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Main Content</h4>
                      <p className="text-sm text-gray-600">AI voiceover with visuals</p>
                    </div>
                    <Badge variant="outline">0:05 - 0:{Math.max(25, Math.ceil(formData.script.length / 10))}</Badge>
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-12 bg-amber-100 rounded flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Call to Action</h4>
                      <p className="text-sm text-gray-600">Closing with CTA</p>
                    </div>
                    <Badge variant="outline">0:{Math.max(25, Math.ceil(formData.script.length / 10))} - 0:{Math.max(30, Math.ceil(formData.script.length / 10) + 5)}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Video Preview</CardTitle>
                <CardDescription>
                  {project.status === 'completed' ? 'Your generated video' : 'Preview will appear after generation'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
                  {project.status === 'completed' && project.video_url ? (
                    <div className="relative w-full h-full">
                      <img
                        src={project.thumbnail_url}
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Play className="h-16 w-16 mx-auto mb-3 opacity-90" />
                          <p className="text-lg font-medium">Video Ready!</p>
                          <p className="text-sm opacity-75">Click below to watch</p>
                        </div>
                      </div>
                    </div>
                  ) : project.thumbnail_url ? (
                    <div className="relative w-full h-full">
                      <img
                        src={project.thumbnail_url}
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Video className="h-12 w-12 mx-auto mb-2 opacity-75" />
                          <p className="text-sm">Video generating...</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <Video className="h-12 w-12 mx-auto mb-2" />
                        <p className="text-sm">No preview available</p>
                      </div>
                    </div>
                  )}
                </div>

                {project.status === 'completed' && project.video_url && (
                  <div className="space-y-3">
                    <Button
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                      onClick={() => {
                        console.log('Opening video player:', project.video_url)
                        window.open(project.video_url, '_blank')
                      }}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      🎬 Watch Your AI Video
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        console.log('Opening video in new tab:', project.video_url)
                        const newWindow = window.open(project.video_url, '_blank')
                        if (!newWindow) {
                          alert('Please allow popups to view your video')
                        }
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      🎥 Open Interactive Player
                    </Button>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mt-2">
                        ✨ Your video includes AI voiceover, slideshow visuals, and downloadable audio
                      </p>
                      <p className="text-xs text-indigo-600 mt-1 font-medium">
                        Click above to watch your generated video!
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Project Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Project Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Duration</span>
                  <span className="font-medium">
                    {Math.floor(project.duration / 60)}:{(project.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Template</span>
                  <span className="font-medium">{selectedTemplate?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Voice</span>
                  <span className="font-medium">{selectedVoice?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="font-medium">{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}