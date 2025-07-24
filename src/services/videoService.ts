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
  static async generateVideo(projectId: string, script: string, voiceId: string, templateId: string): Promise<string> {
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

      // Create a simple video by combining images and audio
      // For now, we'll use the first generated image as a static video thumbnail
      // In a real implementation, you'd combine multiple images with the audio
      const thumbnailUrl = imageResults[0].data[0].url
      
      // Create a video data structure that includes all assets
      const videoData = {
        audioUrl: audioUpload.publicUrl,
        images: imageResults.map(result => result.data[0].url),
        script,
        voiceId,
        templateId,
        duration: Math.ceil(script.length / 15) // More accurate: ~15 chars per second for speech
      }

      // Store video data as JSON for now (in real app, this would generate actual MP4)
      const videoDataBlob = new Blob([JSON.stringify(videoData, null, 2)], { type: 'application/json' })
      const videoDataFile = new File([videoDataBlob], `video_${projectId}.json`, { type: 'application/json' })
      
      const videoDataUpload = await blink.storage.upload(
        videoDataFile,
        `videos/${projectId}/video_data.json`,
        { upsert: true }
      )

      // Create an interactive HTML video player that combines the assets
      const videoPlayerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Generated Video - ${script.substring(0, 50)}...</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .video-container {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 800px;
            width: 100%;
        }
        .video-player {
            width: 100%;
            aspect-ratio: 16/9;
            background: #000;
            border-radius: 8px;
            overflow: hidden;
            position: relative;
            margin-bottom: 20px;
        }
        .video-slide {
            width: 100%;
            height: 100%;
            object-fit: cover;
            position: absolute;
            opacity: 0;
            transition: opacity 1s ease-in-out;
        }
        .video-slide.active {
            opacity: 1;
        }
        .controls {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
        }
        .play-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
        }
        .play-btn:hover {
            background: #5a67d8;
        }
        .progress {
            flex: 1;
            height: 4px;
            background: #e2e8f0;
            border-radius: 2px;
            overflow: hidden;
        }
        .progress-bar {
            height: 100%;
            background: #667eea;
            width: 0%;
            transition: width 0.1s ease;
        }
        .time {
            font-size: 14px;
            color: #64748b;
            min-width: 80px;
        }
        .script {
            background: #f8fafc;
            padding: 16px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            margin-bottom: 16px;
        }
        .script h3 {
            margin: 0 0 8px 0;
            color: #1e293b;
        }
        .script p {
            margin: 0;
            color: #475569;
            line-height: 1.6;
        }
        .download-btn {
            background: #10b981;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            width: 100%;
        }
        .download-btn:hover {
            background: #059669;
        }
    </style>
</head>
<body>
    <div class="video-container">
        <div class="video-player" id="videoPlayer">
            ${imageResults.map((result, index) => 
              `<img src="${result.data[0].url}" alt="Video slide ${index + 1}" class="video-slide ${index === 0 ? 'active' : ''}" id="slide${index}">`
            ).join('')}
        </div>
        
        <div class="controls">
            <button class="play-btn" id="playBtn">▶ Play</button>
            <div class="progress">
                <div class="progress-bar" id="progressBar"></div>
            </div>
            <div class="time" id="timeDisplay">0:00 / ${Math.floor(videoData.duration / 60)}:${(videoData.duration % 60).toString().padStart(2, '0')}</div>
        </div>
        
        <div class="script">
            <h3>Video Script</h3>
            <p>${script}</p>
        </div>
        
        <button class="download-btn" onclick="downloadAudio()">
            📥 Download Audio Track
        </button>
    </div>

    <audio id="audioPlayer" preload="auto">
        <source src="${audioUpload.publicUrl}" type="audio/mpeg">
    </audio>

    <script>
        const audio = document.getElementById('audioPlayer');
        const playBtn = document.getElementById('playBtn');
        const progressBar = document.getElementById('progressBar');
        const timeDisplay = document.getElementById('timeDisplay');
        const slides = document.querySelectorAll('.video-slide');
        
        let isPlaying = false;
        let currentSlide = 0;
        const slideDuration = ${videoData.duration} / ${imageResults.length};
        
        playBtn.addEventListener('click', () => {
            if (isPlaying) {
                audio.pause();
                playBtn.textContent = '▶ Play';
                isPlaying = false;
            } else {
                audio.play();
                playBtn.textContent = '⏸ Pause';
                isPlaying = true;
                startSlideshow();
            }
        });
        
        audio.addEventListener('timeupdate', () => {
            const progress = (audio.currentTime / audio.duration) * 100;
            progressBar.style.width = progress + '%';
            
            const currentTime = Math.floor(audio.currentTime);
            const totalTime = Math.floor(audio.duration);
            timeDisplay.textContent = formatTime(currentTime) + ' / ' + formatTime(totalTime);
        });
        
        audio.addEventListener('ended', () => {
            playBtn.textContent = '▶ Play';
            isPlaying = false;
            progressBar.style.width = '0%';
            currentSlide = 0;
            showSlide(0);
        });
        
        function startSlideshow() {
            const slideInterval = setInterval(() => {
                if (!isPlaying) {
                    clearInterval(slideInterval);
                    return;
                }
                
                currentSlide = (currentSlide + 1) % slides.length;
                showSlide(currentSlide);
            }, slideDuration * 1000);
        }
        
        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
            });
        }
        
        function formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return mins + ':' + secs.toString().padStart(2, '0');
        }
        
        function downloadAudio() {
            const link = document.createElement('a');
            link.href = '${audioUpload.publicUrl}';
            link.download = 'generated_audio.mp3';
            link.click();
        }
    </script>
</body>
</html>`

      // Upload the video player HTML
      const videoPlayerBlob = new Blob([videoPlayerHtml], { type: 'text/html' })
      const videoPlayerFile = new File([videoPlayerBlob], `video_${projectId}.html`, { type: 'text/html' })
      
      const videoPlayerUpload = await blink.storage.upload(
        videoPlayerFile,
        `videos/${projectId}/player.html`,
        { upsert: true }
      )

      // Update project with results
      await this.updateProject(projectId, {
        status: 'completed',
        video_url: videoPlayerUpload.publicUrl,
        thumbnail_url: thumbnailUrl,
        duration: videoData.duration
      })

      return videoPlayerUpload.publicUrl
    } catch (error) {
      console.error('Error generating video:', error)
      await this.updateProject(projectId, { status: 'failed' })
      throw error
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
      const projects = await blink.db.video_projects.list({
        where: { id }
      })
      return projects[0] as VideoProject || null
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