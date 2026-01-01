// ATENÇÃO: Você substituirá esta URL no Passo 3
const R2_BUCKET_URL = 'https://pub-2e66800a99034299b0fc77537b67b486.r2.dev'; 

const listView = document.getElementById('list-view');
const playerView = document.getElementById('player-view');
const videoEl = document.getElementById('main-video');
const titleEl = document.getElementById('player-title');
const ccButton = document.getElementById('btn-cc');

// 1. Carregar lista de vídeos
fetch('videos.json')
    .then(r => r.json())
    .then(videos => {
        const list = document.getElementById('video-list');
        list.innerHTML = ''; // Garante lista limpa
        videos.forEach(v => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `<h3>${v.title}</h3>`;
            card.onclick = () => openPlayer(v);
            list.appendChild(card);
        });
    })
    .catch(err => console.error("Erro ao carregar JSON:", err));

// 2. Abrir Player
async function openPlayer(video) {
    listView.classList.add('hidden');
    playerView.classList.remove('hidden');
    titleEl.innerText = video.title;
    
    // Reseta estado do botão de legenda
    ccButton.innerText = "💬 Legenda: OFF";
    ccButton.className = "btn-control btn-cc-off";
    ccButton.style.display = 'none'; // Esconde até confirmar que existe legenda

    // Define fonte do vídeo
    videoEl.src = `${R2_BUCKET_URL}/${video.filename}`;
    videoEl.innerHTML = ''; // Limpa trilhas antigas

    // Lógica para encontrar o nome do arquivo .srt
    // Remove a extensão (.mp4 ou .mkv) e adiciona .srt
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
            
            // CONFIGURAÇÃO CRÍTICA:
            // Adiciona a trilha, mas não define como default
            track.default = false; 
            videoEl.appendChild(track);

            // Força o modo 'hidden' (carregado mas invisível) após um breve delay
            setTimeout(() => {
                if (videoEl.textTracks[0]) {
                    videoEl.textTracks[0].mode = 'hidden';
                }
            }, 100);
            
            // Mostra o botão pois a legenda existe
            ccButton.style.display = 'inline-block';
        }
    } catch (err) {
        console.warn('Sem legenda ou erro:', err);
    }

    videoEl.load();
    videoEl.play();
}

// 3. Função do Botão de Legenda
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

// 4. Fechar Player
function closePlayer() {
    videoEl.pause();
    videoEl.src = '';
    playerView.classList.add('hidden');
    listView.classList.remove('hidden');
}

// 5. Conversor SRT -> WebVTT
function srtToVtt(data) {
    let vtt = "WEBVTT\n\n";
    vtt += data.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
    return vtt;
}