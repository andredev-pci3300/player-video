// ATENÇÃO: Você substituirá esta URL no Passo 3
const R2_BUCKET_URL = 'https://pub-2e66800a99034299b0fc77537b67b486.r2.dev'; 

const listView = document.getElementById('list-view');
const playerView = document.getElementById('player-view');
const videoEl = document.getElementById('main-video');
const titleEl = document.getElementById('player-title');

// 1. Carregar lista (Suporta MKV e MP4)
fetch('videos.json')
    .then(r => r.json())
    .then(videos => {
        const list = document.getElementById('video-list');
        list.innerHTML = ''; // Limpa lista antes de renderizar
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
    
    // Define a fonte do vídeo (Seja .mp4 ou .mkv)
    videoEl.src = `${R2_BUCKET_URL}/${video.filename}`;
    videoEl.innerHTML = ''; // Limpa trilhas de legendas anteriores

    // 2. Lógica Inteligente de Legenda
    // Remove a extensão atual (.mp4 ou .mkv) e tenta buscar o .srt correspondente
    const baseName = video.filename.split('.').slice(0, -1).join('.');
    const srtUrl = `${R2_BUCKET_URL}/${baseName}.srt`;

    try {
        const res = await fetch(srtUrl);
        if (res.ok) {
            const srtText = await res.text();
            const vttBlob = new Blob([srtToVtt(srtText)], { type: 'text/vtt' });
            const track = document.createElement('track');
            track.kind = 'subtitles';
            track.label = 'Português (Externo)';
            track.srclang = 'pt';
            track.src = URL.createObjectURL(vttBlob);
            track.default = true;
            videoEl.appendChild(track);
        } else {
            console.log('Nenhuma legenda externa .srt encontrada para este arquivo.');
        }
    } catch (err) {
        console.warn('Erro ao processar legenda:', err);
    }

    videoEl.load();
    videoEl.play();
}

function closePlayer() {
    videoEl.pause();
    videoEl.src = '';
    playerView.classList.add('hidden');
    listView.classList.remove('hidden');
}

// Conversor SRT -> WebVTT (Essencial para navegadores)
function srtToVtt(data) {
    let vtt = "WEBVTT\n\n";
    vtt += data.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
    return vtt;
}