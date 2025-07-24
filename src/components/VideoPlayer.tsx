import React, { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Play, Pause, Download, Volume2 } from 'lucide-react'

interface VideoPlayerProps {
  audioUrl: string
  images: string[]
  script: string
  title: string
  duration: number
}

export function VideoPlayer({ audioUrl, images, script, title, duration }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [currentSlide, setCurrentSlide] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const slideIntervalRef = useRef<NodeJS.Timeout>()

  const slideDuration = duration / images.length

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      
      // Update slide based on time
      const newSlide = Math.floor(audio.currentTime / slideDuration)
      if (newSlide !== currentSlide && newSlide < images.length) {
        setCurrentSlide(newSlide)
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      setCurrentSlide(0)
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [slideDuration, currentSlide, images.length])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play()
      setIsPlaying(true)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const downloadAudio = () => {
    if (!audioUrl) return
    
    const link = document.createElement('a')
    link.href = audioUrl
    link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_audio.mp3`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Video Display Area */}
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          {images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Video slide ${index + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          
          {/* Play overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <Button
                onClick={togglePlay}
                size="lg"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Play className="h-8 w-8" />
              </Button>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={togglePlay}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              disabled={!audioUrl}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-100"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
            
            <span className="text-sm text-gray-600 min-w-[80px]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <Button
            onClick={downloadAudio}
            variant="outline"
            className="w-full flex items-center gap-2"
            disabled={!audioUrl}
          >
            <Download className="h-4 w-4" />
            {audioUrl ? 'Download Audio Track' : 'Audio Not Available'}
          </Button>
        </div>

        {/* Script Display */}
        <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-primary">
          <h3 className="font-semibold text-gray-900 mb-2">Video Script</h3>
          <p className="text-gray-700 leading-relaxed">{script}</p>
        </div>

        {/* Hidden Audio Element */}
        {audioUrl && (
          <audio ref={audioRef} preload="auto">
            <source src={audioUrl} type="audio/mpeg" />
          </audio>
        )}
      </CardContent>
    </Card>
  )
}