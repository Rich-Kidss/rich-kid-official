document.addEventListener('DOMContentLoaded', () => {
    // --- Language Toggle Logic ---
    let currentLang = 'en';
    const langBtn = document.getElementById('langToggle');
    const enElements = document.querySelectorAll('.en');
    const bnElements = document.querySelectorAll('.bn');

    langBtn.addEventListener('click', () => {
        if (currentLang === 'en') {
            currentLang = 'bn';
            langBtn.textContent = 'English';
            enElements.forEach(el => el.classList.add('hide'));
            bnElements.forEach(el => el.classList.remove('hide'));
        } else {
            currentLang = 'en';
            langBtn.textContent = 'বাংলা';
            bnElements.forEach(el => el.classList.add('hide'));
            enElements.forEach(el => el.classList.remove('hide'));
        }
    });

    // --- Firebase Data Fetching ---
    // Fetching from Firebase Realtime Database via REST API
    const FIREBASE_DB_URL = 'https://richkids-92da5-default-rtdb.firebaseio.com';
    const videoContainer = document.getElementById('videoContainer');

    async function fetchVideos() {
        try {
            // We will fetch from a node called 'website_videos' which the admin panel will write to.
            const response = await fetch(`${FIREBASE_DB_URL}/website_videos.json`);
            if (!response.ok) throw new Error('Failed to fetch data');
            
            const data = await response.json();
            videoContainer.innerHTML = ''; // Clear loading spinner

            if (!data) {
                videoContainer.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">No tutorials available at the moment. Please check back later!</p>';
                return;
            }

            // Convert Object to Array
            const videos = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));

            // Sort by timestamp (newest first) if available
            videos.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

            videos.forEach(video => {
                // Ensure it's a valid YouTube embed URL
                let embedUrl = video.url;
                if (embedUrl.includes('watch?v=')) {
                    embedUrl = embedUrl.replace('watch?v=', 'embed/');
                } else if (embedUrl.includes('youtu.be/')) {
                    embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
                }

                const card = document.createElement('div');
                card.className = 'video-card';
                card.innerHTML = `
                    <div class="video-wrapper">
                        <iframe src="${embedUrl}" title="${video.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                    </div>
                    <div class="video-info">
                        <div class="video-title">${video.title}</div>
                    </div>
                `;
                videoContainer.appendChild(card);
            });

        } catch (error) {
            console.error('Error fetching videos:', error);
            videoContainer.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: #ef4444;">Could not load tutorials. Please check your internet connection.</p>';
        }
    }

    fetchVideos();
});
