// ================= VIDEO MODAL (custom, chromeless player) =================

(function () {

    var links = Array.prototype.slice.call(
        document.querySelectorAll('#projects .project[data-video]')
    );

    if (!links.length) return;

    var modal = document.getElementById('video-modal');
    var frame = document.getElementById('video-modal-frame');
    var poster = document.getElementById('video-modal-poster');
    var hit = document.getElementById('video-modal-hit');
    var toggleBtn = document.getElementById('video-modal-toggle');
    var closeBtn = document.getElementById('video-modal-close');
    var fullscreenBtn = document.getElementById('video-modal-fullscreen');
    var muteBtn = document.getElementById('video-modal-mute');
    var volumeGroup = document.getElementById('video-modal-volume-group');
    var volumeSlider = document.getElementById('video-modal-volume');

    var HIDE_DELAY = 900;   // ms before controls fade out while playing
    var REVEAL_DELAY = 600; // ms to keep our poster up after hitting play, so
                             // YouTube's own start-of-playback chrome (title,
                             // share/watch-later/related) has time to auto-hide
                             // behind it before we reveal the video
    var hideTimer = null;
    var revealTimer = null;
    var revealed = false;
    var player = null;
    var apiReady = false;
    var pendingAutoplay = false;
    var currentVideoId = null; // video the modal wants to show
    var loadedVideoId = null;  // video actually loaded into the YT player instance
    var lastVolume = 100;

    // --- YouTube IFrame API bootstrap (kicked off once, up front) ---

    var apiTag = document.createElement('script');
    apiTag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(apiTag);

    window.onYouTubeIframeAPIReady = function () {
        apiReady = true;
        if (pendingAutoplay) {
            pendingAutoplay = false;
            ensurePlayerAndPlay();
        }
    };

    function createPlayer(videoId) {
        player = new YT.Player('video-modal-player', {
            videoId: videoId,
            width: '100%',
            height: '100%',
            playerVars: {
                autoplay: 1,
                controls: 0,
                rel: 0,
                modestbranding: 1,
                iv_load_policy: 3,
                disablekb: 1,
                cc_load_policy: 0,
                playsinline: 1,
                fs: 0,
                origin: window.location.origin
            },
            events: {
                onReady: onPlayerReady,
                onStateChange: onPlayerStateChange
            }
        });
        loadedVideoId = videoId;
    }

    function onPlayerReady(e) {
        e.target.playVideo();

        var vol = e.target.getVolume();
        if (typeof vol === 'number') {
            volumeSlider.value = e.target.isMuted() ? 0 : vol;
            lastVolume = vol || 100;
        }
        updateMuteIcon();
    }

    function onPlayerStateChange(e) {
        if (e.data === YT.PlayerState.PLAYING) {
            if (revealed) {
                frame.classList.remove('paused');
                frame.classList.add('playing');
                scheduleHide();
            } else {
                // keep our poster up a little longer: skip past YouTube's
                // own start-of-playback chrome instead of revealing it
                clearTimeout(revealTimer);
                revealTimer = setTimeout(function () {
                    revealed = true;
                    frame.classList.remove('paused', 'loading');
                    frame.classList.add('playing');
                    scheduleHide();
                }, REVEAL_DELAY);
            }
            updateMuteIcon();
        } else {
            clearTimeout(revealTimer);
            frame.classList.remove('playing', 'loading');
            frame.classList.add('paused');
            clearTimeout(hideTimer);
        }
    }

    // --- controls fade ---

    function showControls() {
        frame.classList.add('show-controls');
    }

    function scheduleHide() {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(function () {
            frame.classList.remove('show-controls');
        }, HIDE_DELAY);
    }

    hit.addEventListener('mousemove', function () {
        showControls();
        if (frame.classList.contains('playing')) scheduleHide();
    });

    hit.addEventListener('mouseleave', function () {
        if (frame.classList.contains('playing')) {
            clearTimeout(hideTimer);
            frame.classList.remove('show-controls');
        }
    });

    // --- play / pause (player created lazily, on the viewer's first click) ---

    function ensurePlayerAndPlay() {
        if (!revealed) frame.classList.add('loading');

        if (!apiReady) {
            pendingAutoplay = true;
            return;
        }

        if (!player) {
            createPlayer(currentVideoId);
            return;
        }

        if (loadedVideoId !== currentVideoId) {
            player.loadVideoById(currentVideoId);
            loadedVideoId = currentVideoId;
            return;
        }

        player.playVideo();
    }

    function togglePlay() {
        if (!player) {
            ensurePlayerAndPlay();
            return;
        }

        var state = player.getPlayerState();
        if (state === YT.PlayerState.PLAYING) {
            player.pauseVideo();
        } else {
            ensurePlayerAndPlay();
        }
    }

    hit.addEventListener('click', togglePlay);

    // --- volume + mute ---

    function updateMuteIcon() {
        if (!player || typeof player.isMuted !== 'function') return;
        muteBtn.classList.toggle('is-muted', player.isMuted() || player.getVolume() === 0);
    }

    function toggleMute() {
        if (!player || typeof player.isMuted !== 'function') return;

        if (player.isMuted() || player.getVolume() === 0) {
            player.unMute();
            player.setVolume(lastVolume || 100);
            volumeSlider.value = lastVolume || 100;
        } else {
            lastVolume = player.getVolume() || lastVolume;
            player.mute();
            volumeSlider.value = 0;
        }
        updateMuteIcon();
    }

    muteBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleMute();
    });

    volumeSlider.addEventListener('input', function (e) {
        e.stopPropagation();
        if (!player || typeof player.setVolume !== 'function') return;

        var vol = parseInt(volumeSlider.value, 10);

        player.setVolume(vol);

        if (vol === 0) {
            player.mute();
        } else {
            player.unMute();
            lastVolume = vol;
        }

        updateMuteIcon();
    });

    ['mousedown', 'touchstart'].forEach(function (evt) {
        volumeSlider.addEventListener(evt, function (e) {
            e.stopPropagation();
            volumeGroup.classList.add('active');
        });
    });

    ['mouseup', 'touchend'].forEach(function (evt) {
        volumeSlider.addEventListener(evt, function (e) {
            e.stopPropagation();
            volumeGroup.classList.remove('active');
        });
    });

    volumeSlider.addEventListener('click', function (e) {
        e.stopPropagation();
    });

    // --- fullscreen ---

    function toggleFullscreen() {
        var isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;

        if (isFullscreen) {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        } else {
            if (frame.requestFullscreen) frame.requestFullscreen();
            else if (frame.webkitRequestFullscreen) frame.webkitRequestFullscreen();
        }
    }

    fullscreenBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleFullscreen();
    });

    // --- open / close modal ---

    function open(videoId, thumbSrc) {
        currentVideoId = videoId;
        revealed = false;
        clearTimeout(revealTimer);

        poster.style.backgroundImage = thumbSrc ? 'url(' + thumbSrc + ')' : '';

        frame.classList.remove('playing', 'loading');
        frame.classList.add('paused');

        if (player && loadedVideoId && loadedVideoId !== videoId) {
            player.stopVideo();
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function close() {
        modal.classList.remove('active');
        document.body.style.overflow = '';

        frame.classList.remove('playing');
        frame.classList.add('paused');

        if (player && typeof player.pauseVideo === 'function') {
            player.pauseVideo();
        }
    }

    links.forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            var img = link.querySelector('img');
            open(link.getAttribute('data-video'), img ? img.getAttribute('src') : null);
        });
    });

    closeBtn.addEventListener('click', close);

    modal.addEventListener('click', function (e) {
        if (e.target === modal) close();
    });

    document.addEventListener('keydown', function (e) {
        if (!modal.classList.contains('active')) return;

        if (e.key === 'Escape') close();
        if (e.key === ' ') { e.preventDefault(); togglePlay(); }
    });

})();


