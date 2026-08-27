// ================= DISABLE RIGHT-CLICK ON IMAGES =================
// Deterrent only (a determined visitor can still get around it via dev
// tools) but stops the casual right-click > "open image in new tab" /
// "save image as" that exposes raw file names.

(function () {

    document.querySelectorAll('img').forEach(function (img) {
        img.addEventListener('contextmenu', function (e) {
            e.preventDefault();
        });

        img.addEventListener('dragstart', function (e) {
            e.preventDefault();
        });
    });

})();


// ================= VIDEO MODAL (plain YouTube embed) =================

(function () {

    var links = Array.prototype.slice.call(
        document.querySelectorAll('#projects .project[data-video]')
    );

    if (!links.length) return;

    var modal = document.getElementById('video-modal');
    var iframe = document.getElementById('video-modal-iframe');
    var closeBtn = document.getElementById('video-modal-close');

    function open(videoId) {
        iframe.setAttribute(
            'src',
            'https://www.youtube.com/embed/' + videoId +
            '?modestbranding=1&rel=0&iv_load_policy=3&playsinline=1'
        );
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function close() {
        modal.classList.remove('active');
        iframe.setAttribute('src', '');
        document.body.style.overflow = '';
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
        if (e.key === 'Escape' && modal.classList.contains('active')) close();
    });

})();


// ================= PHOTO LIGHTBOX =================

(function () {

    var links = Array.prototype.slice.call(
        document.querySelectorAll('#photography .project')
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
