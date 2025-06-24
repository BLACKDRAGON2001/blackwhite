document.addEventListener('click', function(e) {
    if (e.target.id === 'title' || e.target.id === 'title2') {
        clearAllAudioLocalStorage();
        const page = e.target.id === 'title' ? 'HomePage' : 'DisguisePage';
        handleLogout(page);
    }
});
  
  function clearAllAudioLocalStorage() {
    Object.keys(localStorage).forEach(key => {
        if (
            key.startsWith('musicIndex') ||
            key.startsWith('isMusicPaused') ||
            key.startsWith('volumeLevel') ||
            key.startsWith('playerState')
            // add other audio-related keys here if any
        ) {
            localStorage.removeItem(key);
        }
    });
}

  function clearInputFields() {
  document.getElementById('usernameInput').value = '';
  document.getElementById('passwordInput').value = '';
  document.getElementById('usernameInput2').value = '';
  document.getElementById('passwordInput2').value = '';
  document.getElementById('usernameInput3').value = '';
  document.getElementById('passwordInput3').value = '';
  }
  
  function handleLogout(page) {
    document.getElementById(page).style.display = 'none';
    localStorage.removeItem('LoginTime');
    document.body.style.backgroundColor = 'white';
    clearInputFields();
    
    // Reset both players
    resetPlayer(window.homePlayer);
    resetPlayer(window.disguisePlayer);
    
    // Ensure video is hidden (extra safeguard)
    const videoElement = document.getElementById('video');
    if (videoElement) {
        videoElement.style.display = 'none';
        videoElement.pause();
        videoElement.currentTime = 0;
    }
}

