import { blink } from '../blink/client'

export interface VideoProject {
  id: string
  title: string
  script?: string
  voice_id?: string
  template_id?: string
  status: 'draft' | 'generating' | 'completed' | 'failed'
  video_url?: string
  thumbnail_url?: string
  duration: number
  created_at: string
  updated_at: string
}

export interface VideoTemplate {
  id: string
  name: string
  description?: string
  thumbnail_url?: string
  category?: string
  duration: number
  created_at: string
}

export interface VideoData {
  audioUrl: string
  images: string[]
  script: string
  voiceId: string
  templateId: string
  duration: number
}

export const AI_VOICES = [
  { id: 'alloy', name: 'Alloy', description: 'Neutral, balanced voice' },
  { id: 'echo', name: 'Echo', description: 'Clear, professional voice' },
  { id: 'fable', name: 'Fable', description: 'Warm, storytelling voice' },
  { id: 'onyx', name: 'Onyx', description: 'Deep, authoritative voice' },
  { id: 'nova', name: 'Nova', description: 'Bright, energetic voice' },
  { id: 'shimmer', name: 'Shimmer', description: 'Smooth, elegant voice' }
]

export class VideoService {
  // Get all video projects
  static async getProjects(): Promise<VideoProject[]> {
    try {
      const projects = await blink.db.video_projects.list({
        orderBy: { created_at: 'desc' }
      })
      return projects as VideoProject[]
    } catch (error) {
      console.error('Error fetching projects:', error)
      return []
    }
  }

  // Get all video templates
  static async getTemplates(): Promise<VideoTemplate[]> {
    try {
      const templates = await blink.db.video_templates.list({
        orderBy: { name: 'asc' }
      })
      return templates as VideoTemplate[]
    } catch (error) {
      console.error('Error fetching templates:', error)
      return []
    }
  }

  // Create a new video project
  static async createProject(data: {
    title: string
    script?: string
    voice_id?: string
    template_id?: string
  }): Promise<VideoProject> {
    const id = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const project = await blink.db.video_projects.create({
      id,
      title: data.title,
      script: data.script || '',
      voice_id: data.voice_id || 'alloy',
      template_id: data.template_id || 'template_1',
      status: 'draft',
      duration: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    return project as VideoProject
  }

  // Update a video project
  static async updateProject(id: string, updates: Partial<VideoProject>): Promise<VideoProject> {
    const updated = await blink.db.video_projects.update(id, {
      ...updates,
      updated_at: new Date().toISOString()
    })
    return updated as VideoProject
  }

  // Delete a video project
  static async deleteProject(id: string): Promise<void> {
    await blink.db.video_projects.delete(id)
  }

  // Generate AI video from script
  static async generateVideo(projectId: string, script: string, voiceId: string, templateId: string): Promise<VideoData> {
    try {
      // Update project status to generating
      await this.updateProject(projectId, { status: 'generating' })

      // Generate AI voiceover
      const speechResult = await blink.ai.generateSpeech({
        text: script,
        voice: voiceId as any
      })

      // Generate multiple images for the video based on script content
      const imagePrompts = [
        `Professional business presentation slide with modern design, clean background`,
        `Corporate office environment with professional lighting`,
        `Modern technology and innovation concept with sleek design`,
        `Professional team collaboration in modern workspace`,
        `Success and growth visualization with charts and graphs`
      ]

      const imageResults = await Promise.all(
        imagePrompts.map(prompt => 
          blink.ai.generateImage({
            prompt,
            size: '1024x1024',
            quality: 'high',
            n: 1
          })
        )
      )

      // Upload the audio file to storage
      const audioResponse = await fetch(speechResult.url)
      const audioBlob = await audioResponse.blob()
      const audioFile = new File([audioBlob], `audio_${projectId}.mp3`, { type: 'audio/mpeg' })
      
      const audioUpload = await blink.storage.upload(
        audioFile,
        `videos/${projectId}/audio.mp3`,
        { upsert: true }
      )

      // Use the first generated image as thumbnail
      const thumbnailUrl = imageResults[0].data[0].url
      
      // Calculate duration based on script length (more accurate estimation)
      const duration = Math.ceil(script.length / 15) // ~15 chars per second for speech
      
      // Create a video data structure that includes all assets
      const videoData: VideoData = {
        audioUrl: audioUpload.publicUrl,
        images: imageResults.map(result => result.data[0].url),
        script,
        voiceId,
        templateId,
        duration
      }

      // Store video data as JSON
      const videoDataBlob = new Blob([JSON.stringify(videoData, null, 2)], { type: 'application/json' })
      const videoDataFile = new File([videoDataBlob], `video_${projectId}.json`, { type: 'application/json' })
      
      const videoDataUpload = await blink.storage.upload(
        videoDataFile,
        `videos/${projectId}/video_data.json`,
        { upsert: true }
      )

      // Update project with results - store the video data URL
      await this.updateProject(projectId, {
        status: 'completed',
        video_url: videoDataUpload.publicUrl,
        thumbnail_url: thumbnailUrl,
        duration: duration
      })

      return videoData
    } catch (error) {
      console.error('Error generating video:', error)
      await this.updateProject(projectId, { status: 'failed' })
      throw error
    }
  }

  // Get video data for playback
  static async getVideoData(videoUrl: string): Promise<VideoData | null> {
    try {
      // Check if it's an old HTML format or new JSON format
      if (videoUrl.endsWith('.html')) {
        // For old HTML format, create a mock VideoData structure
        return {
          audioUrl: '', // No audio URL available for old format
          images: [
            'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1024&h=1024&fit=crop',
            'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1024&h=1024&fit=crop',
            'https://images.unsplash.com/photo-1553484771-371a605b060b?w=1024&h=1024&fit=crop'
          ],
          script: 'This video was created with the previous version. Please regenerate to get the full interactive experience.',
          voiceId: 'alloy',
          templateId: 'template_1',
          duration: 60
        }
      } else {
        // New JSON format
        const response = await fetch(videoUrl)
        const videoData = await response.json()
        return videoData as VideoData
      }
    } catch (error) {
      console.error('Error fetching video data:', error)
      return null
    }
  }

  // Generate script from prompt using AI
  static async generateScript(prompt: string): Promise<string> {
    try {
      const result = await blink.ai.generateText({
        prompt: `Create a compelling video script for: ${prompt}. 
        
        The script should be:
        - Engaging and conversational
        - 30-60 seconds when spoken
        - Include a strong hook at the beginning
        - Have a clear call-to-action at the end
        - Be suitable for AI voiceover
        
        Return only the script text, no additional formatting or explanations.`,
        maxTokens: 300
      })

      return result.text
    } catch (error) {
      console.error('Error generating script:', error)
      throw error
    }
  }

  // Get project by ID
  static async getProject(id: string): Promise<VideoProject | null> {
    try {
      // First try to get all projects and filter by ID (more reliable)
      const projects = await blink.db.video_projects.list({
        orderBy: { created_at: 'desc' }
      })
      
      const project = projects.find(p => p.id === id)
      return project as VideoProject || null
    } catch (error) {
      console.error('Error fetching project:', error)
      return null
    }
  }

  // Search projects
  static async searchProjects(query: string): Promise<VideoProject[]> {
    try {
      const projects = await blink.db.video_projects.list({
        orderBy: { created_at: 'desc' }
      })
      
      return projects.filter(project => 
        project.title.toLowerCase().includes(query.toLowerCase()) ||
        (project.script && project.script.toLowerCase().includes(query.toLowerCase()))
      ) as VideoProject[]
    } catch (error) {
      console.error('Error searching projects:', error)
      return []
    }
  }
}