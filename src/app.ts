/**
 * Main entry point for the Music Trivia game.
 * Handles UI setup, game state, audio playback, and game loop.
 */

import { getEl } from './get-el';
import { getRandomItem } from './get-random-item';
import { getRandomArtist } from './get-random-artist';
import { playSound } from './play-sound';
import { showResultsTable } from './show-results-table';
import type { HistoryNode } from './types';
import { ARTISTS } from './ARTISTS';

// Import confetti
import confetti from 'canvas-confetti';

console.log("DOM loaded");
console.log(document.getElementById("gameContainer"));

// Grabs all DOM elements
window.addEventListener("DOMContentLoaded", () => {
    /** @type {HTMLAudioElement} */
    const player = getEl<HTMLAudioElement>("player");
    /** @type {HTMLAudioElement} */
    const endSound = getEl<HTMLAudioElement>("endSound");
    /** Sound effects */
    const clickSfx = new Audio("/click.mp3");
    const correctSfx = new Audio("/correct.mp3");
    const wrongSfx = new Audio("/wrong.mp3");
    const relaxSfx = new Audio("/relax.mp3");
    const stressSfx = new Audio("/stress.mp3");

    /** Background menu music */
    const menuMusic = new Audio("/menu.mp3");
    menuMusic.loop = true;
    menuMusic.volume = 1;
    menuMusic.preload = "auto";

    const relaxResultsMusic = new Audio("/relax-results.mp3");
    relaxResultsMusic.loop = true;
    relaxResultsMusic.volume = 1;
    relaxResultsMusic.preload = "auto";

    const stressResultsMusic = new Audio("/stress-results.mp3");
    stressResultsMusic.loop = true;
    stressResultsMusic.volume = 1;
    stressResultsMusic.preload = "auto";
    
    /** UI elements */
    const answersDiv = getEl<HTMLDivElement>("answers");
    const result = getEl<HTMLParagraphElement>("result");
    const progress = getEl<HTMLParagraphElement>("progress");
    const scoreText = getEl<HTMLParagraphElement>("score");
    const streakText = getEl<HTMLParagraphElement>("streak");
    const restartBtn = getEl<HTMLButtonElement>("restart"); // "Return to Menu" button
    const resultsTable = getEl<HTMLDivElement>("resultsTable");
    const modeSelect = getEl<HTMLDivElement>("modeSelect");
    const timerText = getEl<HTMLParagraphElement>("timer");
    const relaxBtn = getEl<HTMLButtonElement>("relaxBtn");
    const stressBtn = getEl<HTMLButtonElement>("stressBtn");
    const backToMenuBtn = getEl<HTMLButtonElement>("backToMenuBtn");

    /** @type {HTMLButtonElement | null} */
    let musicBtn: HTMLButtonElement | null = null;

    try {
        musicBtn = getEl<HTMLButtonElement>("musicBtn");
    } catch (error) {
        console.warn("musicBtn not found in DOM.");
    }
    const setupScreen = getEl<HTMLDivElement>("setupScreen");
    const setupTitle = getEl<HTMLHeadingElement>("setupTitle");
    const questionOptions = getEl<HTMLDivElement>("questionOptions");
    const startBtn = getEl<HTMLButtonElement>("startBtn");
    const qButtons = document.querySelectorAll<HTMLButtonElement>(".qBtn");
    const loadingOverlay = getEl<HTMLDivElement>("loadingOverlay");
    const gameContainer = document.getElementById("gameContainer")!;
    if (!gameContainer) {
        throw new Error("gameContainer missing - app cannot run");
    }

    // Hide audio controls from user
    player.style.display = 'none';
    endSound.style.display = 'none';

    /**
     * iTunes API track type
     */
    type Track = {
        previewUrl: string;
        artistName: string;
        trackName: string;
        trackExplicitness: string;
    }

    /** Game state variables */
    let questionNumber = 0
    let totalQuestions = 20
    let usedArtists = new Set<string>();
    let usedTracks = new Set<string>();
    let score = 0;
    let streak = 0;
    let highestStreak = 0;
    let isGameOver = false;

    /** @type {"relax" | "stress" | null} */
    let mode: "relax" | "stress" | null = null;
    let timeLeft = 300; // 5 minutes in seconds
    let timerInterval: ReturnType<typeof setInterval> | null = null;

    /** @type {HistoryNode[]} */
    let history: HistoryNode[] = [];


    restartBtn.onclick = () => {
        playSound(clickSfx);
        setTimeout(() => {
            resetGame();
        }, 500);
    };

    relaxBtn.onclick = () => {
        playSound(clickSfx);
        playSound(relaxSfx);
        selectMode("relax", qButtons, startBtn);
    };
    stressBtn.onclick = () => {
        playSound(clickSfx);
        playSound(stressSfx);
        selectMode("stress", qButtons, startBtn);
    };

    if (musicBtn) {
        musicBtn.onclick = () => {
            menuMusic.play().catch(() => { });

            playSound(clickSfx);

            musicBtn!.classList.add("fade-out");
            setTimeout(() => {
                musicBtn!.style.display = "none";
            }, 600);
        };
    }


    function selectMode(selected: "relax" | "stress", qButtons: NodeListOf<HTMLButtonElement>, startBtn: HTMLButtonElement) {
        mode = selected;

        modeSelect.style.display = "none";
        setupScreen.style.display = "block";
        backToMenuBtn.style.display = "block";

        document.body.classList.remove("relax-mode", "stress-mode");
        document.body.classList.add(
            selected === "relax" ? "relax-mode" : "stress-mode"
        );

        if (selected === "relax") {
            setupTitle.textContent = "😌 Relax Mode";
            questionOptions.style.display = "block";
            startBtn.disabled = true;
        } else {
            setupTitle.textContent = "😰 Stress Mode (5 min)";
            questionOptions.style.display = "none";
            startBtn.disabled = false;
        }

        qButtons.forEach(btn => {
            btn.onclick = () => {
                playSound(clickSfx);
                totalQuestions = Number(btn.dataset.q);

                qButtons.forEach(b => b.classList.remove("selected"));
                btn.classList.add("selected");

                startBtn.disabled = false;
            };
        });

        startBtn.onclick = () => {
            playSound(clickSfx);

            menuMusic.pause();
            menuMusic.currentTime = 0;

            startGame();
        }
    };

    backToMenuBtn.onclick = () => {
        playSound(clickSfx);

        setupScreen.style.display = "none";
        modeSelect.style.display = "block";

        mode = null;

        qButtons.forEach(btn => btn.classList.remove("selected"));
        document.body.classList.remove("relax-mode", "stress-mode");
        document.body.style.background = "";
        startBtn.disabled = true;

        backToMenuBtn.style.display = "none";
    };

    // Start game with selected mode
    function startGame() {
        setupScreen.style.display = "none";
        restartBtn.style.display = "block";

        if (mode === "stress") {
            startTimer();
        }

        loadQuestion();
    }

    /**
     * Formants seconds into MM:SS format for the timer display
     * @param {number} seconds
     * @returns {string}
     */
    function formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }


    /**
     * Starts the countdown timer for Stress Mode.
     */
    function startTimer() {
        timeLeft = 300;
        timerText.style.display = "block";

        timerInterval = setInterval(() => {
            timeLeft--;
            timerText.textContent = `⏱️ ${formatTime(timeLeft)}`;

            if (timerInterval !== null && timeLeft <= 0) {
                clearInterval(timerInterval);
                timerText.textContent = "⏱️ Time's up!";
                endGame();
            }
        }, 1000);
    }

    /**
     * Pauses the active timer. Used when loading new questions in Stress Mode to give players a break.
     */
    function pauseTimer() {
        if (timerInterval !== null) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    /**
     * Resumes the timer if time remains.
     */
    function resumeTimer() {
        if (timerInterval === null && timeLeft > 0) {
            timerInterval = setInterval(() => {
                timeLeft--;
                timerText.textContent = `⏱️ ${formatTime(timeLeft)}`;

                if (timeLeft <= 0) {
                    pauseTimer();
                    timerText.textContent = "⏱️ Time's up";
                    endGame();
                }
            }, 1000);
        }
    }

    /**
     * Ends the game and shows results.
     */
    function endGame() {
        isGameOver = true;
        // Stop music and timer
        player.pause();
        player.currentTime = 0;

        menuMusic.pause();
        menuMusic.currentTime = 0;

        relaxResultsMusic.pause();
        stressResultsMusic.pause();
        
        if (timerInterval !== null) {
            clearInterval(timerInterval);
        }
        gameContainer.style.display = "none";

        progress.textContent = "⏰ Time's Up!";
        answersDiv.innerHTML = "";
        scoreText.textContent = "";
        streakText.textContent = "";
        result.textContent = ""
        answersDiv.innerHTML = "";
        loadingOverlay.style.display = "none";
        showResultsTable(score, mode, totalQuestions, highestStreak, history, resultsTable);
        playEndSong();
        confetti();

        if (mode === "relax") {
            relaxResultsMusic.currentTime = 0;
            relaxResultsMusic.play().catch(() => { });
        } else if (mode === "stress") {
            stressResultsMusic.currentTime = 0;
            stressResultsMusic.play().catch(() => { });
        }
    }

    /**
     * Loads and displays a new trivia question.
     * Handoes fetching songs and generating answers.
     */
    async function loadQuestion() {
        if (isGameOver) return;

        if (mode === "stress") {
            pauseTimer();
        }
        loadingOverlay.style.display = "flex";
        answersDiv.style.opacity = "0";
        await new Promise(res => setTimeout(res, 300));
        if (mode === "relax" && questionNumber >= totalQuestions) {
            player.pause();
            player.currentTime = 0;
            progress.textContent = "🎉 Quiz Complete!";
            answersDiv.innerHTML = "";
            scoreText.textContent = "";
            streakText.textContent = "";
            result.textContent = ""
            showResultsTable(score, mode, totalQuestions, highestStreak, history, resultsTable);
            playEndSong();
            confetti();
            relaxResultsMusic.currentTime = 0;
            relaxResultsMusic.play().catch(err => {
                console.error("Relax results music failed to play:", err);
            });
            loadingOverlay.style.display = "none";
            return;
        }

        result.textContent = "";
        answersDiv.innerHTML = "";

        progress.textContent = `Question ${questionNumber + 1}`;
        scoreText.textContent = `Score: ${score}`;
        streakText.textContent = `🔥 Streak: ${streak}`;


        // Pick an unused artist
        let artist: string;
        if (usedArtists.size >= ARTISTS.length) {
            usedArtists.clear(); // Reset if we've used all artists
        }

        do {
            artist = getRandomArtist(ARTISTS);
        } while (usedArtists.has(artist));

        usedArtists.add(artist);

        // Fetch songs for the artist from iTunes API
        try {
            const res = await fetch(
                `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=song&limit=50`
            );

            const data = await res.json();

            let tracks = (data.results as Track[]).filter(t =>
                t.previewUrl &&
                t.artistName &&
                t.trackName &&
                t.trackExplicitness === "notExplicit"
            );

            const normalizeArtist = (name: string) => name.trim().toLowerCase();
            const isExactArtistMatch = (trackArtist: string, selectedArtist: string) =>
                normalizeArtist(trackArtist) === normalizeArtist(selectedArtist);
            const isLikelyCollab = (trackArtist: string) =>
                /(feat\.|featuring|ft\.|&| with | x | X )/i.test(trackArtist);

            const exactArtistTracks = tracks.filter(track => isExactArtistMatch(track.artistName, artist));
            const fallbackArtistTracks = tracks.filter(track =>
                normalizeArtist(track.artistName).includes(normalizeArtist(artist)) &&
                !isLikelyCollab(track.artistName)
            );

            const eligibleTracks = exactArtistTracks.length > 0 ? exactArtistTracks : fallbackArtistTracks.length > 0 ? fallbackArtistTracks : tracks;
            const availableTracks = eligibleTracks.filter(t => {
                const trackKey = `${t.trackName} - ${t.artistName}`;
                return !usedTracks.has(trackKey);
            });

            const trackPool = availableTracks.length > 0 ? availableTracks : eligibleTracks;
            const correctTrack = getRandomItem(trackPool);
            usedTracks.add(`${correctTrack.trackName} - ${correctTrack.artistName}`);

            const correctArtist = artist;
            player.src = correctTrack.previewUrl;
            player.currentTime = 0;

            // Try to play the preview (some browsers require user interaction first)
            try {
                await player.play();
                result.textContent = "🎵 Playing preview...";
            } catch {
                result.textContent = "▶️ Press play to hear the clip";
            }

            const options: string[] = [correctArtist];

            while (options.length < 4) {
                const randomArtist = getRandomArtist(ARTISTS);
                if (!options.includes(randomArtist)) {
                    options.push(randomArtist);
                }
            }

            options.sort(() => Math.random() - 0.5);

            answersDiv.style.opacity = "0";

            // Create answer buttons
            options.forEach(name => {
                const btn = document.createElement("button");
                btn.textContent = name;
                btn.onclick = () => {
                    if (isGameOver) return;
                    answersDiv.classList.add("answers-locked");

                    const buttons = Array.from(answersDiv.children) as HTMLButtonElement[];

                    buttons.forEach(b => b.disabled = true);

                    const isCorrect = name === correctArtist;

                    // Save to history for results table
                    history.push({
                        track: correctTrack.trackName,
                        artist: correctArtist,
                        userAnswer: name,
                        correctAnswer: correctArtist
                    });

                    // Check answer and update score/streak
                    if (name === correctArtist) {
                        playSound(correctSfx);
                        score++;
                        streak++;
                        if (streak > highestStreak) highestStreak = streak;
                        result.textContent = "✅ Correct!";
                    } else {
                        playSound(wrongSfx);
                        streak = 0;

                        result.textContent = `❌ Wrong! It was ${correctArtist}`;
                    }

                    buttons.forEach(b => {
                        if (b.textContent === correctArtist) {
                            b.classList.add("correct");
                            b.classList.add("selected-answer");
                        } else {
                            b.classList.add("incorrect");
                        }
                    });


                    if (!isGameOver) {
                        scoreText.textContent = `Score: ${score}`;
                        streakText.textContent = `🔥 Streak: ${streak}`;
                    }

                    questionNumber++;

                    setTimeout(() => {
                        answersDiv.classList.remove("answers-locked");
                        if (!isGameOver) loadQuestion();
                    }, 1500);
                };

                answersDiv.appendChild(btn);
            });

            await new Promise(res => setTimeout(res, 50));
            answersDiv.style.opacity = "1";
            loadingOverlay.style.display = "none";

            if (mode === "stress") {
                resumeTimer();
            }
        } catch {
            result.textContent = "⚠️ Error loading songs. Retrying...";
            setTimeout(loadQuestion, 1000);

            if (mode === "stress") {
                resumeTimer();
            }

            setTimeout(loadQuestion, 1000);
        }
    }

    /**
     * Resets the game by reloading the page.
     */
    function resetGame() {
        isGameOver = true;
       
        relaxResultsMusic.pause();
        relaxResultsMusic.currentTime = 0;
       
        stressResultsMusic.pause();
        stressResultsMusic.currentTime = 0;
        
        restartBtn.style.display = "none";
        document.body.classList.remove("relax-mode", "stress-mode");
        document.body.style.background = "";
        
        location.reload();
    }

    /**
     * Plays the end-of-game applause sound.
     */
    function playEndSong() {
        endSound.src = "/applause.mp3";
        endSound.currentTime = 0;
        endSound.muted = false;
        endSound.volume = 0.6;

        endSound.play().catch(() => { });
    }

    progress.textContent = "";
    scoreText.textContent = "";
    streakText.textContent = "";
    result.textContent = "";
});
