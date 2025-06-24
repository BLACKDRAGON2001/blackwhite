// Optimized Event Delegation and Utilities
const EventUtils = {
  // Efficient event delegation
  delegate(container, selector, event, handler) {
    container.addEventListener(event, (e) => {
      if (e.target.matches(selector)) {
        handler.call(e.target, e);
      }
    });
  },

  // Optimized throttle with RAF for smooth animations
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Debounce for expensive operations
  debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
};

// Optimized localStorage operations with batching
const StorageManager = {
  cache: new Map(),
  pendingWrites: new Map(),
  
  // Batched localStorage writes
  set(key, value) {
    this.cache.set(key, value);
    this.pendingWrites.set(key, value);
    this.debouncedFlush();
  },

  get(key) {
    return this.cache.has(key) ? this.cache.get(key) : localStorage.getItem(key);
  },

  remove(key) {
    this.cache.delete(key);
    localStorage.removeItem(key);
  },

  // Flush pending writes in batches
  flush() {
    for (const [key, value] of this.pendingWrites) {
      localStorage.setItem(key, value);
    }
    this.pendingWrites.clear();
  },

  debouncedFlush: null,

  init() {
    this.debouncedFlush = EventUtils.debounce(() => this.flush(), 100);
    // Preload cache
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      this.cache.set(key, localStorage.getItem(key));
    }
  },

  clearAudioStorage() {
    const keysToRemove = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith('musicIndex') || key.startsWith('isMusicPaused') || 
          key.startsWith('volumeLevel') || key.startsWith('playerState')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => this.remove(key));
  }
};

// Optimized DOM utilities
const DOMUtils = {
  // Efficient element creation with attributes
  createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'textContent') {
        element.textContent = value;
      } else {
        element.setAttribute(key, value);
      }
    });
    children.forEach(child => element.appendChild(child));
    return element;
  },

  // Batch DOM operations
  batchUpdate(element, updates) {
    const display = element.style.display;
    element.style.display = 'none';
    updates();
    element.style.display = display;
  },

  // Efficient class manipulation
  toggleClasses(element, classes, condition) {
    classes.forEach(cls => element.classList.toggle(cls, condition));
  }
};

// Optimized Audio Management
class AudioManager {
  constructor() {
    this.audioCache = new Map();
    this.preloadQueue = [];
    this.maxCacheSize = 5;
    // Cloudflare R2 bucket URL for audio files
    this.audioBaseUrl = 'https://pub-c755c6dec2fa41a5a9f9a659408e2150.r2.dev/';
  }

  // Preload audio with priority queue
  preloadAudio(src, priority = 0) {
    if (this.audioCache.has(src)) return Promise.resolve(this.audioCache.get(src));
    
    return new Promise((resolve, reject) => {
      const audio = new Audio(`${this.audioBaseUrl}${src}.mp3`);
      audio.preload = 'auto';
      
      const cleanup = () => {
        audio.removeEventListener('canplaythrough', onLoad);
        audio.removeEventListener('error', onError);
      };

      const onLoad = () => {
        cleanup();
        this.addToCache(src, audio);
        resolve(audio);
      };

      const onError = () => {
        cleanup();
        reject(new Error(`Failed to load audio: ${src}`));
      };

      audio.addEventListener('canplaythrough', onLoad, { once: true });
      audio.addEventListener('error', onError, { once: true });
    });
  }

  addToCache(src, audio) {
    if (this.audioCache.size >= this.maxCacheSize) {
      const firstKey = this.audioCache.keys().next().value;
      this.audioCache.delete(firstKey);
    }
    this.audioCache.set(src, audio);
  }

  getDuration(src) {
    return new Promise((resolve) => {
      if (this.audioCache.has(src)) {
        resolve(this.audioCache.get(src).duration);
        return;
      }

      const audio = new Audio(`${this.audioBaseUrl}${src}.mp3`);
      audio.addEventListener('loadedmetadata', () => {
        const duration = isNaN(audio.duration) ? 0 : audio.duration;
        resolve(duration);
      }, { once: true });
      audio.addEventListener('error', () => resolve(0), { once: true });
    });
  }
}

