import asyncio
import logging
import os
import time
import traceback
from random import choice, choices, randint, uniform
from typing import Optional, Dict, Any, Tuple

from playwright.async_api import (
    Browser,
    BrowserContext,
    Error as PlaywrightError,
    Playwright,
    TimeoutError as PlaywrightTimeoutError,
    async_playwright,
)

from .behavior import IntelligentBehaviorSimulator
from .config import TrafficConfig, Persona
from .fingerprint import BrowserFingerprint

logger = logging.getLogger(__name__)


class AdvancedTrafficGenerator:
    """Main class for running traffic simulations."""

    def __init__(self, config: TrafficConfig):
        self.config = config
        self.behavior_simulator = IntelligentBehaviorSimulator(config, mode_type=config.mode_type)
        self.semaphore = asyncio.Semaphore(config.max_concurrent)
        self.proxies = self._load_proxies()
        self.stop_event = asyncio.Event()
        self.session_stats = {
            "total": 0,
            "successful": 0,
            "failed": 0,
            "completed": 0,
            "total_duration": 0.0,
        }

    def _log(self, message: str, level: str = "info", **kwargs):
        """Logs a message to the logger."""
        getattr(logger, level, logger.info)(message, **kwargs)

    def _load_proxies(self) -> list:
        """Loads a list of proxies from the provided file."""
        if not self.config.proxy_file:
            return []
        try:
            with open(self.config.proxy_file) as f:
                return [{"server": line.strip()} for line in f if line.strip()]
        except FileNotFoundError:
            self._log(f"Proxy file not found: {self.config.proxy_file}", level="error")
            return []
        except Exception as e:
            self._log(f"Failed to load proxies: {e}", level="error", exc_info=True)
            return []

    def _get_demographics(self) -> Dict[str, Any]:
        """Determines the demographic profile for a session."""
        devices, device_weights = zip(*self.config.device_distribution.items())
        countries, country_weights = zip(*self.config.country_distribution.items())
        age_groups, age_weights = zip(*self.config.age_distribution.items())
        genders, gender_weights = zip(*self.config.gender_distribution.items())

        age_map = {
            "18-24": (18, 24), "25-34": (25, 34), "35-44": (35, 44),
            "45-54": (45, 54), "55+": (55, 75), "18-75": (18, 75),
        }
        selected_age_group = choices(age_groups, weights=age_weights, k=1)[0]

        return {
            "device_type": choices(devices, weights=device_weights, k=1)[0],
            "country": choices(countries, weights=country_weights, k=1)[0],
            "age_range": age_map.get(selected_age_group, (18, 65)),
            "gender": choices(genders, weights=gender_weights, k=1)[0],
        }

    def _get_user_profile(self, demographics: Dict[str, Any]) -> Tuple[str, str]:
        """Determines the user profile for a session (new or returning)."""
        is_returning = uniform(0, 100) < self.config.returning_visitor_rate
        profile_dir = self.config.project_root / "output" / "profiles"
        profile_dir.mkdir(parents=True, exist_ok=True)
        
        existing_profiles = [d.name for d in profile_dir.iterdir() if d.is_dir()]

        if is_returning and existing_profiles:
            return "Returning", choice(existing_profiles)
        
        return "New", f"user_{int(time.time())}_{randint(1000, 9999)}"

    async def _create_browser_context(
        self,
        playwright: Playwright,
        profile_id: str,
        demographics: Dict[str, Any],
    ) -> Optional[BrowserContext]:
        """Creates a browser context with a specific profile and fingerprint."""
        browser = None
        try:
            profile_path = self.config.project_root / "output" / "profiles" / profile_id
            profile_path.mkdir(exist_ok=True)

            fingerprint = BrowserFingerprint.get_random_fingerprint(
                demographics["device_type"], demographics["country"], demographics["age_range"]
            )

            context_args = {
                k: v for k, v in fingerprint.items() 
                if k in ["user_agent", "viewport", "locale", "timezone_id", "is_mobile", 
                         "has_touch", "device_scale_factor", "color_scheme", "reduced_motion"]
            }
            context_args["permissions"] = ["geolocation"]
            if self.config.referrer_sources:
                context_args["extra_http_headers"] = {"Referer": choice(self.config.referrer_sources)}

            state_path = profile_path / "state.json"
            if state_path.exists():
                context_args["storage_state"] = str(state_path)

            proxy = choice(self.proxies) if self.proxies else None
            
            browser = await playwright.chromium.launch(headless=self.config.headless, proxy=proxy)
            context = await browser.new_context(**context_args)

            if self.config.network_type == "Offline":
                await context.set_offline(True)

            init_script = f"""
                Object.defineProperty(navigator, 'webdriver', {{ get: () => undefined }});
                Object.defineProperty(navigator, 'hardwareConcurrency', {{ get: () => {fingerprint.get("hardware_concurrency", 4)} }});
                Object.defineProperty(navigator, 'deviceMemory', {{ get: () => {fingerprint.get("device_memory", 8)} }});
            """
            await context.add_init_script(init_script)
            
            # Attach browser to context for easier cleanup
            context.browser = browser
            return context
        except Exception as e:
            self._log(f"Failed to create context for {profile_id}: {e}", level="error", exc_info=True)
            if browser:
                await browser.close()
            return None

    async def _execute_session_logic(
        self, context: BrowserContext, persona: Persona, profile_id: str
    ) -> Dict[str, Any]:
        """Contains the core logic of a single user session."""
        page = await context.new_page()
        try:
            await page.goto(
                self.config.target_url,
                wait_until="domcontentloaded",
                timeout=self.config.navigation_timeout,
            )
            await page.wait_for_load_state("networkidle", timeout=self.config.navigation_timeout)

            goal_result = await self.behavior_simulator.run_goal_oriented_session(page, persona)
            
            storage_path = self.config.project_root / "output" / "profiles" / profile_id / "state.json"
            await context.storage_state(path=str(storage_path))
            
            return goal_result
        finally:
            await page.close()

    async def _run_single_session(self, playwright: Playwright, session_id: int):
        """Orchestrates a single session, including setup, execution, and cleanup."""
        if self.stop_event.is_set():
            return

        async with self.semaphore:
            if self.stop_event.is_set():
                return

            self.session_stats["total"] += 1
            start_time = time.time()
            
            demographics = self._get_demographics()
            visitor_type, profile_id = self._get_user_profile(demographics)
            
            persona = choice(self.config.personas)
            persona.gender = demographics["gender"]
            persona.age_range = demographics["age_range"]

            log_prefix = (f"Session {session_id:03d} "
                          f"[{visitor_type[0]}/{demographics['device_type']}/{persona.name}/"
                          f"{persona.gender}/{demographics['age_range'][0]}-{demographics['age_range'][1]}/"
                          f"{demographics['country']}]")

            session_status = "failed"
            goal_result = {}
            context = None

            for attempt in range(self.config.max_retries_per_session + 1):
                if self.stop_event.is_set():
                    break
                try:
                    self._log(f"{log_prefix}: Starting (Attempt {attempt + 1})")
                    context = await self._create_browser_context(playwright, profile_id, demographics)
                    if not context:
                        raise PlaywrightError("Context creation failed.")

                    goal_result = await self._execute_session_logic(context, persona, profile_id)
                    
                    session_status = "successful"
                    self.session_stats["successful"] += 1
                    self._log(f"{log_prefix}: Success (duration: {time.time() - start_time:.1f}s)")
                    break 
                except (PlaywrightTimeoutError, PlaywrightError) as e:
                    msg = str(e).splitlines()[0]
                    self._log(f"{log_prefix}: Attempt {attempt + 1} failed - {type(e).__name__}: {msg}", level="warning")
                    if attempt >= self.config.max_retries_per_session:
                        self.session_stats["failed"] += 1
                        self._log(f"{log_prefix}: Max retries reached.", level="error")
                except Exception:
                    self.session_stats["failed"] += 1
                    self._log(f"{log_prefix}: Critical failure.", level="error", exc_info=True)
                    break
                finally:
                    if context:
                        await context.browser.close()

            duration = time.time() - start_time
            if session_status == "successful":
                self.session_stats["total_duration"] += duration

            self.session_stats["completed"] += 1

    async def run(self):
        """Triggers the execution of all configured sessions with responsive stop functionality."""
        self._log("Starting generator process...")
        start_time = time.time()
        
        async with async_playwright() as playwright:
            tasks = [
                asyncio.create_task(self._run_single_session(playwright, i + 1))
                for i in range(self.config.total_sessions)
            ]
            
            # Wait for tasks to complete or for the stop event to be set
            await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)

            # If stop was triggered, cancel remaining tasks
            if self.stop_event.is_set():
                self._log("Stop command received, cancelling running sessions...", level="warning")
                for task in tasks:
                    if not task.done():
                        task.cancel()
                # Wait for cancellations to propagate
                await asyncio.gather(*tasks, return_exceptions=True)

        total_duration = time.time() - start_time
        self._log(f"All sessions have been completed or stopped in {total_duration:.2f} seconds.")
        avg_duration = (self.session_stats['total_duration'] / self.session_stats['successful']) if self.session_stats['successful'] > 0 else 0
        self._log(f"Run stats: {self.session_stats['successful']} successful, "
                  f"{self.session_stats['failed']} failed. "
                  f"Avg session duration: {avg_duration:.2f}s")

    def stop(self):
        """Signals the generator to stop all running sessions gracefully."""
        if not self.stop_event.is_set():
            self._log("Stop signal received. Gracefully shutting down...", level="info")
            self.stop_event.set()
