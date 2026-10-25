document.addEventListener('DOMContentLoaded', () => {
    // --- URL Parsing for Referral ---
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    const vipLevel = urlParams.get('vip');
    
    if (refCode) {
        document.getElementById('register-section').style.display = 'block';
        document.getElementById('download-section').style.display = 'none';
        document.getElementById('regRefCode').value = refCode;

        if (vipLevel) {
            const noticeBox = document.getElementById('vipNotice');
            noticeBox.style.display = 'block';
            noticeBox.innerHTML = `⚠️ এটি একটি VIP ${vipLevel} রেফারেল লিংক!<br><br>
✅ রেফার লিংক দিয়ে অ্যাকাউন্ট করে <b>VIP প্যাকেজ</b> নিলে <b>২০% বোনাস</b> পাবেন।<br>
❌ শুধু অ্যাকাউন্ট খুললেই রেফার count হবে না — VIP package কিনলে তবেই রেফার সম্পন্ন হবে।<br><br>
Customer Service: <a href="https://wa.me/8801822246645" target="_blank" style="color: #00e5ff;">+8801822246645</a>`;
        }
    }

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
    // Fetching from Backend REST API via Secure HTTPS
    const API_BASE_URL = 'https://161-248-201-75.sslip.io';
    const videoContainer = document.getElementById('videoContainer');

    async function fetchVideos() {
        try {
            // We will fetch from a node called 'website_videos' which the admin panel will write to.
            const response = await fetch(`${API_BASE_URL}/website_videos`);
            if (!response.ok) throw new Error('Failed to fetch data');
            
            const dataList = await response.json();
            videoContainer.innerHTML = '';

            if (!dataList || dataList.length === 0) {
                videoContainer.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">No tutorials available at the moment. Please check back later!</p>';
                return;
            }

            // Already an array from REST API
            const videos = dataList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

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

// --- Registration Logic ---
const API_BASE_URL = 'https://161-248-201-75.sslip.io';

async function handleRegistration(event) {
    event.preventDefault();
    const btn = document.getElementById('regSubmitBtn');
    const msg = document.getElementById('regMessage');
    btn.disabled = true;
    btn.style.opacity = '0.5';
    msg.textContent = 'Processing... Please wait.';
    msg.style.color = '#FFD700';

    const name = document.getElementById('regName').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const refCode = document.getElementById('regRefCode').value.trim();

    try {
        let phoneExists = false;
        let referrerId = null;
        let referrerKey = null;
        let referrer = null;

        // 1. Check if phone exists (REST API Query)
        const phoneRes = await fetch(`${API_BASE_URL}/users/phone/${encodeURIComponent(phone)}`);
        const phoneData = await phoneRes.json();
        
        if (phoneRes.ok && phoneData && !phoneData.error) {
            phoneExists = true;
        }

        // 2. Fetch referrer data if refCode is provided
        if (refCode) {
            const refRes = await fetch(`${API_BASE_URL}/users/uniqueId/${encodeURIComponent(refCode)}`);
            const refData = await refRes.json();
            
            if (refRes.ok && refData && !refData.error) {
                referrerId = refData.uniqueId;
                referrer = refData;
            }
        }

        if (phoneExists) {
            msg.textContent = 'Phone number already registered! Download app and Login.';
            msg.style.color = '#ef4444';
            document.getElementById('download-section').style.display = 'block';
            btn.disabled = false;
            btn.style.opacity = '1';
            return;
        }

        const uniqueId = 'EP-' + Math.floor(100000 + Math.random() * 900000);
        const id = 'usr_' + Date.now() + Math.floor(Math.random() * 1000);
        
        const newUser = {
            id: id,
            uniqueId: uniqueId,
            name: name,
            phone: phone,
            password: password,
            avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=EarnPay',
            balance: 0.0,
            vipLevel: 0,
            isVIPActive: false,
            referralCode: uniqueId,
            referredBy: referrerId,
            referrals: [],
            activeReferralCount: 0,
            successfulWithdrawalCount: 0,
            isBanned: false,
            suspiciousActivity: false,
            completedTaskIds: [],
            createdAt: new Date().toISOString()
        };

        const regRes = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser)
        });

        if (!regRes.ok) {
            const errData = await regRes.json().catch(() => ({}));
            msg.textContent = errData.error || 'Registration failed. Please try again.';
            msg.style.color = '#ef4444';
            btn.disabled = false;
            btn.style.opacity = '1';
            return;
        }

        // NOTE: We do NOT update referrer's referrals list here.
        // Referral is ONLY counted when admin approves the deposit
        // AND the referred user's VIP level >= referrer's VIP level.
        // This prevents fake account abuse.

        msg.textContent = 'Account Created Successfully! Download the App below and Login.';
        msg.style.color = '#10b981'; // Green
        document.getElementById('register-section').style.display = 'none';
        document.getElementById('download-section').style.display = 'block';
        
    } catch (e) {
        console.error(e);
        msg.textContent = 'Network error. Please try again.';
        msg.style.color = '#ef4444';
        btn.disabled = false;
        btn.style.opacity = '1';
    }
}

