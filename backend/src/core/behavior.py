# File: src/core/behavior.py

import asyncio
import logging
import time
from random import choice, choices, randint, uniform
from typing import Any, Dict, List, Tuple
from urllib.parse import urljoin, urlparse
from abc import ABC, abstractmethod

from faker import Faker
from playwright.async_api import ElementHandle, Locator, Page, TimeoutError as PlaywrightTimeoutError

from .config import Persona, TrafficConfig
from .fingerprint import BrowserFingerprint

logger = logging.getLogger(__name__)

# --- Mission Strategy Pattern ---

class Mission(ABC):
    """Abstract base class for a persona's mission."""
    def __init__(self, simulator: 'IntelligentBehaviorSimulator', page: Page, persona: Persona, goal: Dict[str, Any]):
        self.simulator = simulator
        self.page = page
        self.persona = persona
        self.goal = goal
        self.result = {"status": "failed", "details": {}, "mission_accomplished": False}

    @abstractmethod
    async def execute(self) -> Dict[str, Any]:
        """Executes the mission and returns the result."""
        pass

    async def _navigate_to_next_page(self) -> bool:
        """Finds and clicks a relevant link to navigate to a new page."""
        scored_links = await self.simulator._score_links(self.page, self.persona)
        if not scored_links:
            logger.info("No relevant links found to continue mission.")
            return False
        
        links, weights = zip(*scored_links)
        chosen_link = choices(links, weights=weights, k=1)[0]
        try:
            await chosen_link.click(delay=self.simulator.delays["click_delay"])
            await self.page.wait_for_load_state("networkidle", timeout=self.simulator.config.navigation_timeout)
            # await self.simulator._capture_ga4_event(self.page, self.profile_id, self.ga4_events, "page_view")
            return True
        except PlaywrightTimeoutError as e:
            logger.warning(f"Failed to navigate to next page during mission: {e}")
            return False

class CollectWebVitalsMission(Mission):
    """Mission to collect web vitals from a series of pages."""
    async def execute(self) -> Dict[str, Any]:
        all_vitals = []
        pages_to_visit = self.goal.get("pages_to_visit", 3)
        for i in range(pages_to_visit):
            vitals = await self.simulator._execute_goal_collect_web_vitals(self.page)
            if vitals:
                all_vitals.append(vitals)
            
            if i < pages_to_visit - 1 and not await self._navigate_to_next_page():
                break
        
        self.result["status"] = "completed"
        self.result["details"]["web_vitals"] = all_vitals
        self.result["mission_accomplished"] = True
        logger.info(f"Mission 'collect_web_vitals' completed. Analyzed {len(all_vitals)} pages.")
        return self.result

class FindAndClickMission(Mission):
    """Mission to find a specific element by text and click it."""
    async def execute(self) -> Dict[str, Any]:
        target_text = self.goal.get("target_text")
        if not target_text:
            self.result["details"]["error_message"] = "Target text for 'find_and_click' not specified."
            return self.result

        target_locator = self.page.locator(f'a:text-matches("{target_text}", "i"), button:text-matches("{target_text}", "i")').first
        try:
            if await target_locator.is_visible(timeout=5000):
                logger.info(f"Target '{target_text}' found, clicking...")
                await target_locator.click(delay=self.simulator.delays["click_delay"])
                await self.page.wait_for_load_state("networkidle", timeout=self.simulator.config.navigation_timeout)
                self.result["status"] = "completed"
                self.result["mission_accomplished"] = True
            else:
                self.result["details"]["error_message"] = f"Target '{target_text}' not found or not visible."
        except PlaywrightTimeoutError:
            self.result["details"]["error_message"] = f"Timed out waiting for target '{target_text}' to be visible."
        return self.result

class FillFormMission(Mission):
    """Mission to find and fill a form."""
    async def execute(self) -> Dict[str, Any]:
        selector = self.goal.get("target_selector", "form:visible")
        form_filled = await self.simulator._handle_form_interaction(self.page, selector)
        if form_filled:
            self.result["status"] = "completed"
            self.result["mission_accomplished"] = True
        else:
            self.result["details"]["error_message"] = "Failed to find or submit the form."
        return self.result

