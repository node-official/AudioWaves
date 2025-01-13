'use strict';

let audioInit = false;
let isFileDragging = false;

const canvas = document.getElementById('iWorkspace');
const ctx = canvas.getContext('2d');

let canvasWidth = canvas.width = window.innerWidth;
let canvasHeight = canvas.height = window.innerHeight;

let centerX = canvasWidth / 2;
let centerY = canvasHeight / 2;

let piece;

let x, y, xEnd, yEnd;

let barHeight;

let audio, audioContext, analyser, source, frequencyArray;

function ReCalculateCanvasSize() {
    canvasWidth = canvas.width = window.innerWidth;
    canvasHeight = canvas.height = window.innerHeight;
    
    centerX = canvasWidth / 2;
    centerY = canvasHeight / 2;
}

function PlayTrack(file) {
    audioInit = true;
    
    audio = new Audio();
    audioContext =  new AudioContext();
    
    analyser = audioContext.createAnalyser();
    
    audio.src = URL.createObjectURL(file);
    //audio.src = 'Acroamatic_Abatement.wav'; // URL
    
    source = audioContext.createMediaElementSource(audio);
    
    source.connect(analyser);
    
    analyser.connect(audioContext.destination);
    
    frequencyArray = new Uint8Array(analyser.frequencyBinCount);
    
    audio.play();
}

function DrawBar(x1, y1, x2, y2, frequency) {
    ctx.strokeStyle = `rgb(${frequency}, 200, ${frequency})`;
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    
    ctx.stroke();
}

function DrawCircle() {
    ctx.strokeStyle = isFileDragging ? 'rgba(122, 200, 115, 1)' : 'rgba(0, 0, 0, 1)';
    ctx.lineWidth = isFileDragging ? 8 : 4;
    
    ctx.beginPath();
    
    ctx.arc(centerX, centerY, 118, 0, Math.PI * 2);
    
    ctx.stroke();
}

function CanvasRender() {
    //piece = audio.currentTime / audio.duration;
    
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    DrawCircle();
    
    if(!audioInit) {
        requestAnimationFrame(CanvasRender);
        
        return;
    }
    
    piece = audio.currentTime / audio.duration;
    
    ctx.strokeStyle = 'rgba(122, 200, 115, 1)';
    ctx.lineWidth = 4;
    
    ctx.beginPath();
    
    ctx.arc(centerX, centerY, 118, 0, Math.PI * (2 * piece));
    
    ctx.stroke();
    
    analyser.getByteFrequencyData(frequencyArray);
    for (let i = 0; i < 200; i++) {
        let rads = Math.PI * 2 / 200;
        
        let barHeight = frequencyArray[i] * 0.6 * 1;
        
        x = centerX + Math.cos(rads * i) * 120;
        y = centerY + Math.sin(rads * i) * 120;
        xEnd = centerX + Math.cos(rads * i) * (120 + barHeight);
        yEnd = centerY + Math.sin(rads * i) * (120 + barHeight);
        
        DrawBar(x, y, xEnd, yEnd, frequencyArray[i]);
    }
    
    requestAnimationFrame(CanvasRender);
}

canvas.addEventListener('click', () => {
    audio.paused ? audio.play() : audio.pause();
});

window.addEventListener('resize', () => ReCalculateCanvasSize());

window.addEventListener('dragenter', e => {
    e.preventDefault();
    e.stopPropagation();
});

window.addEventListener('dragover', e => {
    e.preventDefault();
    e.stopPropagation();
    
    isFileDragging = true;
});

window.addEventListener('dragleave', e => {
    e.preventDefault();
    e.stopPropagation();
    
    isFileDragging = false;
});

window.addEventListener('drop', e => {
    e.preventDefault();
    e.stopPropagation();
    
    isFileDragging = false;
    
    const files = e.dataTransfer.files;
    
    if(files.length > 0) {
        PlayTrack(files[0]);
    }
});

CanvasRender();
