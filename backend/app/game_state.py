from typing import Optional, List, Dict

class GameState:
    def __init__(self):
        self.team_names = {1: "Team 1", 2: "Team 2"}
        self.selected_questionnaire: Optional[Dict] = None
        self.current_question_index: int = 0
        self.buzz_open = False
        self.buzzed_team: Optional[int] = None
        self.team_scores = {1: 0, 2: 0}

    def reset_buzz(self):
        self.buzzed_team = None
        self.buzz_open = False

    def get_current_question(self):
        if not self.selected_questionnaire:
            return None
        questions = self.selected_questionnaire.get("questions", [])
        if self.current_question_index >= len(questions):
            return None
        return questions[self.current_question_index]

    def get_score_multiplier(self):
        question = self.get_current_question()
        return question.get("multiplier", 1) if question else 1


game_state = GameState()
