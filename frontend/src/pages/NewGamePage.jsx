import { useEffect, useState } from 'react';
import './NewGamePage.css';

function NewGamePage() {
    const [appName] = useState(import.meta.env.VITE_APP_NAME);
    const [team1, setTeam1] = useState('Team 1');
    const [team2, setTeam2] = useState('Team 2');
    const [tempTeam1, setTempTeam1] = useState(team1);
    const [tempTeam2, setTempTeam2] = useState(team2);
    const [questionnaires, setQuestionnaires] = useState([]);

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        fetch(`${backendUrl}/questionnaires`)
            .then((res) => res.json())
            .then((data) => setQuestionnaires(data))
            .catch((err) => console.error('Error fetching questionnaires:', err));
    }, []);

    const confirmTeamName = (teamNumber) => {
        const newName = teamNumber === 1 ? tempTeam1 : tempTeam2;

        fetch(`${backendUrl}/set-team-name`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ team: teamNumber, name: newName }),
        });

        if (teamNumber === 1) setTeam1(newName);
        if (teamNumber === 2) setTeam2(newName);
    };

    const startGame = (questionnaireId) => {
        fetch(`${backendUrl}/start-game`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questionnaire_id: questionnaireId }),
        }).then(() => {
            window.location.href = '/setup';
        });
    };

    return (
        <div className="page-container">
            <h1 className="page-title">{appName}</h1>
            <div className="teams-container">
                <div className="team-block">
                    <h2>{team1}</h2>
                    <input
                        value={tempTeam1}
                        onChange={(e) => setTempTeam1(e.target.value)}
                    />
                    <button className="confirm-button" onClick={() => confirmTeamName(1)}>
                        Confirm
                    </button>
                </div>
                <div className="team-block">
                    <h2>{team2}</h2>
                    <input
                        value={tempTeam2}
                        onChange={(e) => setTempTeam2(e.target.value)}
                    />
                    <button className="confirm-button" onClick={() => confirmTeamName(2)}>
                        Confirm
                    </button>
                </div>
            </div>
            <div className="questions-container">
                <h3>Select a Questionnaire</h3>
                {questionnaires.map((q) => (
                    <button
                        key={q.id}
                        onClick={() => startGame(q.id)}
                        className="questionnaire-button"
                    >
                        {q.name}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default NewGamePage;
