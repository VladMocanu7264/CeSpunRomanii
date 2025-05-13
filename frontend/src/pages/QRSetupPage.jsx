import QRCode from 'react-qr-code';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './QRSetupPage.css';

function QRSetupPage() {
    const navigate = useNavigate();
    const [team1, setTeam1] = useState('Team 1');
    const [team2, setTeam2] = useState('Team 2');
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const frontendBase = window.location.origin;

    useEffect(() => {
        fetch(`${backendUrl}/get-team-name/1`)
            .then((res) => res.json())
            .then((data) => setTeam1(data.name || 'Team 1'));

        fetch(`${backendUrl}/get-team-name/2`)
            .then((res) => res.json())
            .then((data) => setTeam2(data.name || 'Team 2'));
    }, []);

    const handleStart = () => {
        navigate('/question');
    };

    return (
        <div className="qr-setup-page">
            <h1>Scan Your Buzzer</h1>
            <div className="qr-pair">
                <div className="qr-block">
                    <QRCode value={`${frontendBase}/team1`} size={256} />
                    <p>{team1}</p>
                </div>
                <div className="qr-block">
                    <QRCode value={`${frontendBase}/team2`} size={256} />
                    <p>{team2}</p>
                </div>
            </div>
            <button className="start-button" onClick={handleStart}>
                Start Game
            </button>
        </div>
    );
}

export default QRSetupPage;
