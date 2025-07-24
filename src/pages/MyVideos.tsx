import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Play, 
  Search, 
  Filter, 
  Clock, 
  Edit, 
  Trash2, 
  Download, 
  Share2,
  MoreVertical,
  Calendar,
  Eye
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { blink } from '@/blink/client'

interface VideoProject {
  id: string
  title: string
  script: string
  template: string
  voice: string
  status: 'draft' | 'generating' | 'completed' | 'error'
  video_data?: any
  created_at: string
  updated_at: string
}

export default function MyVideos() {
  const [videos, setVideos] = useState<VideoProject[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const navigate = useNavigate()

  const statusOptions = [
    { value: 'all', label: 'All Videos', count: 0 },
    { value: 'completed', label: 'Completed', count: 0 },
    { value: 'generating', label: 'Generating', count: 0 },
    { value: 'draft', label: 'Drafts', count: 0 },
    { value: 'error', label: 'Failed', count: 0 }
  ]

  const loadVideos = async () => {
    try {
      setLoading(true)
      const result = await blink.db.video_projects.list({
        orderBy: { updated_at: 'desc' }
      })
      setVideos(result)
    } catch (error) {
      console.error('Error loading videos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVideos()
  }, [])

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         video.script.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || video.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const deleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return
    }

    try {
      await blink.db.video_projects.delete(videoId)
      setVideos(videos.filter(v => v.id !== videoId))
    } catch (error) {
      console.error('Error deleting video:', error)
    }
  }

  const duplicateVideo = async (video: VideoProject) => {
    try {
      const newVideo = await blink.db.video_projects.create({
        title: `${video.title} (Copy)`,
        script: video.script,
        template: video.template,
        voice: video.voice,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      setVideos([newVideo, ...videos])
    } catch (error) {
      console.error('Error duplicating video:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'generating': return 'bg-blue-100 text-blue-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                EasyVid
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link to="/dashboard" className="text-gray-600 hover:text-primary transition-colors">Dashboard</Link>
                <Link to="/templates" className="text-gray-600 hover:text-primary transition-colors">Templates</Link>
                <Link to="/my-videos" className="text-primary font-medium">My Videos</Link>
              </nav>
            </div>
            <div className="flex items-center space-x-3">
              <Link to="/dashboard">
                <Button variant="outline">New Video</Button>
              </Link>
              <Link to="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Videos</h1>
            <p className="text-gray-600">Manage and organize all your video projects</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
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
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Videos Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <Card key={video.id} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardHeader className="p-0">
                  <div className="relative overflow-hidden rounded-t-lg bg-gradient-to-br from-primary/10 to-purple-600/10 h-48 flex items-center justify-center">
                    <div className="text-center">
                      <Play className="h-16 w-16 text-primary/60 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 font-medium">{video.template}</p>
                    </div>
                    <Badge className={`absolute top-3 left-3 ${getStatusColor(video.status)}`}>
                      {video.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/editor?id=${video.id}`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicateVideo(video)}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        {video.status === 'completed' && (
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => deleteVideo(video.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <CardTitle className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                    {video.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 mb-4 line-clamp-2">
                    {video.script.substring(0, 100)}...
                  </CardDescription>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(video.updated_at)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {video.voice}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      className="flex-1"
                      onClick={() => navigate(`/editor?id=${video.id}`)}
                    >
                      {video.status === 'completed' ? 'View' : 'Edit'}
                    </Button>
                    {video.status === 'completed' && (
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVideos.map((video) => (
              <Card key={video.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-purple-600/10 rounded-lg flex items-center justify-center">
                        <Play className="h-8 w-8 text-primary/60" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{video.title}</h3>
                        <p className="text-gray-600 text-sm mb-2 line-clamp-1">
                          {video.script.substring(0, 150)}...
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <Badge className={`${getStatusColor(video.status)} text-xs`}>
                            {video.status}
                          </Badge>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(video.updated_at)}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {video.voice}
                          </span>
                          <span className="capitalize">{video.template}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/editor?id=${video.id}`)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      {video.status === 'completed' && (
                        <Button size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => duplicateVideo(video)}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          {video.status === 'completed' && (
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => deleteVideo(video.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredVideos.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Play className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No videos found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first video to get started'
              }
            </p>
            <Link to="/dashboard">
              <Button>Create New Video</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}