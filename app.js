// ATENÇÃO: Você substituirá esta URL no Passo 3
const R2_BUCKET_URL = 'https://pub-2e66800a99034299b0fc77537b67b486.r2.dev'; 

// Referências DOM
const sidebarList = document.getElementById('video-list-sidebar');
const placeholderMessage = document.getElementById('placeholder-message');
const playerContainer = document.getElementById('player-container');
const videoEl = document.getElementById('main-video');
const titleEl = document.getElementById('player-title');
const ccButton = document.getElementById('btn-cc');

// 1. Carregar Lista
fetch('videos.json')
    .then(r => r.json())
    .then(videos => {
        sidebarList.innerHTML = ''; 
        videos.forEach((v, index) => {
            const btn = document.createElement('button');
            btn.className = 'sidebar-btn';
            btn.innerText = v.title; // Usa título do JSON
            btn.dataset.index = index; 

            btn.onclick = () => {
                openPlayer(v);
                highlightActiveButton(btn);
            };
            sidebarList.appendChild(btn);
        });
    })
    .catch(err => console.error("Erro JSON:", err));

function highlightActiveButton(clickedBtn) {
    document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
    clickedBtn.classList.add('active');
}

// 2. Abrir Player
async function openPlayer(video) {
    placeholderMessage.classList.add('hidden');
    playerContainer.classList.remove('hidden');
    
    titleEl.innerText = video.title;
    
    // Reset Botão Legenda
    ccButton.innerText = "💬 Legenda: OFF";
    ccButton.className = "btn-control btn-cc-off";
    ccButton.style.display = 'none'; 

    videoEl.src = `${R2_BUCKET_URL}/${video.filename}`;
    videoEl.innerHTML = ''; 

    // --- SCROLL AUTOMÁTICO PARA MOBILE ---
    // Se a tela for pequena, rola para o topo para ver o vídeo
    if (window.innerWidth <= 900) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Carregar Legenda
    const baseName = video.filename.substring(0, video.filename.lastIndexOf('.'));
    const srtUrl = `${R2_BUCKET_URL}/${baseName}.srt`;

    try {
        const res = await fetch(srtUrl);
        if (res.ok) {
            const srtText = await res.text();
            const vttBlob = new Blob([srtToVtt(srtText)], { type: 'text/vtt' });
            
            const track = document.createElement('track');
            track.kind = 'subtitles';
            track.label = 'Português';
            track.srclang = 'pt';
            track.src = URL.createObjectURL(vttBlob);
            track.default = false; 
            
            videoEl.appendChild(track);

            setTimeout(() => {
                if(videoEl.textTracks[0]) videoEl.textTracks[0].mode = 'hidden';
            }, 100);
            
            ccButton.style.display = 'inline-block';
        }
    } catch (err) { console.warn('Sem legenda:', err); }

    videoEl.load();
    videoEl.play();
}

// 3. Toggle Legenda
function toggleCaptions() {
    if (!videoEl.textTracks[0]) return;
    const track = videoEl.textTracks[0];
    
    if (track.mode === 'showing') {
        track.mode = 'hidden';
        ccButton.innerText = "💬 Legenda: OFF";
        ccButton.className = "btn-control btn-cc-off";
    } else {
        track.mode = 'showing';
        ccButton.innerText = "💬 Legenda: ON";
        ccButton.className = "btn-control btn-cc-on";
    }
}

// 4. Helper VTT
function srtToVtt(data) {
    return "WEBVTT\n\n" + data.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
}