// ================= VIDEO MODAL (custom, chromeless player) =================

(function () {

    var links = Array.prototype.slice.call(
        document.querySelectorAll('#projects .project[data-video]')
    );

    if (!links.length) return;

    var modal = document.getElementById('video-modal');
    var frame = document.getElementById('video-modal-frame');
    var hit = document.getElementById('video-modal-hit');
    var toggleBtn = document.getElementById('video-modal-toggle');
    var closeBtn = document.getElementById('video-modal-close');

    var HIDE_DELAY = 900; // ms before controls fade out while playing
    var hideTimer = null;
    var player = null;
    var pendingVideoId = null;
    var apiReady = false;

    // --- YouTube IFrame API bootstrap ---

    var apiTag = document.createElement('script');
    apiTag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(apiTag);

    window.onYouTubeIframeAPIReady = function () {
        apiReady = true;
        if (pendingVideoId) createPlayer(pendingVideoId);
    };

    function createPlayer(videoId) {
        player = new YT.Player('video-modal-player', {
            videoId: videoId,
            width: '100%',
            height: '100%',
            playerVars: {
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
                onStateChange: onPlayerStateChange
            }
        });
    }

    function onPlayerStateChange(e) {
        if (e.data === YT.PlayerState.PLAYING) {
            frame.classList.remove('paused');
            frame.classList.add('playing');
            scheduleHide();
        } else {
            frame.classList.remove('playing');
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

    // --- play / pause toggle ---

    function togglePlay() {
        if (!player || typeof player.getPlayerState !== 'function') return;

        var state = player.getPlayerState();
        if (state === YT.PlayerState.PLAYING) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
    }

    hit.addEventListener('click', togglePlay);

    // --- open / close modal ---

    function open(videoId) {
        frame.classList.remove('playing');
        frame.classList.add('paused');

        if (!apiReady) {
            pendingVideoId = videoId;
        } else if (!player) {
            createPlayer(videoId);
        } else {
            player.loadVideoById(videoId);
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function close() {
        modal.classList.remove('active');
        document.body.style.overflow = '';

        if (player && typeof player.stopVideo === 'function') {
            player.stopVideo();
        }
    }

    links.forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            open(link.getAttribute('data-video'));
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
