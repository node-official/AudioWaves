/**
 * Audio Waves
 * 
 * Latest release: (see in ReadMe.txt)
 * Developer: Node
 * 
 * Copyright (c) 2025, Node. All rights reserved.
 * 
 */

'use strict';

let audioInit = false;
let isFileDragging = false;

const audioStatusText = document.getElementById('currentStatus');

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

function UpdateAudioStatus() {
    if(!audioInit) return;
    
    const audioPlayStatus = audio.paused ? 'Paused' : 'Playing';
    
    const currentTime = audio.currentTime;
    const totalTime = audio.duration;
    
    const currentMinutes = Math.floor(currentTime / 60);
    const currentSeconds = Math.floor(currentTime % 60);
    
    const totalMinutes = Math.floor(totalTime / 60);
    const totalSeconds = Math.floor(totalTime % 60);
    
    audioStatusText.innerText = `${audioPlayStatus} • Duration: ${currentMinutes}:${currentSeconds < 10 ? '0' + currentSeconds : currentSeconds} - ${totalMinutes}:${totalSeconds < 10 ? '0' + totalSeconds : totalSeconds} • Volume: ${audio.volume}`;
}

function PlayTrack(file) {
    audioInit = true;
    
    audio = new Audio();
    audioContext =  new AudioContext();
    
    analyser = audioContext.createAnalyser();
    
    audio.src = URL.createObjectURL(file);
    
    source = audioContext.createMediaElementSource(audio);
    
    source.connect(analyser);
    
    analyser.connect(audioContext.destination);
    
    frequencyArray = new Uint8Array(analyser.frequencyBinCount);
    
    audio.addEventListener('timeupdate', () => UpdateAudioStatus());
    audio.addEventListener('play', () => UpdateAudioStatus());
    audio.addEventListener('pause', () => UpdateAudioStatus());
    
    audio.play();
}

function DrawBar(x1, y1, x2, y2, frequency) {
    ctx.strokeStyle = `rgb(${frequency}, 200, ${frequency})`;
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    
    ctx.stroke();
}

function DrawCircle() {
    ctx.strokeStyle = isFileDragging ? 'rgba(122, 200, 115, 0.5)' : 'rgba(0, 0, 0, 1)';
    ctx.lineWidth = 4;
    
    ctx.fillStyle = 'rgb(0, 0, 0)';
    
    ctx.beginPath();
    
    ctx.arc(centerX, centerY, 118, 0, Math.PI * 2);
    
    ctx.stroke();
    ctx.fill();
}

const SNOWIE_TEXTURE_PATHS = [
    [
        'https://raw.githubusercontent.com/node-official/EscapeSnowie_Textures/refs/heads/main/Snowie/0/Snow_1.png',
        'https://raw.githubusercontent.com/node-official/EscapeSnowie_Textures/refs/heads/main/Snowie/0/Snow_2.png',
        'https://raw.githubusercontent.com/node-official/EscapeSnowie_Textures/refs/heads/main/Snowie/0/Snow_3.png',
    ]
];

let resourceCache = {};

function DrawImage(url, x, y, opacity = 1) {
    if(resourceCache[url]) {
        let cachedImage = resourceCache[url];
        
        ctx.globalAlpha = opacity;
        
        ctx.drawImage(cachedImage, x, y, cachedImage.width, cachedImage.height);
        
        ctx.globalAlpha = 1;
        
        return;
    }
    
    const imageElement = new Image();
    
    imageElement.onload = () => {
        resourceCache[url] = imageElement;
    };
    
    imageElement.src = url;
}

class SnowieLayer {
    flakes = [];
    flakeCount = 75;
    
    damping = 0.99;
    
    minDist = 1080;
    maxDetectDistance = this.minDist / 2;
    
    spawnedFlakes = 0;
    
    InitFlakes() {
        for(let i = 0; i < this.flakeCount; i++) {
            this.flakes.push(this.CreateFlake());
        }
    }
    
    CreateFlake() {
        const squareSize = canvas.height;
        const halfSize = squareSize / 2;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        return {
            speed: 0,
            velY: 0,
            velX: 0,
            x: Math.random() * squareSize + (centerX - halfSize),
            y: Math.random() * squareSize + (centerY - halfSize),
            stepSize: Math.random() / 48,
            step: 0,
            opacity: Math.random() * 0.05 + 0.4,
            textureId: Math.floor(Math.random() * 3)
        };
    }
    
    ResetFlake(flake) {
        Object.assign(flake, this.CreateFlake());
    }
    
    ResetAllFlakes() {
        this.flakes.forEach(flake => {
            Object.assign(flake, this.CreateFlake());
        });
    }
    
    Draw() {
        if(audioInit) {
            const { flakes, minDist, damping } = this;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            for(let flake of flakes) {
                const dx = centerX - flake.x;
                const dy = centerY - flake.y;
                const distSquared = dx * dx + dy * dy;
                const dist = Math.sqrt(distSquared);
                
                if(dist < minDist && !audio.paused) {
                    const force = minDist / distSquared;
                    const xcomp = dx / dist;
                    const ycomp = dy / dist;
                    const deltaV = force * 1.5;
                    
                    flake.velX += deltaV * xcomp;
                    flake.velY += deltaV * ycomp;
                }
                
                flake.velX *= damping;
                flake.velY *= damping;
                
                flake.y += flake.velY;
                flake.x += flake.velX;
                
                if(dist < 118) {
                    this.ResetFlake(flake);
                }
                
                const maxOpacity = 1;
                const minOpacity = 0;
                const maxDistance = 512;
                
                const opacity = Math.max(minOpacity, maxOpacity - (dist / maxDistance) * maxOpacity);
                
                //let texturePath = SNOWIE_TEXTURE_PATHS[0][flake.textureId];
                //DrawImage(texturePath, flake.x - 4.5, flake.y - 4.5, opacity);
                
                ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                ctx.lineWidth = 1;
                
                ctx.beginPath();
                
                ctx.arc(flake.x, flake.y, opacity * 5, 0, Math.PI * 2);
                
                ctx.stroke();
            }
        }
    }
}

const lightLayer = new SnowieLayer();

lightLayer.InitFlakes();

function CanvasRender() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    lightLayer.Draw();
    
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

    let rads = Math.PI * 2 / 200;
    
    analyser.getByteFrequencyData(frequencyArray);
    for (let i = 0; i < 200; i++) {
        let barHeight = frequencyArray[i] * 0.6 * 1.5;
        
        x = centerX + Math.cos(rads * i) * 120;
        y = centerY + Math.sin(rads * i) * 120;
        xEnd = centerX + Math.cos(rads * i) * (120 + barHeight);
        yEnd = centerY + Math.sin(rads * i) * (120 + barHeight);
        
        DrawBar(x, y, xEnd, yEnd, frequencyArray[i]);
    }
    
    requestAnimationFrame(CanvasRender);
}

canvas.addEventListener('click', () => {
    if(!audioInit) return;
    
    audio.paused ? audio.play() : audio.pause();
});

canvas.addEventListener('wheel', e => {
    if(!audioInit) return;
    
    if(e.deltaY < 0) {
        audio.volume = Math.min(audio.volume + 0.1, 1.0);
    } else {
        audio.volume = Math.max(audio.volume - 0.1, 0.0);
    }
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
