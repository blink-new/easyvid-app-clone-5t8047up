import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { VideoPlayer } from '../components/VideoPlayer'
import { VideoService, AI_VOICES, VideoData } from '../services/videoService'
import { ArrowLeft, Wand2, Play, Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function VideoEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<any>(null)
  const [templates, setTemplates] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)

  const loadData = useCallback(async () => {
    if (!id) return
    
    try {
      const [projectData, templatesData] = await Promise.all([
        VideoService.getProject(id),
        VideoService.getTemplates()
      ])
      
      setProject(projectData)
      setTemplates(templatesData)

      // If project is completed and has video data, load it
      if (projectData?.status === 'completed' && projectData.video_url) {
        const data = await VideoService.getVideoData(projectData.video_url)
        if (data) {
          setVideoData(data)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleGenerateScript = async () => {
    if (!project?.title) return
    
    try {
      const script = await VideoService.generateScript(project.title)
      const updatedProject = await VideoService.updateProject(project.id, { script })
      setProject(updatedProject)
    } catch (error) {
      console.error('Error generating script:', error)
    }
  }

  const handleGenerateVideo = async () => {
    if (!project?.script || !project?.voice_id || !project?.template_id) return
    
    setIsGenerating(true)
    setGenerationProgress(0)
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      const data = await VideoService.generateVideo(
        project.id,
        project.script,
        project.voice_id,
        project.template_id
      )

      clearInterval(progressInterval)
      setGenerationProgress(100)
      setVideoData(data)
      
      // Reload project to get updated status
      const updatedProject = await VideoService.getProject(project.id)
      setProject(updatedProject)
      
    } catch (error) {
      console.error('Error generating video:', error)
    } finally {
      setIsGenerating(false)
      setTimeout(() => setGenerationProgress(0), 2000)
    }
  }

  const handleInputChange = async (field: string, value: string) => {
    try {
      const updatedProject = await VideoService.updateProject(project.id, { [field]: value })
      setProject(updatedProject)
    } catch (error) {
      console.error('Error updating project:', error)
    }
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Loading video editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{project.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant={
                      project.status === 'completed' ? 'default' :
                      project.status === 'generating' ? 'secondary' :
                      project.status === 'failed' ? 'destructive' : 'outline'
                    }
                  >
                    {project.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {project.status === 'generating' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    {project.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                    {project.status}
                  </Badge>
                  {project.duration > 0 && (
                    <span className="text-sm text-gray-500">
                      {Math.floor(project.duration / 60)}:{(project.duration % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Editor */}
          <div className="space-y-6">
            {/* Script Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Video Script
                  <Button
                    onClick={handleGenerateScript}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Wand2 className="h-4 w-4" />
                    AI Generate
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={project.script || ''}
                  onChange={(e) => handleInputChange('script', e.target.value)}
                  placeholder="Enter your video script or click 'AI Generate' to create one automatically..."
                  className="min-h-[120px]"
                />
                {project.script && (
                  <div className="mt-2 text-sm text-gray-500">
                    ~{Math.ceil(project.script.length / 15)} seconds • {project.script.length} characters
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Voice Selection */}
            <Card>
              <CardHeader>
                <CardTitle>AI Voice Selection</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={project.voice_id || 'alloy'}
                  onValueChange={(value) => handleInputChange('voice_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select AI voice" />
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
              </CardContent>
            </Card>

            {/* Template Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Video Template</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={project.template_id || 'template_1'}
                  onValueChange={(value) => handleInputChange('template_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          {template.description && (
                            <div className="text-sm text-gray-500">{template.description}</div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  onClick={handleGenerateVideo}
                  disabled={!project.script || isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Video...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Generate AI Video
                    </>
                  )}
                </Button>
                
                {isGenerating && (
                  <div className="mt-4">
                    <Progress value={generationProgress} className="w-full" />
                    <p className="text-sm text-gray-600 mt-2 text-center">
                      {generationProgress < 30 && "Generating AI voiceover..."}
                      {generationProgress >= 30 && generationProgress < 60 && "Creating visual content..."}
                      {generationProgress >= 60 && generationProgress < 90 && "Combining audio and visuals..."}
                      {generationProgress >= 90 && "Finalizing your video..."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Video Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {project.status === 'completed' && videoData ? (
                  <div className="space-y-4">
                    <VideoPlayer
                      audioUrl={videoData.audioUrl}
                      images={videoData.images}
                      script={videoData.script}
                      title={project.title}
                      duration={videoData.duration}
                    />
                  </div>
                ) : project.status === 'generating' ? (
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                      <p className="text-gray-600">Generating your video...</p>
                    </div>
                  </div>
                ) : project.status === 'failed' ? (
                  <div className="aspect-video bg-red-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <XCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
                      <p className="text-red-600">Video generation failed</p>
                      <Button
                        onClick={handleGenerateVideo}
                        variant="outline"
                        size="sm"
                        className="mt-2"
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Play className="h-8 w-8 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">Generate your video to see preview</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Video Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Video Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">AI Voiceover</div>
                      <div className="text-xs text-gray-500">
                        Voice: {AI_VOICES.find(v => v.id === project.voice_id)?.name || 'Alloy'}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {project.duration > 0 ? `${project.duration}s` : '--'}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">Visual Slideshow</div>
                      <div className="text-xs text-gray-500">
                        Template: {templates.find(t => t.id === project.template_id)?.name || 'Business'}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {project.duration > 0 ? `${project.duration}s` : '--'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}