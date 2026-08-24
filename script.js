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
