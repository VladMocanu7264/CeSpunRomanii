import { useEffect, useState } from 'react';
import './QuestionPage.css';

function QuestionPage() {
    const [appName] = useState(import.meta.env.VITE_APP_NAME);
    const [question, setQuestion] = useState('');
    const [revealed, setRevealed] = useState(false);
    const [buzzedTeam, setBuzzedTeam] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [revealedAnswers, setRevealedAnswers] = useState([]);
    const [totalScore, setTotalScore] = useState(0);
    const [team1Score, setTeam1Score] = useState(0);
    const [team2Score, setTeam2Score] = useState(0);
    const [strikeCount, setStrikeCount] = useState(0);

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        fetch(`${backendUrl}/current-question`)
            .then((res) => res.json())
            .then((data) => {
                setQuestion(data.text);
                setAnswers(data.answers); // [{ text, score }, ...]
            });

        const interval = setInterval(() => {
            fetch(`${backendUrl}/buzz-status`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.team && data.team !== buzzedTeam) {
                        setBuzzedTeam(data.team);
                        setTimeout(() => setBuzzedTeam(null), 2000);
                    }
                });
        }, 500);

        return () => clearInterval(interval);
    }, [buzzedTeam]);

    const handleRevealQuestion = () => {
        setRevealed(true);
        fetch(`${backendUrl}/reveal-question`, { method: 'POST' });
    };

    const handleRevealAnswer = (index) => {
        if (revealedAnswers.includes(index)) return;
        const answer = answers[index];
        setRevealedAnswers([...revealedAnswers, index]);
        setTotalScore((prev) => prev + answer.score);

        fetch(`${backendUrl}/reveal-answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ index }),
        });
    };

    const showStrikes = (count) => {
        setStrikeCount(count);
        setTimeout(() => setStrikeCount(0), 1500);
    };

    const assignScoreToTeam = (teamNumber) => {
        if (teamNumber === 1) setTeam1Score((s) => s + totalScore);
        else if (teamNumber === 2) setTeam2Score((s) => s + totalScore);
        setTotalScore(0);
    };

    return (
        <div className="question-page">
            <h2 className="app-title">{appName}</h2>

            <div className="question-box">
                {revealed ? (
                    <span className="question-text">{question || 'Întrebare...'}</span>
                ) : (
                    <button className="reveal-button" onClick={handleRevealQuestion}>
                        Reveal Question
                    </button>
                )}
            </div>

            <div className="answers-grid">
                {Array.from({ length: 8 }).map((_, index) => {
                    const answer = answers[index];
                    const isRevealed = revealedAnswers.includes(index);

                    return (
                        <button
                            key={index}
                            className="answer-slot"
                            onClick={() => handleRevealAnswer(index)}
                            disabled={!revealed || isRevealed || !answer}
                        >
                            {isRevealed ? (
                                <>
                                    <div className="answer-text">{answer?.text}</div>
                                    <div className="answer-score">{answer?.score}</div>
                                </>
                            ) : (
                                <div className="placeholder">{index + 1}</div>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="total-score">Total: {totalScore}</div>

            {buzzedTeam && <div className="buzzed-effect">{buzzedTeam}</div>}
            {strikeCount > 0 && (
                <div className="strike-effect">
                    {Array.from({ length: strikeCount }).map((_, i) => (
                        <span key={i}>❌</span>
                    ))}
                </div>
            )}

            <div className="team-score left-score">
                {team1Score} - <strong>Team 1</strong>
            </div>

            <div className="team-score right-score">
                <strong>Team 2</strong> - {team2Score}
            </div>

            <div className="controls">
                <button onClick={() => showStrikes(1)}>❌</button>
                <button onClick={() => showStrikes(2)}>❌❌</button>
                <button onClick={() => showStrikes(3)}>❌❌❌</button>
                <button onClick={() => assignScoreToTeam(1)}>🏆 Team 1 Wins</button>
                <button onClick={() => assignScoreToTeam(2)}>🏆 Team 2 Wins</button>
            </div>
        </div>
    );
}

export default QuestionPage;
