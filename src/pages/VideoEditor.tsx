import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Alert, AlertDescription } from '../components/ui/alert'
import { VideoPlayer } from '../components/VideoPlayer'
import { VideoService, AI_VOICES, VideoData } from '../services/videoService'
import { ArrowLeft, Wand2, Play, Loader2, CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react'

export default function VideoEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<any>(null)
  const [templates, setTemplates] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [isLoadingVideo, setIsLoadingVideo] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  const loadData = useCallback(async () => {
    if (!id) {
      console.log('No ID provided to VideoEditor')
      return
    }
    
    console.log('Loading project with ID:', id)
    
    try {
      const [projectData, templatesData] = await Promise.all([
        VideoService.getProject(id),
        VideoService.getTemplates()
      ])
      
      console.log('Project data loaded:', projectData)
      console.log('Templates data loaded:', templatesData)
      
      if (!projectData) {
        console.error('Project not found')
        navigate('/dashboard')
        return
      }
      
      setProject(projectData)
      setTemplates(templatesData)

      // If project is completed and has video data, load it
      if (projectData?.status === 'completed' && projectData.video_url) {
        console.log('Loading video data from:', projectData.video_url)
        setIsLoadingVideo(true)
        try {
          const data = await VideoService.getVideoData(projectData.video_url)
          if (data) {
            console.log('Video data loaded:', data)
            setVideoData(data)
          }
        } catch (error) {
          console.error('Error loading video data:', error)
        } finally {
          setIsLoadingVideo(false)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }, [id, navigate])

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
    console.log('Generate video button clicked!')
    console.log('Project data:', {
      id: project?.id,
      script: project?.script ? 'exists' : 'missing',
      voice_id: project?.voice_id,
      template_id: project?.template_id
    })
    
    if (!project?.script || !project?.voice_id || !project?.template_id) {
      console.log('Missing required fields for video generation')
      alert('Please ensure you have a script, voice, and template selected before generating the video.')
      return
    }
    
    setIsGenerating(true)
    setGenerationProgress(0)
    
    try {
      console.log('Starting video generation process...')
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 1000)

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
      
      console.log('Video generation completed successfully!')
      
    } catch (error) {
      console.error('Error generating video:', error)
      alert('Failed to generate video. Please check the console for details and try again.')
    } finally {
      setIsGenerating(false)
      setTimeout(() => setGenerationProgress(0), 2000)
    }
  }

  const handleRegenerateVideo = async () => {
    if (!project?.id) return
    
    setIsRegenerating(true)
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
      }, 1000)

      const data = await VideoService.regenerateVideo(project.id)

      clearInterval(progressInterval)
      setGenerationProgress(100)
      setVideoData(data)
      
      // Reload project to get updated status
      const updatedProject = await VideoService.getProject(project.id)
      setProject(updatedProject)
      
    } catch (error) {
      console.error('Error regenerating video:', error)
    } finally {
      setIsRegenerating(false)
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

  const isOldVideo = project.video_url && project.video_url.includes('.html')
  const canGenerate = project.script && project.voice_id && project.template_id && !isGenerating && !isRegenerating
  
  // Debug logging for button state with actual values
  console.log('Button state debug with values:', {
    hasScript: !!project.script,
    scriptValue: project.script ? `"${project.script.substring(0, 50)}..."` : 'NULL/EMPTY',
    hasVoiceId: !!project.voice_id,
    voiceIdValue: project.voice_id || 'NULL/EMPTY',
    hasTemplateId: !!project.template_id,
    templateIdValue: project.template_id || 'NULL/EMPTY',
    isGenerating,
    isRegenerating,
    canGenerate,
    isOldVideo
  })

  // Force enable button for testing (temporarily)
  const forceCanGenerate = true

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
            {/* Old Video Alert */}
            {isOldVideo && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This video was created with the previous version and has limited functionality. 
                  Regenerate it to get the full interactive experience with AI voiceover and controls.
                </AlertDescription>
              </Alert>
            )}

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

            {/* Generate/Regenerate Button */}
            <Card>
              <CardContent className="pt-6">
                {isOldVideo ? (
                  <Button
                    onClick={handleRegenerateVideo}
                    disabled={!canGenerate}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                    size="lg"
                  >
                    {isRegenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Regenerating Video...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate with New Features
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={(e) => {
                      console.log('Button clicked! Event:', e)
                      console.log('canGenerate:', canGenerate)
                      console.log('forceCanGenerate:', forceCanGenerate)
                      if (forceCanGenerate) {
                        handleGenerateVideo()
                      } else {
                        console.log('Button is disabled, cannot generate')
                        alert('Button is disabled. Check console for details.')
                      }
                    }}
                    disabled={!forceCanGenerate}
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
                )}
                
                {(isGenerating || isRegenerating) && (
                  <div className="mt-4">
                    <Progress value={generationProgress} className="w-full" />
                    <p className="text-sm text-gray-600 mt-2 text-center">
                      {generationProgress < 20 && "Generating AI voiceover..."}
                      {generationProgress >= 20 && generationProgress < 40 && "Creating visual content..."}
                      {generationProgress >= 40 && generationProgress < 60 && "Processing images..."}
                      {generationProgress >= 60 && generationProgress < 80 && "Combining audio and visuals..."}
                      {generationProgress >= 80 && generationProgress < 100 && "Finalizing your video..."}
                      {generationProgress >= 100 && "Complete! Loading video player..."}
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
                {isLoadingVideo ? (
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                      <p className="text-gray-600">Loading video player...</p>
                    </div>
                  </div>
                ) : project.status === 'completed' && videoData ? (
                  <div className="space-y-4">
                    {isOldVideo && !videoData.audioUrl && (
                      <Alert className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          This is a legacy video with limited features. Audio playback is not available. 
                          Regenerate to get the full interactive experience.
                        </AlertDescription>
                      </Alert>
                    )}
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