class IntelligentBehaviorSimulator:
    """Simulates user behavior based on a given persona."""

    MISSION_MAPPING = {
        "collect_web_vitals": CollectWebVitalsMission,
        "find_and_click": FindAndClickMission,
        "fill_form": FillFormMission,
    }

    def __init__(self, config: TrafficConfig, mode_type: str = "Bot"):
        self.config = config
        self.mode_type = mode_type or getattr(config, 'mode_type', 'Bot')
        self.faker = Faker(choice(["id_ID", "en_US"]))
        self.delays = BrowserFingerprint.add_realistic_delays() if self.mode_type == "Human" else {
            "typing_delay": 10, "click_delay": 10, "scroll_delay": 0.01,
            "page_load_wait_min": 0.1, "page_load_wait_max": 0.2,
            "interaction_pause": 0.01, "human_pause": 0.01,
        }

    async def _score_links(self, page: Page, persona: Persona) -> List[Tuple[Locator, int]]:
        """Scores visible links based on their relevance to the persona."""
        visible_links = await page.locator("a[href]:visible").all()
        scored_links = []
        base_netloc = urlparse(self.config.target_url).netloc
        keywords_to_check = {**persona.goal_keywords, **persona.generic_keywords}

        for link in visible_links:
            href = await link.get_attribute("href")
            if not href or href.startswith(("mailto:", "tel:")):
                continue
            
            full_url = urljoin(page.url, href)
            if urlparse(full_url).netloc != base_netloc:
                continue

            link_text = (await link.text_content() or "").lower()
            score = sum(weight for keyword, weight in keywords_to_check.items() if keyword in link_text or keyword in full_url.lower())
            
            if score > 0:
                scored_links.append((link, 1 + score))
        
        return sorted(scored_links, key=lambda x: x[1], reverse=True)

    async def _fill_input_element(self, input_elem: Locator):
        """Fills a single input element with data from Faker."""
        if not await input_elem.is_visible(): return
        input_name = (await input_elem.get_attribute("name") or "").lower()
        input_type = (await input_elem.get_attribute("type") or "").lower()
        tag = await input_elem.evaluate("el => el.tagName.toLowerCase()")

        if "email" in input_name or input_type == "email":
            fill_value = self.faker.email()
        elif "name" in input_name:
            fill_value = self.faker.name()
        elif tag == "textarea":
            fill_value = self.faker.paragraph(nb_sentences=randint(2, 4))
        else:
            fill_value = self.faker.company()
        
        await input_elem.fill(fill_value, timeout=5000)
        await asyncio.sleep(self.delays["typing_delay"] / 1000)

    async def _handle_form_interaction(self, page: Page, selector: str) -> bool:
        """Finds, fills, and submits a form. Returns True on success."""
        try:
            form_locator = page.locator(selector).first
            if not await form_locator.is_visible():
                logger.debug(f"No visible form found for selector '{selector}'.")
                return False

            logger.info("Form detected, attempting to interact.")
            for input_type in ["input[type='text']", "input[type='email']", "textarea"]:
                for input_elem in await form_locator.locator(input_type).all():
                    await self._fill_input_element(input_elem)

            submit_button = form_locator.locator("button[type='submit'], input[type='submit']").first
            if await submit_button.is_visible():
                logger.info("Submitting form...")
                await submit_button.click(delay=self.delays["click_delay"])
                await page.wait_for_load_state("networkidle", timeout=15000)
                logger.info("Form submitted successfully.")
                return True
            
            logger.debug("Submit button not found or not visible on the form.")
            return False
        except PlaywrightTimeoutError as e:
            logger.warning(f"Failed to interact with form: {e}", exc_info=True)
            return False

    async def _execute_goal_collect_web_vitals(self, page: Page) -> Dict[str, Any]:
        """Evaluates and returns page performance metrics."""
        try:
            vitals = await page.evaluate("""() => {
                const nav = performance.getEntriesByType('navigation')[0];
                if (!nav) return null;
                const fcp = performance.getEntriesByName('first-contentful-paint')[0];
                return {
                    ttfb: nav.responseStart - nav.requestStart,
                    fcp: fcp ? fcp.startTime : null,
                    domLoad: nav.domContentLoadedEventEnd - nav.startTime,
                    pageLoad: nav.loadEventEnd - nav.startTime
                };
            }""")
            if vitals and all(v is not None for v in vitals.values()):
                logger.info(f"Web vitals collected: TTFB={vitals['ttfb']:.0f}ms, FCP={vitals['fcp']:.0f}ms")
                vitals["url"] = page.url
                return vitals
        except PlaywrightTimeoutError as e:
            logger.warning(f"Could not collect web vitals: {e}")
        return {}

    async def _execute_mission(self, page: Page, persona: Persona) -> dict:
        """Executes the specific mission for the persona."""
        goal = persona.goal
        mission_type = goal.get("type")
        logger.info(f"Starting mission '{mission_type}' for persona '{persona.name}'.")

        mission_class = self.MISSION_MAPPING.get(mission_type)
        if not mission_class:
            logger.warning(f"Unknown mission type: {mission_type}")
            return {"status": "failed", "details": {"error_message": f"Unknown mission type: {mission_type}"}}

        mission = mission_class(self, page, persona, goal)
        try:
            return await mission.execute()
        except Exception as e:
            logger.error(f"An unexpected error occurred during mission '{mission_type}': {e}", exc_info=True)
            return {"status": "failed", "details": {"error_message": str(e)}, "mission_accomplished": False}

    async def _simulate_human_interaction(self, page: Page):
        """Simulates human-like mouse movements and scrolling."""
        if self.mode_type != "Human": return

        viewport = page.viewport_size or {'width': 1920, 'height': 1080}
        
        # Mouse movements
        for _ in range(randint(2, 5)):
            await page.mouse.move(randint(0, viewport['width']-1), randint(0, viewport['height']-1), steps=randint(5, 20))
            await asyncio.sleep(uniform(0.1, 0.4))
        
        # Scrolling
        scroll_amount = 0
        max_scroll = viewport['height'] * uniform(1.0, 2.5)
        while scroll_amount < max_scroll:
            scroll_delta = randint(80, 300)
            await page.mouse.wheel(0, scroll_delta)
            scroll_amount += scroll_delta
            await asyncio.sleep(uniform(0.2, 0.7))

    async def run_standard_navigation(self, page: Page, persona: Persona):
        """Runs standard keyword-based navigation with human-like interactions."""
        logger.info("Starting standard navigation for persona.")
        for i in range(randint(*persona.navigation_depth)):
            await asyncio.sleep(uniform(*persona.avg_time_per_page))
            await self._simulate_human_interaction(page)
            
            if persona.can_fill_forms and uniform(0, 1) < 0.25:
                logger.debug("Attempting random form interaction.")
                await self._handle_form_interaction(page, "form:visible")
            
            scored_links = await self._score_links(page, persona)
            if not scored_links:
                logger.info(f"No relevant links for further navigation on iteration {i+1}.")
                break

            links, weights = zip(*scored_links)
            chosen_link = choices(links, weights=weights, k=1)[0]
            try:
                link_href = await chosen_link.get_attribute("href")
                logger.info(f"Navigating to: {link_href}")
                await chosen_link.hover()
                await asyncio.sleep(uniform(0.2, 0.7))
                await chosen_link.click(delay=self.delays["click_delay"])
                await page.wait_for_load_state("networkidle", timeout=self.config.navigation_timeout)
            except PlaywrightTimeoutError as e:
                logger.warning(f"Failed to click link or load page: {e}. Stopping standard navigation.")
                break
        logger.info("Standard navigation finished.")

    async def run_goal_oriented_session(self, page: Page, persona: Persona) -> dict:
        """Runs a session based on a mission. Falls back to standard navigation on failure."""
        if persona.goal:
            goal_result = await self._execute_mission(page, persona)
            if not goal_result.get("mission_accomplished"):
                error_msg = goal_result.get("details", {}).get("error_message", "Unspecified reason.")
                logger.warning(f"Mission '{persona.goal.get('type', 'Unknown')}' failed: {error_msg}. "
                               "Falling back to standard navigation.")
                await self.run_standard_navigation(page, persona)
            return goal_result
        else:
            logger.info("No specific mission defined. Running standard navigation.")
            await self.run_standard_navigation(page, persona)
            return {"status": "no_goal_specified"}