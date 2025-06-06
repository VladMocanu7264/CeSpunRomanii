import { useEffect, useState, useRef } from 'react';
import './QuestionPage.css';

function QuestionPage() {
    const [appName] = useState(import.meta.env.VITE_APP_NAME);
    const [question, setQuestion] = useState('');
    const [multiplier, setMultiplier] = useState(1);
    const [answers, setAnswers] = useState([]);
    const [revealedAnswers, setRevealedAnswers] = useState([]);
    const [totalScore, setTotalScore] = useState(0);
    const [team1Score, setTeam1Score] = useState(0);
    const [team2Score, setTeam2Score] = useState(0);
    const [buzzedTeam, setBuzzedTeam] = useState(null);
    const [strikeCount, setStrikeCount] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [team1Name, setTeam1Name] = useState("Team 1");
    const [team2Name, setTeam2Name] = useState("Team 2");

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    // Refs for live values inside setInterval
    const revealedRef = useRef(false);
    const buzzedTeamRef = useRef(null);
    const lastBuzzedTeam = useRef(null);

    const fetchTeamScores = () => {
        fetch(`${backendUrl}/team-scores`)
            .then((res) => res.json())
            .then((data) => {
                setTeam1Score(data.team1.score);
                setTeam2Score(data.team2.score);
                setTeam1Name(data.team1.name);
                setTeam2Name(data.team2.name);
            });
    };


    const fetchQuestion = () => {
        fetch(`${backendUrl}/current-question`)
            .then((res) => {
                if (res.status === 404) {
                    setQuestion(null);
                    return null;
                }
                return res.json();
            })
            .then((data) => {
                if (!data) return;
                setQuestion(data.text);
                setAnswers(data.answers);
                setMultiplier(data.multiplier || 1);
                setRevealed(false);
                revealedRef.current = false;
                setRevealedAnswers([]);
                setTotalScore(0);
                setBuzzedTeam(null);
                buzzedTeamRef.current = null;
                lastBuzzedTeam.current = null;
            });
    };

    useEffect(() => {
        let interval;

        const startPolling = () => {
            interval = setInterval(() => {
                if (!revealedRef.current || buzzedTeamRef.current) {
                    clearInterval(interval);
                    return;
                }

                fetch(`${backendUrl}/buzz-status`)
                    .then((res) => res.json())
                    .then((data) => {
                        if (
                            data.team &&
                            data.team !== buzzedTeamRef.current &&
                            data.team !== lastBuzzedTeam.current
                        ) {
                            lastBuzzedTeam.current = data.team;
                            buzzedTeamRef.current = data.team;
                            setBuzzedTeam(data.team);
                            setTimeout(() => {
                                buzzedTeamRef.current = null;
                                setBuzzedTeam(null);
                            }, 2000);
                            clearInterval(interval);
                        }
                    });
            }, 2000);
        };

        fetchTeamScores();
        fetchQuestion();
        startPolling();

        return () => clearInterval(interval);
    }, []);


    const handleRevealQuestion = () => {
        setRevealed(true);
        revealedRef.current = true;

        fetch(`${backendUrl}/reveal-question`, { method: 'POST' });

        const interval = setInterval(() => {
            if (!revealedRef.current || buzzedTeamRef.current) {
                clearInterval(interval);
                return;
            }

            fetch(`${backendUrl}/buzz-status`)
                .then((res) => res.json())
                .then((data) => {
                    if (
                        data.team &&
                        data.team !== buzzedTeamRef.current &&
                        data.team !== lastBuzzedTeam.current
                    ) {
                        lastBuzzedTeam.current = data.team;
                        buzzedTeamRef.current = data.team;
                        setBuzzedTeam(data.team);
                        setTimeout(() => {
                            buzzedTeamRef.current = null;
                            setBuzzedTeam(null);
                        }, 2000);
                        clearInterval(interval);
                    }
                });
        }, 2000);
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

    const handleRevealAll = () => {
        const revealedIndexes = answers.map((_, index) => index);
        setRevealedAnswers(revealedIndexes);
    };

    const showStrikes = (count) => {
        setStrikeCount(count);
        setTimeout(() => setStrikeCount(0), 1500);
    };

    const assignScoreToTeam = (teamNumber) => {
        fetch(`${backendUrl}/assign-score`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ team: teamNumber, score: totalScore }),
        }).then(() => {
            setTotalScore(0);
            fetchTeamScores();
        });
    };

    const handleNextQuestion = () => {
        fetch(`${backendUrl}/next-question`, {
            method: "POST",
        }).then(() => {
            fetchQuestion();
            setRevealed(false);
            setRevealedAnswers([]);
            setBuzzedTeam(null);
            setTotalScore(0);
        });
    };

    return (
        <div className="question-page">
            <h2 className="app-title">{appName}</h2>

            {question === null ? (
                <div className="game-over">
                    <h1>🎉 Game Over 🎉</h1>
                    <p>{team1Name}: {team1Score} points</p>
                    <p>{team2Name}: {team2Score} points</p>
                    <h2>
                        Winner:{' '}
                        {team1Score > team2Score
                            ? team1Name
                            : team2Score > team1Score
                                ? team2Name
                                : 'It’s a tie!'}
                    </h2>
                    <button
                        className="back-home-button"
                        onClick={() => (window.location.href = '/')}
                    >
                        Back to Home
                    </button>
                </div>
            ) : (
                <>
                    <div className="question-box">
                        {revealed ? (
                            <span className="question-text">{question}</span>
                        ) : (
                            <button className="reveal-button" onClick={handleRevealQuestion}>
                                Reveal Question
                            </button>
                        )}
                    </div>

                    {multiplier !== 1 && (
                        <div className="multiplier-display">Multiplier: x{multiplier}</div>
                    )}

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

                    <div className="team-score left-score">
                        {team1Score} - <strong>{team1Name}</strong>
                    </div>

                    <div className="team-score right-score">
                        <strong>{team2Name}</strong> - {team2Score}
                    </div>

                    <div className="controls">
                        <button onClick={() => showStrikes(1)}>❌</button>
                        <button onClick={() => showStrikes(2)}>❌❌</button>
                        <button onClick={() => showStrikes(3)}>❌❌❌</button>
                        <button onClick={() => assignScoreToTeam(1)}>🏆 Team 1 Wins</button>
                        <button onClick={() => assignScoreToTeam(2)}>🏆 Team 2 Wins</button>
                        <button onClick={handleRevealAll}>Reveal All</button>
                        <button onClick={handleNextQuestion}>Next Question</button>
                    </div>
                </>
            )}

            {buzzedTeam && <div className="buzzed-effect">{buzzedTeam}</div>}
            {strikeCount > 0 && (
                <div className="strike-effect">
                    {Array.from({ length: strikeCount }).map((_, i) => (
                        <span key={i}>❌</span>
                    ))}
                </div>
            )}
        </div>
    );
}

export default QuestionPage;
