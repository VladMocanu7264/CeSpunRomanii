import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './TeamButtonPage.css';
import buzzerImg from '../assets/buzzer.png';

function TeamButtonPage({ teamNumber }) {
    const [teamName, setTeamName] = useState('');
    const [disabled, setDisabled] = useState(false);

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        fetch(`${backendUrl}/get-team-name/${teamNumber}`)
            .then((res) => res.json())
            .then((data) => setTeamName(data.name))
            .catch((err) => console.error(err));
    }, [teamNumber]);

    const handleClick = () => {
        if (disabled) return;

        fetch(`${backendUrl}/buzz`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ team: teamNumber }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.status === 'accepted') {
                    setDisabled(true);
                    setTimeout(() => setDisabled(false), 10000); // 10 seconds cooldown
                }
            })
            .catch((err) => console.error(err));
    };

    return (
        <div className="buzzer-page">
            <h1 className="team-name">{teamName}</h1>
            <button
                className="buzzer-button"
                onClick={handleClick}
                disabled={disabled}
                style={{ opacity: disabled ? 0.4 : 1 }}
            >
                <img src={buzzerImg} alt="Buzzer" className="buzzer-image" />
            </button>
        </div>
    );
}

export default TeamButtonPage;
