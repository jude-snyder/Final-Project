  export function playSound(sound: HTMLAudioElement) {
        sound.currentTime = 0;
        sound.play().catch(() => { });
    }