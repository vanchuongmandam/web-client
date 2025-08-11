"use client";

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Volume1, VolumeX, Maximize, Minimize } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface CustomVideoPlayerProps extends React.ComponentPropsWithoutRef<'video'> {
    isActive?: boolean;
}

export function CustomVideoPlayer({ isActive = false, ...props }: CustomVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<HTMLDivElement>(null);
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [areControlsVisible, setAreControlsVisible] = useState(true);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // --- Core Playback Logic ---

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (isActive) {
            // The play promise is important to handle autoplay restrictions
            video.play().catch(e => console.error("Autoplay was prevented.", e));
        } else {
            video.pause();
        }
    }, [isActive]);

    // --- Controls Visibility ---
    
    useEffect(() => {
        const player = playerRef.current;
        if (!player) return;

        const hideControls = () => {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            controlsTimeoutRef.current = setTimeout(() => {
                if (isPlaying) setAreControlsVisible(false);
            }, 3000);
        };

        const handleMouseMove = () => {
            setAreControlsVisible(true);
            hideControls();
        };

        player.addEventListener('mousemove', handleMouseMove);
        player.addEventListener('mouseleave', () => { if (isPlaying) setAreControlsVisible(false); });
        
        // Initial hide
        hideControls();

        return () => {
            player.removeEventListener('mousemove', handleMouseMove);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, [isPlaying]);

    // --- Video Event Listeners ---
    
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            if (!isNaN(video.duration)) {
                setCurrentTime(video.currentTime);
                setProgress((video.currentTime / video.duration) * 100);
            }
        };
        const handleLoadedMetadata = () => setDuration(video.duration);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => { setIsPlaying(false); setProgress(0); setCurrentTime(0)};
        const handleVolumeChange = () => { setIsMuted(video.muted); setVolume(video.volume); };
        
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('volumechange', handleVolumeChange);
        
        const handleFullScreenChange = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullScreenChange);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('volumechange', handleVolumeChange);
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
        };
    }, []);

    // --- Control Handlers ---

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent event bubbling
        if (videoRef.current) {
            isPlaying ? videoRef.current.pause() : videoRef.current.play();
        }
    };

    const handleProgressChange = (value: number[]) => {
        if (!videoRef.current || isNaN(duration) || duration === 0) return;
        const newTime = (value[0] / 100) * duration;
        videoRef.current.currentTime = newTime;
        setProgress(value[0]);
    };
    
    const handleVolumeChange = (value: number[]) => {
        if (!videoRef.current) return;
        const newVolume = value[0];
        videoRef.current.volume = newVolume;
        videoRef.current.muted = newVolume === 0;
    }

    const toggleFullScreen = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!playerRef.current) return;
        if (!isFullScreen) {
            playerRef.current.requestFullscreen().catch(err => alert(`Fullscreen Error: ${err.message}`));
        } else {
            document.exitFullscreen();
        }
    }

    const formatTime = (time: number) => {
        if (isNaN(time)) return '00:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const VolumeIcon = isMuted ? VolumeX : volume > 0.5 ? Volume2 : Volume1;

    return (
        <div ref={playerRef} className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-contain" onClick={(e) => togglePlay(e)} {...props} />

            {/* Big Play Button in Center */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-20 w-20 bg-black/50 hover:bg-black/70 text-white rounded-full pointer-events-auto"
                        onClick={togglePlay}
                    >
                        <Play className="h-10 w-10 ml-1" />
                    </Button>
                </div>
            )}
            
            {/* Controls Overlay */}
            <div
                className={cn(
                    "absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 z-20",
                    areControlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <Slider value={[progress]} onValueChange={handleProgressChange} max={100} step={0.1} className="w-full cursor-pointer" />
                
                <div className="flex items-center justify-between text-white mt-2">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white hover:bg-white/20 hover:text-white">
                            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                        </Button>
                        <Popover>
                           <PopoverTrigger asChild>
                               <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white">
                                   <VolumeIcon className="h-6 w-6" />
                               </Button>
                           </PopoverTrigger>
                           <PopoverContent align="start" className="w-auto bg-black/80 border-none p-2 ml-2">
                                <Slider
                                    orientation="vertical"
                                    value={[isMuted ? 0 : volume]}
                                    onValueChange={handleVolumeChange}
                                    max={1}
                                    step={0.05}
                                    className="h-24 w-2 cursor-pointer"
                                />
                           </PopoverContent>
                        </Popover>
                        <span className="text-sm font-mono select-none">{formatTime(currentTime)} / {formatTime(duration)}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={toggleFullScreen} className="text-white hover:bg-white/20 hover:text-white">
                        {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                    </Button>
                </div>
            </div>
        </div>
    );
};
