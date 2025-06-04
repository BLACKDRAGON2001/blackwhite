// Optimized for mobile - complete version
document.addEventListener('click', function(e) {
    if (e.target.id === 'title' || e.target.id === 'title2') {
      clearAllAudioLocalStorage();
      const page = e.target.id === 'title' ? 'HomePage' : 'DisguisePage';
      handleLogout(page);
    }
  }, { passive: true });
  
  function clearAllAudioLocalStorage() {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('musicIndex') || key.startsWith('isMusicPaused'))) {
        toRemove.push(key);
      }
    }
    toRemove.forEach(key => localStorage.removeItem(key));
  }
  
  function handleLogout(page) {
    requestAnimationFrame(() => {
      const pageEl = document.getElementById(page);
      if (pageEl) pageEl.style.display = 'none';
      localStorage.removeItem('LoginTime');
      document.body.style.backgroundColor = 'white';
      clearInputFields?.();
      location.reload();
    });
  }
  
  class MusicPlayer {
    constructor(suffix = '') {
      this.suffix = suffix;
      this.imageFolder = suffix === '2' ? 'ImagesDisguise/' : 'Images/';
  
      this.cacheElements();
      this.initState();
      this.loadPersistedState();
  
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          this.setupEventListeners();
          this.populateMusicList(this.originalOrder);
          this.updatePlayingSong();
        }, { timeout: 1000 });
      } else {
        setTimeout(() => {
          this.setupEventListeners();
          this.populateMusicList(this.originalOrder);
          this.updatePlayingSong();
        }, 500);
      }
    }
  
    cacheElements() {
      this.wrapper = document.querySelector(`#wrapper${this.suffix}`);
      this.coverArea = this.wrapper?.querySelector(".img-area");
      this.musicName = this.wrapper?.querySelector(".song-details .name");
      this.musicArtist = this.wrapper?.querySelector(".song-details .artist");
      this.playPauseBtn = this.wrapper?.querySelector(".play-pause");
      this.prevBtn = this.wrapper?.querySelector(`#prev${this.suffix}`);
      this.nextBtn = this.wrapper?.querySelector(`#next${this.suffix}`);
      this.mainAudio = this.wrapper?.querySelector(`#main-audio${this.suffix}`);
      this.videoAd = this.suffix === '2' ? null : this.wrapper?.querySelector(`#video${this.suffix}`);
      this.progressArea = this.wrapper?.querySelector(".progress-area");
      this.progressBar = this.progressArea?.querySelector(".progress-bar");
      this.musicList = this.wrapper?.querySelector(".music-list");
      this.moreMusicBtn = this.wrapper?.querySelector(`#more-music${this.suffix}`);
      this.closeMoreMusicBtn = this.musicList?.querySelector(`#close${this.suffix}`);
      this.modeToggle = document.getElementById(`modeToggle${this.suffix}`);
      this.muteButton = document.getElementById(`muteButton${this.suffix}`);
      this.header = this.wrapper?.querySelector(".row");
      this.ulTag = this.wrapper?.querySelector("ul");
      this.repeatBtn = this.wrapper?.querySelector(`#repeat-plist${this.suffix}`);
    }
  
    initState() {
      this.musicIndex = 1;
      this.isMusicPaused = true;
      this.isShuffleMode = false;
      this.originalOrder = Array.isArray(window.allMusic) ? [...window.allMusic] : [];
      this.shuffledOrder = [];
      this.isMuted = false;
      this.controlsToggledManually = false;
      this.mediaElements = new Map();
    }
  
    setupEventListeners() {
      if (!this.wrapper) return;
  
      const passiveOptions = { passive: true };
  
      this.wrapper.addEventListener("click", (e) => {
        if (e.target === this.playPauseBtn) this.togglePlayPause();
        else if (e.target === this.prevBtn) this.changeMusic(-1);
        else if (e.target === this.nextBtn) this.changeMusic(1);
        else if (e.target === this.moreMusicBtn) this.toggleMusicList();
        else if (e.target === this.modeToggle) this.toggleDarkMode();
        else if (e.target === this.muteButton) this.handleMute();
        else if (e.target === this.repeatBtn) this.handleRepeat();
        else if (e.target === this.musicName) this.toggleVideoControls();
      });
  
      this.progressArea?.addEventListener("click", (e) => this.handleProgressClick(e), passiveOptions);
      this.closeMoreMusicBtn?.addEventListener("click", () => this.closeMusicList(), passiveOptions);
  
      if (this.mainAudio) {
        this.mainAudio.addEventListener("timeupdate", (e) => this.updateProgress(e), passiveOptions);
        this.mainAudio.addEventListener("ended", () => this.handleSongEnd(), passiveOptions);
        this.mainAudio.addEventListener("pause", () => this.handleAudioPause(), passiveOptions);
        this.mainAudio.addEventListener("play", () => this.handleAudioPlay(), passiveOptions);
      }
  
      if (this.videoAd) {
        this.videoAd.addEventListener("ended", () => this.handleVideoEnd(), passiveOptions);
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
  
    loadMusic(index) {
      if (!this.coverArea || !this.musicName || !this.musicArtist) return;
  
      const music = this.isShuffleMode ? this.shuffledOrder[index - 1] : this.originalOrder[index - 1];
      if (!music) return;
  
      this.musicName.textContent = music.name || '';
      this.musicArtist.textContent = music.artist || '';
  
      const { coverType = 'Images', src = '', type = 'jpg' } = music;
  
      const mediaKey = `${coverType}_${src}_${type}`;
      let mediaElement = this.mediaElements.get(mediaKey);
  
      if (!mediaElement) {
        mediaElement = (coverType.toLowerCase() === 'video' && this.suffix !== '2') ?
          this.createVideoElement(src, type) :
          this.createImageElement(src, type);
        this.mediaElements.set(mediaKey, mediaElement);
      }
  
      this.coverArea.textContent = '';
      this.coverArea.appendChild(mediaElement.cloneNode(true));
  
      if (this.mainAudio) {
        this.mainAudio.src = `Audio/${src}.mp3`;
        this.mainAudio.preload = 'none';
      }
  
      if (this.videoAd) {
        setTimeout(() => {
          this.videoAd.src = `https://pub-fb9b941e940b4b44a61b7973d5ba28c3.r2.dev/${src}.mp4`;
          this.videoAd.load();
        }, 1000);
      }
  
      localStorage.setItem(`musicIndex${this.suffix}`, index);
      this.updatePlayingSong();
    }
  
    createVideoElement(src, type) {
      const video = document.createElement('video');
      video.src = `https://pub-fb9b941e940b4b44a61b7973d5ba28c3.r2.dev/${src}.${type}`;
      video.controls = false;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.classList.add("overlay-video");
      video.setAttribute('preload', 'auto');
      video.setAttribute('playsinline', '');
      return video;
    }
  
    createImageElement(src, type) {
      const img = new Image();
      img.src = `${this.imageFolder}${src}.${type}`;
      img.alt = this.musicName?.textContent || '';
      img.loading = 'lazy';
      img.decoding = 'async';
      return img;
    }
  
    togglePlayPause() {
      this.isMusicPaused ? this.playMusic() : this.pauseMusic();
    }
  
    playMusic() {
      if (!this.wrapper || !this.playPauseBtn || !this.mainAudio) return;
  
      this.wrapper.classList.remove("paused"); // playing means NOT paused class
      this.playPauseBtn.querySelector("i")?.textContent = "pause";
      this.mainAudio.play().catch(e => console.error("Playback failed:", e));
      this.isMusicPaused = false;
      localStorage.setItem(`isMusicPaused${this.suffix}`, "false");
  
      if (this.videoAd) {
        this.toggleVideoDisplay(false);
        this.resetVideoSize();
      }
    }
  
    pauseMusic() {
      if (!this.wrapper || !this.playPauseBtn || !this.mainAudio) return;
  
      this.wrapper.classList.add("paused"); // paused means class present
      this.playPauseBtn.querySelector("i")?.textContent = "play_arrow";
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
      if (show) {
        this.videoAd.play().catch(() => {});
      } else {
        this.videoAd.pause();
      }
    }
  
    muteVideo() {
      if (this.videoAd) {
        this.videoAd.muted = true;
      }
    }
  
    toggleVideoControls() {
      if (!this.videoAd) return;
      if (!this.controlsToggledManually) {
        this.videoAd.controls = true;
        this.videoAd.classList.remove("overlay-video");
        this.videoAd.classList.add("bigger-video");
        this.controlsToggledManually = true;
      } else {
        this.resetVideoSize();
        this.controlsToggledManually = false;
      }
    }
  
    changeMusic(direction) {
      if (direction === 1) {
        this.musicIndex++;
        if (this.musicIndex > this.originalOrder.length) this.musicIndex = 1;
      } else if (direction === -1) {
        this.musicIndex--;
        if (this.musicIndex < 1) this.musicIndex = this.originalOrder.length;
      }
      this.loadMusic(this.musicIndex);
      this.playMusic();
    }
  
    updateProgress(event) {
      if (!this.progressBar || !this.mainAudio) return;
  
      const currentTime = this.mainAudio.currentTime;
      const duration = this.mainAudio.duration;
  
      if (isNaN(duration)) return;
  
      const progressPercent = (currentTime / duration) * 100;
      this.progressBar.style.width = progressPercent + "%";
  
      const currentMin = Math.floor(currentTime / 60) || 0;
      const currentSec = Math.floor(currentTime % 60) || 0;
      const durationMin = Math.floor(duration / 60) || 0;
      const durationSec = Math.floor(duration % 60) || 0;
  
      this.wrapper.querySelector(".current-time")?.textContent =
        `${currentMin}:${currentSec < 10 ? "0" : ""}${currentSec}`;
      this.wrapper.querySelector(".duration")?.textContent =
        duration ? `${durationMin}:${durationSec < 10 ? "0" : ""}${durationSec}` : "0:00";
    }
  
    handleProgressClick(e) {
      if (!this.mainAudio || !this.progressArea) return;
      const rect = this.progressArea.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const duration = this.mainAudio.duration;
  
      if (isNaN(duration)) return;
  
      this.mainAudio.currentTime = (clickX / width) * duration;
      this.playMusic();
    }
  
    handleSongEnd() {
      if (this.repeatBtn?.classList.contains("repeat")) {
        this.playMusic();
      } else {
        this.changeMusic(1);
      }
    }
  
    handleAudioPause() {
      this.isMusicPaused = true;
      this.wrapper?.classList.add("paused");
      this.playPauseBtn?.querySelector("i")?.textContent = "play_arrow";
    }
  
    handleAudioPlay() {
      this.isMusicPaused = false;
      this.wrapper?.classList.remove("paused");
      this.playPauseBtn?.querySelector("i")?.textContent = "pause";
    }
  
    handleVideoEnd() {
      if (this.isMusicPaused) {
        this.videoAd?.play();
      }
    }
  
    toggleMusicList() {
      if (!this.musicList || !this.moreMusicBtn) return;
      if (this.musicList.classList.contains("show")) {
        this.musicList.classList.remove("show");
        this.moreMusicBtn.querySelector("i")?.textContent = "menu";
      } else {
        this.musicList.classList.add("show");
        this.moreMusicBtn.querySelector("i")?.textContent = "close";
      }
    }
  
    closeMusicList() {
      if (!this.musicList || !this.moreMusicBtn) return;
      this.musicList.classList.remove("show");
      this.moreMusicBtn.querySelector("i")?.textContent = "menu";
    }
  
    toggleDarkMode() {
      if (!this.wrapper || !this.header) return;
  
      if (this.wrapper.classList.contains("dark")) {
        this.wrapper.classList.remove("dark");
        document.body.style.backgroundColor = "white";
        this.header.style.backgroundColor = "white";
        this.modeToggle.textContent = "light_mode";
      } else {
        this.wrapper.classList.add("dark");
        document.body.style.backgroundColor = "black";
        this.header.style.backgroundColor = "black";
        this.modeToggle.textContent = "dark_mode";
      }
    }
  
    handleMute() {
      if (!this.mainAudio || !this.muteButton) return;
  
      this.isMuted = !this.isMuted;
      this.mainAudio.muted = this.isMuted;
      this.muteButton.querySelector("i")?.textContent = this.isMuted ? "volume_off" : "volume_up";
    }
  
    handleRepeat() {
      if (!this.repeatBtn) return;
      if (this.repeatBtn.classList.contains("repeat")) {
        this.repeatBtn.classList.remove("repeat");
        this.repeatBtn.textContent = "repeat";
      } else {
        this.repeatBtn.classList.add("repeat");
        this.repeatBtn.textContent = "repeat_one";
      }
    }
  
    populateMusicList(musicArray) {
      if (!this.ulTag || !Array.isArray(musicArray)) return;
      this.ulTag.innerHTML = "";
  
      musicArray.forEach((music, i) => {
        const li = document.createElement("li");
        li.textContent = `${music.name} - ${music.artist}`;
        li.addEventListener("click", () => {
          this.musicIndex = i + 1;
          this.loadMusic(this.musicIndex);
          this.playMusic();
          this.closeMusicList();
        });
        this.ulTag.appendChild(li);
      });
    }
  
    updatePlayingSong() {
      if (!this.ulTag) return;
      const lis = this.ulTag.querySelectorAll("li");
      lis.forEach((li, index) => {
        li.classList.toggle("playing", index === this.musicIndex - 1);
      });
    }
  }
  
  // Example usage
  const musicPlayer1 = new MusicPlayer('');
  const musicPlayer2 = new MusicPlayer('2');
  