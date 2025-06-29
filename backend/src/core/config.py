# src/core/config.py

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional, List, Dict, Tuple
import random

from .fingerprint import BrowserFingerprint

DEFAULT_REFERRER_SOURCES = [
    "https://www.google.com/", "https://www.bing.com/", "https://duckduckgo.com/",
    "https://t.co/", "https://www.facebook.com/", "https://linkedin.com/",
]

@dataclass
class Persona:
    name: str
    goal_keywords: Dict[str, int] = field(default_factory=dict)
    generic_keywords: Dict[str, int] = field(default_factory=dict)
    navigation_depth: Tuple[int, int] = (3, 6)
    avg_time_per_page: Tuple[int, int] = (20, 60)
    gender: str = "Neutral"
    age_range: Tuple[int, int] = (18, 65)
    can_fill_forms: bool = False
    goal: Optional[Dict[str, Any]] = None
    scroll_probability: float = 0.85
    form_interaction_probability: float = 0.25
    country_preference: Optional[str] = None
    language_preference: Optional[str] = None

    def to_dict(self):
        return {
            "name": self.name,
            "goal_keywords": self.goal_keywords,
            "generic_keywords": self.generic_keywords,
            "navigation_depth": self.navigation_depth,
            "avg_time_per_page": self.avg_time_per_page,
            "can_fill_forms": self.can_fill_forms,
            "gender": self.gender,
            "age_range": self.age_range,
        }

@dataclass
class TrafficConfig:
    project_root: Path
    target_url: str
    total_sessions: int
    max_concurrent: int
    headless: bool = True
    proxy_file: Optional[str] = None
    returning_visitor_rate: float = 30.0
    navigation_timeout: int = 60000
    max_retries_per_session: int = 2
    personas: List[Persona] = field(default_factory=list)
    gender_distribution: Dict[str, int] = field(default_factory=lambda: {"Male": 50, "Female": 50})
    device_distribution: Dict[str, int] = field(default_factory=lambda: {"Desktop": 60, "Mobile": 30, "Tablet": 10})
    country_distribution: Dict[str, int] = field(default_factory=BrowserFingerprint.get_country_distribution)
    age_distribution: Dict[str, int] = field(default_factory=lambda: {"18-24": 20, "25-34": 30, "35-44": 25, "45-54": 15, "55+": 10})
    referrer_sources: List[str] = field(default_factory=lambda: DEFAULT_REFERRER_SOURCES)
    mode_type: str = "Bot"

    def __post_init__(self):
        """Validate configuration after initialization."""
        if not self.target_url or not self.target_url.startswith(('http://', 'https://')):
            raise ValueError("A valid target_url starting with http:// or https:// is required.")
        
        if self.total_sessions <= 0:
            raise ValueError("total_sessions must be positive.")
        
        if self.max_concurrent <= 0:
            raise ValueError("max_concurrent must be positive.")
        
        if self.max_concurrent > self.total_sessions:
            raise ValueError("max_concurrent cannot be greater than total_sessions.")
            
        if not (0 <= self.returning_visitor_rate <= 100):
            raise ValueError("returning_visitor_rate must be between 0 and 100.")

        if not self.personas:
            raise ValueError("At least one persona must be defined.")

        def validate_distribution(dist: Dict[str, int], name: str):
            if not dist:
                raise ValueError(f"{name} distribution cannot be empty.")
            if sum(dist.values()) != 100:
                raise ValueError(f"The sum of values in {name} distribution must be 100.")

        validate_distribution(self.gender_distribution, "gender_distribution")
        validate_distribution(self.device_distribution, "device_distribution")
        validate_distribution(self.age_distribution, "age_distribution")
        # country_distribution is validated by its source

DEFAULT_PERSONAS = [
    Persona(
        name="Methodical Customer",
        goal_keywords={"contact": 10, "price": 10, "demo": 9, "signup": 8, "form": 7},
        generic_keywords={"faq": 6, "testimonial": 7, "about us": 5},
        navigation_depth=(4, 7), avg_time_per_page=(40, 75), can_fill_forms=True,
        goal={"type": "fill_form", "target_selector": "form#contact-form, form[name*='contact']"},
    ),
    Persona(
        name="Deep Researcher",
        goal_keywords={"whitepaper": 12, "case study": 12, "report": 10, "data": 9},
        generic_keywords={"blog": 5, "resources": 8, "library": 7},
        navigation_depth=(6, 10), avg_time_per_page=(50, 90), can_fill_forms=False,
        goal={"type": "find_and_click", "target_text": "download|unduh|get now"},
    ),
    Persona(
        name="Performance Analyst",
        goal_keywords={"home": 10, "about": 8, "products": 9, "blog": 7},
        generic_keywords={"news": 5, "contact": 6},
        navigation_depth=(5, 8), avg_time_per_page=(10, 20), can_fill_forms=False,
        goal={"type": "collect_web_vitals", "pages_to_visit": 5},
    ),
    Persona(
        name="Quick Browser",
        goal_keywords={"home": 8, "products": 7, "services": 6},
        generic_keywords={"blog": 3, "news": 4},
        navigation_depth=(2, 4), avg_time_per_page=(15, 30),
    ),
    Persona(
        name="Job Seeker",
        goal_keywords={"career": 12, "job": 10, "hiring": 9, "vacancies": 9},
        generic_keywords={"about": 6, "company": 8, "team": 7},
        navigation_depth=(6, 10), avg_time_per_page=(45, 90), can_fill_forms=True,
        goal={"type": "find_and_click", "target_text": "apply|daftar sekarang|lamar"},
    ),
]