// ================= PHOTO LIGHTBOX =================

(function () {

    var links = Array.prototype.slice.call(
        document.querySelectorAll('#motion-posters .project')
    );

    if (!links.length) return;

    var lightbox = document.getElementById('lightbox');
    var lightboxImg = document.getElementById('lightbox-img');
    var closeBtn = document.getElementById('lightbox-close');
    var prevBtn = document.getElementById('lightbox-prev');
    var nextBtn = document.getElementById('lightbox-next');

    var currentIndex = 0;

    function show(index) {
        currentIndex = (index + links.length) % links.length;

        var src = links[currentIndex].getAttribute('href');
        var alt = links[currentIndex].querySelector('img').getAttribute('alt') || '';

        lightboxImg.setAttribute('src', src);
        lightboxImg.setAttribute('alt', alt);
    }

    function open(index) {
        show(index);
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function close() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    links.forEach(function (link, index) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            open(index);
        });
    });

    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', function () { show(currentIndex - 1); });
    nextBtn.addEventListener('click', function () { show(currentIndex + 1); });

    lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) close();
    });

    document.addEventListener('keydown', function (e) {
        if (!lightbox.classList.contains('active')) return;

        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') show(currentIndex - 1);
        if (e.key === 'ArrowRight') show(currentIndex + 1);
    });

})();