// Main click event handler - optimized
document.addEventListener('click', function(e) {
    if (e.target.id === 'title' || e.target.id === 'title2') {
        clearAllAudioLocalStorage();
        const page = e.target.id === 'title' ? 'HomePage' : 'DisguisePage';
        handleLogout(page);
    }
}, { passive: true });

// Optimized audio storage clearing
function clearAllAudioLocalStorage() {
    StorageManager.clearAudioStorage();
}

// Optimized input clearing
function clearInputFields() {
    const inputIds = [
        'usernameInput', 'passwordInput', 'usernameInput2', 
        'passwordInput2', 'usernameInput3', 'passwordInput3'
    ];
    
    // Batch DOM updates
    requestAnimationFrame(() => {
        inputIds.forEach(id => {
            const input = document.getElementById(id);
            if (input) input.value = '';
        });
    });
}

// Optimized logout handler
function handleLogout(page) {
    const pageElement = document.getElementById(page);
    const videoElement = document.getElementById('video');
    
    // Batch DOM updates
    requestAnimationFrame(() => {
        if (pageElement) pageElement.style.display = 'none';
        document.body.style.backgroundColor = 'white';
        
        if (videoElement) {
            videoElement.style.display = 'none';
            videoElement.pause();
            videoElement.currentTime = 0;
        }
    });

    StorageManager.remove('LoginTime');
    clearInputFields();
    
    // Reset both players efficiently
    [window.homePlayer, window.disguisePlayer].forEach(player => {
        if (player) resetPlayer(player);
    });
}

// Optimized player reset
function resetPlayer(player) {
    if (!player) return;
    
    // Batch state updates
    Object.assign(player, {
        musicIndex: 1,
        isMusicPaused: true,
        isShuffleMode: false,
        isMuted: false,
        controlsToggledManually: false
    });

    // Batch DOM updates
    requestAnimationFrame(() => {
        // Reset player state UI
        DOMUtils.toggleClasses(player.wrapper, ['paused', 'dark-mode'], false);
        player.playPauseBtn.querySelector("i").textContent = "play_arrow";
        player.progressBar.style.width = "0%";
        
        // Reset time displays
        const currentTimeEl = player.wrapper.querySelector(".current-time");
        const maxDurationEl = player.wrapper.querySelector(".max-duration");
        if (currentTimeEl) currentTimeEl.textContent = "0:00";
        if (maxDurationEl) maxDurationEl.textContent = "0:00";
        
        // Reset repeat button
        Object.assign(player.repeatBtn, {
            textContent: "repeat",
            title: "Playlist looped"
        });

        // Reset video if exists
        if (player.videoAd) {
            Object.assign(player.videoAd.style, { display: "none" });
            player.videoAd.pause();
            player.videoAd.currentTime = 0;
            player.videoAd.muted = true;
            DOMUtils.toggleClasses(player.videoAd, ['bigger-video'], false);
            DOMUtils.toggleClasses(player.videoAd, ['overlay-video'], true);
            player.videoAd.controls = false;
        }
    });

    // Async operations
    player.loadMusic(1);
    player.pauseMusic();
    player.closeMusicList();
    player.populateMusicList(player.originalOrder);
    
    // Reset dark mode
    const fontAwesome = document.getElementById(`fontawesome-icons${player.suffix}`);
    if (fontAwesome) fontAwesome.classList.remove("Dark");
    player.listcolourwhite();
}

// Highly optimized MusicPlayer class
class MusicPlayer {
    constructor(suffix = '') {
        this.suffix = suffix;
        this.imageFolder = suffix === '2' ? 'ImagesDisguise/' : 'Images/';
        this.audioManager = new AudioManager();
        // Cloudflare R2 bucket URL for audio files
        this.audioBaseUrl = 'https://pub-c755c6dec2fa41a5a9f9a659408e2150.r2.dev/';
        
        this.cacheElements();
        this.initState();
        this.setupEventListeners();
        this.loadPersistedState();
        this.populateMusicList(this.originalOrder);
        this.updatePlayingSong();
    }