function resetPlayer(player) {
    if (!player) return;
    
    // Reset player state
    player.musicIndex = 1;
    player.isMusicPaused = true;
    player.isShuffleMode = false;
    player.isMuted = false;
    
    // Reset UI elements
    player.wrapper.classList.remove("paused");
    player.wrapper.classList.remove("dark-mode");
    player.playPauseBtn.querySelector("i").textContent = "play_arrow";
    player.progressBar.style.width = "0%";
    player.wrapper.querySelector(".current-time").textContent = "0:00";
    player.wrapper.querySelector(".max-duration").textContent = "0:00";
    player.repeatBtn.textContent = "repeat";
    player.repeatBtn.title = "Playlist looped";
    
    // Hide video if it exists
    if (player.videoAd) {
        player.videoAd.style.display = "none";
        player.videoAd.pause();
        player.videoAd.currentTime = 0;
        player.videoAd.muted = true;
        player.videoAd.classList.remove("bigger-video");
        player.videoAd.classList.add("overlay-video");
        player.videoAd.controls = false;
        player.controlsToggledManually = false;
    }
    
    // Reload the first song
    player.loadMusic(1);
    player.pauseMusic();
    
    // Reset music list display
    player.closeMusicList();
    player.populateMusicList(player.originalOrder);
    
    // Reset dark mode if active
    document.getElementById(`fontawesome-icons${player.suffix}`).classList.remove("Dark");
    player.listcolourwhite();
}
  
  class MusicPlayer {
    constructor(suffix = '') {
        this.suffix = suffix;
        this.imageFolder = suffix === '2' ? 'ImagesDisguise/' : 'Images/';
        
        this.cacheElements();
        this.initState();
        this.setupEventListeners();
        this.loadPersistedState();
        this.populateMusicList(this.originalOrder);
        this.updatePlayingSong();
    }
  
    cacheElements() {
        this.wrapper = document.querySelector(`#wrapper${this.suffix}`);
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
        const storedMusicIndex = localStorage.getItem(`musicIndex${this.suffix}`);
        if (storedMusicIndex) {
            this.musicIndex = parseInt(storedMusicIndex, 10);
            this.loadMusic(this.musicIndex);
            if (localStorage.getItem(`isMusicPaused${this.suffix}`) === "false") {
                this.playMusic();
            }
        } else {
            this.loadMusic(this.musicIndex);
        }
    }
  
    // Throttle expensive operations
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
  
    loadMusic(index) {
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
  
        // Preload audio and video
        this.mainAudio.src = `https://pub-c755c6dec2fa41a5a9f9a659408e2150.r2.dev/${src}.mp3`;
        if (this.videoAd) {
            this.videoAd.src = `https://pub-fb9b941e940b4b44a61b7973d5ba28c3.r2.dev/${src}.mp4`;
        }
  
        localStorage.setItem(`musicIndex${this.suffix}`, index);
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
        localStorage.setItem(`isMusicPaused${this.suffix}`, "false");
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
        localStorage.setItem(`isMusicPaused${this.suffix}`, "true");
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
                this.shuffledOrder = [...this.originalOrder].sort(() => Math.random() - 0.5);
                this.musicIndex = 1;
                this.loadMusic(this.musicIndex);
                this.populateMusicList(this.shuffledOrder);

                this.mainAudio.play().then(() => {
                this.isMusicPaused = false;
                this.wrapper.classList.add("paused");
                this.playPauseBtn.querySelector("i").textContent = "pause";
                }).catch(err => {
                console.warn("Autoplay failed, awaiting user interaction:", err);
                });
                break;
            case "shuffle":
                this.repeatBtn.textContent = "repeat";
                this.repeatBtn.title = "Playlist looped";
                this.isShuffleMode = false;
                this.musicIndex = 1;
                this.loadMusic(this.musicIndex);
                this.populateMusicList(this.originalOrder);
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
        const fragment = document.createDocumentFragment();
      
        // Create an array of promises to load all durations
        const durationPromises = musicArray.map((music) => {
          return new Promise((resolve) => {
            const tempAudio = new Audio(`https://pub-c755c6dec2fa41a5a9f9a659408e2150.r2.dev/${music.src}.mp3`);
            tempAudio.addEventListener("loadedmetadata", () => {
              const duration = tempAudio.duration;
              if (!isNaN(duration) && isFinite(duration)) {
                const totalMin = Math.floor(duration / 60);
                const totalSec = Math.floor(duration % 60).toString().padStart(2, "0");
                resolve(`${totalMin}:${totalSec}`);
              } else {
                resolve("0:00");
              }
            });
            tempAudio.addEventListener("error", () => resolve("0:00"));
          });
        });
      
        // Once all durations are loaded
        Promise.all(durationPromises).then((durations) => {
          musicArray.forEach((music, i) => {
            const liTag = document.createElement("li");
            liTag.setAttribute("li-index", i + 1);
      
            liTag.innerHTML = `
              <div class="row">
                <span>${music.name}</span>
                <p>${music.artist}</p>
              </div>
              <span class="audio-duration" data-src="${music.src}">${durations[i]}</span>
            `;
      
            liTag.addEventListener("click", () => {
              this.musicIndex = i + 1;
              this.loadMusic(this.musicIndex);
              this.playMusic();
            });
      
            fragment.appendChild(liTag);
          });
      
          this.ulTag.innerHTML = "";
          this.ulTag.appendChild(fragment);
        });
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
        this.wrapper.classList.remove("paused");
        this.playPauseBtn.querySelector("i").textContent = "play_arrow";
        this.isMusicPaused = true;
        localStorage.setItem(`isMusicPaused${this.suffix}`, "true");
    }
    
    handleAudioPlay() {
        this.muteButton.disabled = true;
        this.wrapper.classList.add("paused");
        this.playPauseBtn.querySelector("i").textContent = "pause";
        this.isMusicPaused = false;
        localStorage.setItem(`isMusicPaused${this.suffix}`, "false");
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
  
  // Init with requestIdleCallback if available
  const initPlayers = () => {
    window.homePlayer = new MusicPlayer();       // Original page
    window.disguisePlayer = new MusicPlayer('2'); // Disguise page (no video)
    handleSize();
  };
  
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(initPlayers);
  } else {
    document.addEventListener('DOMContentLoaded', initPlayers);
  }