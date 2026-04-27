
/**
 * Represents a single answered question in the game history.
 */
export type HistoryNode = {
    track: string;
    artist: string;
    userAnswer: string;
    correctAnswer: string;
}