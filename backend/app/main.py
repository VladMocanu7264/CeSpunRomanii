import os
import json
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from app.game_state import game_state
from fastapi import Path
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

app = FastAPI()

class NoCacheMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["Cache-Control"] = "no-store"
        return response

app.add_middleware(NoCacheMiddleware)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # adjust this for production
    allow_methods=["*"],
    allow_headers=["*"],
)

QUESTIONNAIRE_DIR = os.path.join(os.path.dirname(__file__), "questionnaires")


@app.get("/questionnaires")
def list_questionnaires():
    files = [f for f in os.listdir(QUESTIONNAIRE_DIR) if f.endswith(".json")]
    result = []
    for f in files:
        with open(os.path.join(QUESTIONNAIRE_DIR, f), encoding="utf-8") as file:
            data = json.load(file)
            result.append({"id": data["id"], "name": data["name"]})
    return result


@app.post("/start-game")
async def start_game(request: Request):
    body = await request.json()
    questionnaire_id = body.get("questionnaire_id")
    file_path = os.path.join(QUESTIONNAIRE_DIR, f"{questionnaire_id}.json")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Questionnaire not found")

    with open(file_path, encoding="utf-8") as file:
        game_state.selected_questionnaire = json.load(file)
        game_state.current_question_index = 0
        game_state.team_scores = {1: 0, 2: 0}
        game_state.reset_buzz()

    return {"status": "game started"}

@app.post("/set-team-name")
async def set_team_name(request: Request):
    data = await request.json()
    team = data.get("team")
    name = data.get("name")

    if team not in (1, 2):
        raise HTTPException(status_code=400, detail="Invalid team number")

    game_state.team_names[team] = name
    return {"message": f"Team {team} name set to {name}"}


@app.get("/get-team-name/{team_number}")
def get_team_name(team_number: int = Path(..., ge=1, le=2)):
    return {"name": game_state.team_names[team_number]}

@app.get("/current-question")
def get_current_question():
    question = game_state.get_current_question()
    if not question:
        raise HTTPException(status_code=404, detail="No more questions")
    return question


@app.post("/next-question")
def next_question():
    if not game_state.selected_questionnaire:
        raise HTTPException(status_code=400, detail="Game not started")

    total_questions = len(game_state.selected_questionnaire.get("questions", []))

    if game_state.current_question_index + 1 >= total_questions:
        game_state.current_question_index += 1
        return {"status": "game over"}

    game_state.current_question_index += 1
    game_state.reset_buzz()

    return {"status": "next question", "index": game_state.current_question_index}



@app.post("/assign-score")
async def assign_score(request: Request):
    data = await request.json()
    team = data.get("team")
    score = data.get("score", 0)

    if team not in (1, 2):
        raise HTTPException(status_code=400, detail="Invalid team number")

    multiplier = game_state.get_score_multiplier()
    total_points = score * multiplier
    game_state.team_scores[team] += total_points

    return {"status": "score assigned", "team": team, "points": total_points}


@app.get("/team-scores")
def get_team_scores():
    return {
        "team1": {
            "name": game_state.team_names[1],
            "score": game_state.team_scores[1]
        },
        "team2": {
            "name": game_state.team_names[2],
            "score": game_state.team_scores[2]
        }
    }


@app.post("/reveal-question")
def reveal_question():
    game_state.buzz_open = True
    game_state.buzzed_team = None
    return {"status": "buzzing enabled"}


@app.post("/buzz")
async def buzz(request: Request):
    data = await request.json()
    team = data.get("team")

    if team not in (1, 2):
        raise HTTPException(status_code=400, detail="Invalid team number")

    if not game_state.buzz_open:
        return {"status": "ignored"}

    if game_state.buzzed_team is None:
        game_state.buzzed_team = f"Team {team}"
        game_state.buzz_open = False
        return {"status": "accepted", "team": game_state.buzzed_team}
    else:
        return {"status": "ignored", "team": game_state.buzzed_team}


@app.get("/buzz-status")
def buzz_status():
    return {"team": game_state.buzzed_team}
