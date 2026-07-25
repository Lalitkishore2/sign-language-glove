"""
Kinex Backend — Context Service

Server-side context analysis for recognized text.
Determines when Gemini enrichment should be invoked.

Rules:
- Gemini NEVER participates in gesture recognition.
- Gemini ONLY enriches already-recognized text with meaning,
  grammar correction, and contextual information.
"""

from typing import Optional, Dict, Any, List

from ..core import recognition_logger


class ContextService:
    """
    Analyzes recognized gloss sequences and determines
    whether the text is ready for AI enrichment.
    """

    def __init__(self):
        self._history: List[str] = []
        recognition_logger.info("ContextService initialized")

    def analyze(self, glosses: List[str]) -> Dict[str, Any]:
        """
        Analyze a sequence of recognized glosses for completeness.
        
        Returns context metadata including:
        - is_complete: whether the phrase appears complete
        - should_enrich: whether Gemini should be invoked
        - suggested_prompt: prompt template for Gemini if applicable
        """
        if not glosses:
            return {
                "is_complete": False,
                "should_enrich": False,
                "suggested_prompt": None,
                "context_type": "empty",
            }

        # Simple heuristics for phrase completeness
        phrase = " ".join(glosses)
        word_count = len(glosses)

        # Short phrases likely need more context
        if word_count < 2:
            return {
                "is_complete": False,
                "should_enrich": False,
                "suggested_prompt": None,
                "context_type": "partial",
            }

        # Phrases with 2+ words may benefit from grammar correction
        return {
            "is_complete": word_count >= 3,
            "should_enrich": word_count >= 2,
            "suggested_prompt": self._build_enrichment_prompt(phrase),
            "context_type": "phrase" if word_count >= 3 else "partial",
        }

    def _build_enrichment_prompt(self, phrase: str) -> str:
        """Build a structured prompt for Gemini enrichment."""
        return (
            f"The following phrase was recognized from Indian Sign Language (ISL). "
            f"It may contain gloss-order words that need grammatical correction. "
            f"Please: 1) Correct the grammar to natural English, "
            f"2) Provide the meaning, "
            f"3) Note any ambiguities.\n\n"
            f"ISL Gloss Sequence: {phrase}"
        )

    def add_to_history(self, gloss: str):
        """Track recognized glosses for contextual analysis."""
        self._history.append(gloss)
        # Keep history bounded
        if len(self._history) > 100:
            self._history = self._history[-50:]

    def clear_history(self):
        """Reset context history."""
        self._history.clear()

    @property
    def history(self) -> List[str]:
        return list(self._history)


# Singleton
context_service = ContextService()
