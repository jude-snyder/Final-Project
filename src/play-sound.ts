 /**
  * Plays an audio element from the beginning.
  * 
  * @param {HTMLAudioElement} sound
  */
 
 export function playSound(sound: HTMLAudioElement) {
        sound.currentTime = 0;
        sound.play().catch(() => { });
    }