    cacheElements() {
        // Cache wrapper first
        this.wrapper = document.querySelector(`#wrapper${this.suffix}`);
        
        // Cache all child elements efficiently
        this.coverArea = this.wrapper.querySelector(".img-area");
        this.musicName = this.wrapper.querySelector(".song-details .name");
        this.musicArtist = this.wrapper.querySelector(".song-details .artist");
        this.playPauseBtn = this.wrapper.querySelector(".play-pause");
        this.prevBtn = this.wrapper.querySelector(`#prev${this.suffix}`);
        this.nextBtn = this.wrapper.querySelector(`#next${this.suffix}`);
        this.mainAudio = this.wrapper.querySelector(`#main-audio${this.suffix}`);
        this.videoAd = this.suffix === '2' ? null : this.wrapper.querySelector(`#video${this.suffix}`);
        this.progressArea = this.wrapper.querySelector(".progress-area");
        this.progressBar = this.progressArea.querySelector(".progress-bar");
        this.musicList = this.wrapper.querySelector(".music-list");
        this.moreMusicBtn = this.wrapper.querySelector(`#more-music${this.suffix}`);
        this.closeMoreMusicBtn = this.musicList.querySelector(`#close${this.suffix}`);
        this.modeToggle = document.getElementById(`modeToggle${this.suffix}`);
        this.muteButton = document.getElementById(`muteButton${this.suffix}`);
        this.header = this.wrapper.querySelector(".row");
        this.ulTag = this.wrapper.querySelector("ul");
        this.repeatBtn = this.wrapper.querySelector(`#repeat-plist${this.suffix}`);
    }

    initState() {
        this.musicIndex = 1;
        this.isMusicPaused = true;
        this.isShuffleMode = false;
        this.originalOrder = [...allMusic];
        this.shuffledOrder = [];
        this.isMuted = false;
        this.controlsToggledManually = false;
    }

    setupEventListeners() {
        // Use passive event listeners where possible
        const passiveOptions = { passive: true };
        
        this.playPauseBtn.addEventListener("click", () => this.togglePlayPause());
        this.prevBtn.addEventListener("click", () => this.changeMusic(-1));
        this.nextBtn.addEventListener("click", () => this.changeMusic(1));
        this.progressArea.addEventListener("click", (e) => this.handleProgressClick(e));
        this.moreMusicBtn.addEventListener("click", () => this.toggleMusicList());
        this.closeMoreMusicBtn.addEventListener("click", () => this.closeMusicList());
        this.modeToggle.addEventListener("click", () => this.toggleDarkMode());
        this.muteButton.addEventListener("click", () => this.handleMute());
        this.repeatBtn.addEventListener("click", () => this.handleRepeat());
        this.musicName.addEventListener("click", () => this.toggleVideoControls());

        this.mainAudio.addEventListener("timeupdate", (e) => this.updateProgress(e), passiveOptions);
        this.mainAudio.addEventListener("ended", () => this.handleSongEnd());
        this.mainAudio.addEventListener("pause", () => this.handleAudioPause());
        this.mainAudio.addEventListener("play", () => this.handleAudioPlay());

        if (this.videoAd) {
            this.videoAd.addEventListener("ended", () => this.handleVideoEnd());
        }
    }

    loadPersistedState() {
        const storedMusicIndex = StorageManager.get(`musicIndex${this.suffix}`);
        if (storedMusicIndex) {
            this.musicIndex = parseInt(storedMusicIndex, 10);
            this.loadMusic(this.musicIndex);
            if (StorageManager.get(`isMusicPaused${this.suffix}`) === "false") {
                this.playMusic();
            }
        } else {
            this.loadMusic(this.musicIndex);
        }
    }

