// ATENÇÃO: Você substituirá esta URL no Passo 3
const R2_BUCKET_URL = 'SUBSTITUIR_PELA_SUA_URL_DO_R2'; 

const listView = document.getElementById('list-view');
const playerView = document.getElementById('player-view');
const videoEl = document.getElementById('main-video');
const titleEl = document.getElementById('player-title');

// Carregar lista
fetch('videos.json')
    .then(r => r.json())
    .then(videos => {
        const list = document.getElementById('video-list');
        videos.forEach(v => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `<h3>${v.title}</h3>`;
            card.onclick = () => openPlayer(v);
            list.appendChild(card);
        });
    });

async function openPlayer(video) {
    listView.classList.add('hidden');
    playerView.classList.remove('hidden');
    titleEl.innerText = video.title;
    
    // Configura vídeo
    videoEl.src = `${R2_BUCKET_URL}/${video.filename}`;
    videoEl.innerHTML = ''; // Limpa trilhas antigas

    // Tenta carregar legenda
    const srtName = video.filename.replace(/\.mp4$/i, '.srt');
    const srtUrl = `${R2_BUCKET_URL}/${srtName}`;

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
            track.default = true;
            videoEl.appendChild(track);
        }
    } catch (err) {
        console.warn('Sem legenda ou erro de CORS:', err);
    }
}

function closePlayer() {
    videoEl.pause();
    videoEl.src = '';
    playerView.classList.add('hidden');
    listView.classList.remove('hidden');
}

// Conversor Simples SRT -> WebVTT
function srtToVtt(data) {
    let vtt = "WEBVTT\n\n";
    vtt += data.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
    return vtt;
}