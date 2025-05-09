import { Routes, Route } from 'react-router-dom';
import NewGamePage from './pages/NewGamePage';
import QuestionPage from './pages/QuestionPage';
import Team1ButtonPage from './pages/Team1ButtonPage';
import Team2ButtonPage from './pages/Team2ButtonPage';
import QRSetupPage from './pages/QRSetupPage';

function App() {
    return (
        <Routes>
            <Route path="/" element={<NewGamePage />} />
            <Route path="/question" element={<QuestionPage />} />
            <Route path="/team1" element={<Team1ButtonPage />} />
            <Route path="/team2" element={<Team2ButtonPage />} />
            <Route path="/setup" element={<QRSetupPage />} />
        </Routes>
    );
}

export default App;