    // Optimized throttle function
    throttle(func, limit) {
        let lastFunc;
        let lastRan;
        return function() {
            const context = this;
            const args = arguments;
            if (!lastRan) {
                func.apply(context, args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(function() {
                    if ((Date.now() - lastRan) >= limit) {
                        func.apply(context, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    }

    async loadMusic(index) {
        const music = this.isShuffleMode ? this.shuffledOrder[index - 1] : this.originalOrder[index - 1];
        this.musicName.textContent = music.name;
        this.musicArtist.textContent = music.artist;

        const { coverType = 'Images', src, type = 'jpg' } = music;
        
        // Clear previous media efficiently
        while (this.coverArea.firstChild) {
            this.coverArea.removeChild(this.coverArea.firstChild);
        }

        const mediaElement = coverType === 'video' && this.suffix !== '2' ?
            this.createVideoElement(src, type) :
            this.createImageElement(src, type);
        this.coverArea.appendChild(mediaElement);

        // Load audio from Cloudflare R2 bucket
        this.mainAudio.src = `${this.audioBaseUrl}${src}.mp3`;
        if (this.videoAd) {
            this.videoAd.src = `https://pub-fb9b941e940b4b44a61b7973d5ba28c3.r2.dev/${src}.mp4`;
        }

        StorageManager.set(`musicIndex${this.suffix}`, index);
        this.updatePlayingSong();
    }

    createVideoElement(src, type) {
        const video = document.createElement('video');
        video.src = `https://pub-fb9b941e940b4b44a61b7973d5ba28c3.r2.dev/${src}.${type}`;
        video.controls = true;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.classList.add("overlay-video");
        video.setAttribute('preload', 'auto');
        return video;
    }

    createImageElement(src, type) {
        const img = new Image();
        img.src = `${this.imageFolder}${src}.${type}`;
        img.alt = this.musicName.textContent;
        img.loading = 'lazy'; // Lazy loading for images
        return img;
    }

    togglePlayPause() {
        this.isMusicPaused ? this.playMusic() : this.pauseMusic();
    }

    playMusic() {
        this.wrapper.classList.add("paused");
        this.playPauseBtn.querySelector("i").textContent = "pause";
        this.mainAudio.play().catch(e => console.error("Playback failed:", e));
        this.isMusicPaused = false;
        StorageManager.set(`isMusicPaused${this.suffix}`, "false");
        if (this.videoAd) {
            this.toggleVideoDisplay(false);
            this.resetVideoSize();
        }
    }

    pauseMusic() {
        this.wrapper.classList.remove("paused");
        this.playPauseBtn.querySelector("i").textContent = "play_arrow";
        this.mainAudio.pause();
        this.isMusicPaused = true;
        StorageManager.set(`isMusicPaused${this.suffix}`, "true");
        if (this.videoAd) {
            this.toggleVideoDisplay(true);
            this.muteVideo();
            this.resetVideoSize();
        }
    }

    resetVideoSize() {
        if (!this.videoAd) return;
        this.videoAd.classList.remove("bigger-video");
        this.videoAd.classList.add("overlay-video");
        this.videoAd.controls = false;
        this.controlsToggledManually = false;
        this.videoAd.loop = true;
    }

    toggleVideoDisplay(show) {
        if (!this.videoAd) return;
        this.videoAd.style.display = show ? "block" : "none";
        show ? this.videoAd.play().catch(e => {}) : this.videoAd.pause();
    }

    muteVideo() {
        if (this.videoAd) this.videoAd.muted = true;
    }

    changeMusic(direction) {
        const length = this.isShuffleMode ? this.shuffledOrder.length : this.originalOrder.length;
        this.musicIndex = (this.musicIndex + direction + length - 1) % length + 1;
        this.loadMusic(this.musicIndex);
        this.playMusic();
    }

    handleProgressClick(e) {
        const clickedOffsetX = e.offsetX;
        const songDuration = this.mainAudio.duration;
        this.mainAudio.currentTime = (clickedOffsetX / this.progressArea.clientWidth) * songDuration;
        this.playMusic();
    }

    updateProgress = this.throttle(function(e) {
        const { currentTime, duration } = e.target;
        this.progressBar.style.width = `${(currentTime / duration) * 100}%`;

        const formatTime = (time) => {
            const min = Math.floor(time / 60);
            const sec = Math.floor(time % 60).toString().padStart(2, "0");
            return `${min}:${sec}`;
        };

        this.wrapper.querySelector(".current-time").textContent = formatTime(currentTime);
        if (!isNaN(duration)) {
            this.wrapper.querySelector(".max-duration").textContent = formatTime(duration);
        }
    }, 100);

    handleRepeat() {
      switch (this.repeatBtn.textContent) {
          case "repeat":
              this.repeatBtn.textContent = "repeat_one";
              this.repeatBtn.title = "Song looped";
              break;
          case "repeat_one":
              this.repeatBtn.textContent = "shuffle";
              this.repeatBtn.title = "Playback shuffled";
              this.isShuffleMode = true;
  
              const currentMusic = this.originalOrder[this.musicIndex - 1];
              this.shuffledOrder = [...this.originalOrder]
                  .filter(m => m !== currentMusic)
                  .sort(() => Math.random() - 0.5);
              this.shuffledOrder.unshift(currentMusic);
              this.musicIndex = 1;
  
              this.populateMusicList(this.shuffledOrder);
              this.loadMusic(this.musicIndex);
              this.playMusic();
              break;
          case "shuffle":
              this.repeatBtn.textContent = "repeat";
              this.repeatBtn.title = "Playlist looped";
              this.isShuffleMode = false;
  
              const currentMusicShuffled = this.shuffledOrder[this.musicIndex - 1];
              const originalIndex = this.originalOrder.findIndex(m => m === currentMusicShuffled);
              this.musicIndex = originalIndex + 1;
  
              this.populateMusicList(this.originalOrder);
              this.loadMusic(this.musicIndex);
              this.playMusic();
              break;
      }
  }  

    handleSongEnd() {
        const mode = this.repeatBtn.textContent;
        if (mode === "repeat_one") {
            this.mainAudio.currentTime = 0;
            this.playMusic();
        } else if (this.isShuffleMode || mode === "shuffle") {
            this.musicIndex = Math.floor(Math.random() * this.shuffledOrder.length) + 1;
            this.loadMusic(this.musicIndex);
            this.playMusic();
        } else {
            this.musicIndex = (this.musicIndex % this.originalOrder.length) + 1;
            this.loadMusic(this.musicIndex);
            this.playMusic();
        }
    }

    toggleMusicList() {
        this.musicList.classList.toggle("show");
    }

    closeMusicList() {
        this.musicList.classList.remove("show");
    }

    populateMusicList(musicArray) {
      this.ulTag.innerHTML = ""; // Clear first
  
      musicArray.forEach((music, i) => {
          const liTag = document.createElement("li");
          liTag.setAttribute("li-index", i + 1);
  
          liTag.innerHTML = `
              <div class="row">
                  <span>${music.name}</span>
                  <p>${music.artist}</p>
              </div>
              <span class="audio-duration" data-src="${music.src}">...</span>
          `;
  
          liTag.addEventListener("click", () => {
              this.musicIndex = i + 1;
              this.loadMusic(this.musicIndex);
              this.playMusic();
          });
  
          this.ulTag.appendChild(liTag);
  
          // Lazy load duration
          const durationSpan = liTag.querySelector(".audio-duration");
          this.audioManager.getDuration(music.src).then(duration => {
              const totalMin = Math.floor(duration / 60);
              const totalSec = Math.floor(duration % 60).toString().padStart(2, "0");
              durationSpan.textContent = isNaN(duration) ? "0:00" : `${totalMin}:${totalSec}`;
          });
      });
  
      this.updatePlayingSong();
  }          

    updatePlayingSong() {
        const allLiTags = this.ulTag.querySelectorAll("li");
        allLiTags.forEach(liTag => {
            const audioTag = liTag.querySelector(".audio-duration");
            const isPlaying = liTag.getAttribute("li-index") == this.musicIndex;

            if (!audioTag.hasAttribute("t-duration")) {
                audioTag.setAttribute("t-duration", audioTag.textContent);
            }

            liTag.classList.toggle("playing", isPlaying);
            audioTag.textContent = isPlaying ? "Playing" : audioTag.getAttribute("t-duration");
        });
    }

    toggleDarkMode() {
        const isDarkMode = this.wrapper.classList.toggle("dark-mode");
        document.getElementById(`fontawesome-icons${this.suffix}`).classList.toggle("Dark");

        document.body.style.backgroundColor = isDarkMode ? "white" : "black";
        isDarkMode ? this.listcolourblack() : this.listcolourwhite();
    }

    handleMute() {
        const isAudioPlaying = !this.isMusicPaused;
        if (isAudioPlaying && !this.isMuted) {
            this.muteButton.disabled = true;
            return;
        }
    
        if (this.videoAd) {
            this.videoAd.muted = !this.videoAd.muted;
            this.isMuted = this.videoAd.muted;
            this.muteButton.classList.toggle("muted", this.isMuted);
            this.muteButton.classList.toggle("unmuted", !this.isMuted);
        }
    }

    handleAudioPause() {
        this.muteButton.disabled = false;
        this.pauseMusic();
    }

    handleAudioPlay() {
        this.muteButton.disabled = true;
        this.playMusic();
    }

    handleVideoEnd() {
        this.muteButton.disabled = false;
    }

    listcolourblack() {
        const listItems = this.ulTag.querySelectorAll("li");
        listItems.forEach(item => {
            item.style.color = 'white';
            item.style.borderBottom = '3px solid white';
        });
        this.musicList.style.backgroundColor = "black";
        this.closeMoreMusicBtn.style.color = "white";
        this.header.style.color = "white";
    }

    listcolourwhite() {
        const listItems = this.ulTag.querySelectorAll("li");
        listItems.forEach(item => {
            item.style.color = 'black';
            item.style.borderBottom = '3px solid black';
        });
        this.musicList.style.backgroundColor = "white";
        this.closeMoreMusicBtn.style.color = "black";
        this.header.style.color = "black";
    }

    toggleVideoControls() {
      if (!this.videoAd || !this.videoAd.classList.contains("bigger-video")) return;
      this.controlsToggledManually = !this.controlsToggledManually;
      this.videoAd.controls = this.controlsToggledManually;

      if (!this.controlsToggledManually && this.mainAudio.paused) {
          this.videoAd.play().catch(e => console.error("Video play failed:", e));
      }
    }
}

// Video size toggle with throttling
function handleSize() {
    const sizer = document.getElementById("video");
    if (!sizer) return;

    if (!sizer.classList.contains("overlay-video") && !sizer.classList.contains("bigger-video")) {
        sizer.classList.add("overlay-video");
    }

    const throttle = (func, limit) => {
        let lastFunc;
        let lastRan;
        return function() {
            const context = this;
            const args = arguments;
            if (!lastRan) {
                func.apply(context, args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(function() {
                    if ((Date.now() - lastRan) >= limit) {
                        func.apply(context, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    };

    sizer.addEventListener("click", throttle(() => {
        const player = window.homePlayer;
        if (sizer.classList.contains("bigger-video") && player.controlsToggledManually) return;
        sizer.classList.toggle("overlay-video");
        sizer.classList.toggle("bigger-video");
    }, 200));
}

// Optimized initialization
const initPlayers = () => {
    StorageManager.init();
    window.homePlayer = new MusicPlayer();       // Original page
    window.disguisePlayer = new MusicPlayer('2'); // Disguise page (no video)
    handleSize();
};

// Use the most efficient initialization method available
if ('requestIdleCallback' in window) {
    window.requestIdleCallback(initPlayers);
} else {
    document.addEventListener('DOMContentLoaded', initPlayers);
}