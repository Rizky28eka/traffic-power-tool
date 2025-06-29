from random import choice, randint, uniform, choices
from typing import Dict, List, Optional, Tuple, Union


class BrowserFingerprint:

    DESKTOP_OS_FINGERPRINTS = {
        "Windows": {
            "user_agents": [
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0",
            ],
            "viewports": [
                {"width": 1920, "height": 1080},
                {"width": 1536, "height": 864},
                {"width": 1366, "height": 768},
            ],
            "hardware_concurrency_range": (4, 16),
            "device_memory_range": (4, 16),
        },
        "macOS": {
            "user_agents": [
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:127.0) Gecko/20100101 Firefox/127.0",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6.0 Safari/605.1.15",
            ],
            "viewports": [
                {"width": 1440, "height": 900},
                {"width": 1920, "height": 1080},
                {"width": 2560, "height": 1440},
            ],
            "hardware_concurrency_range": (6, 16),
            "device_memory_range": (8, 16),
        },
        "Linux": {
            "user_agents": [
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
                "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0",
            ],
            "viewports": [
                {"width": 1600, "height": 900},
                {"width": 1280, "height": 800},
            ],
            "hardware_concurrency_range": (2, 8),
            "device_memory_range": (4, 8),
        },
    }

    MOBILE_FINGERPRINTS = {
        "iPhone": {
            "devices": [
                {"name": "iPhone 15 Pro Max", "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1", "viewport": {"width": 430, "height": 932}, "pixel_ratio": 3},
                {"name": "iPhone 14", "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1", "viewport": {"width": 390, "height": 844}, "pixel_ratio": 3},
            ],
            "hardware_concurrency_range": (4, 8),
            "device_memory_range": (4, 8),
        },
        "Android": {
            "devices": [
                {"name": "Samsung Galaxy S24 Ultra", "user_agent": "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36", "viewport": {"width": 412, "height": 915}, "pixel_ratio": 3.5},
                {"name": "Google Pixel 8", "user_agent": "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36", "viewport": {"width": 384, "height": 854}, "pixel_ratio": 2.75},
            ],
            "hardware_concurrency_range": (6, 8),
            "device_memory_range": (6, 12),
        },
    }

    TABLET_FINGERPRINTS = {
        "iPad": {
            "devices": [
                {"name": "iPad Pro 12.9", "user_agent": "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1", "viewport": {"width": 1024, "height": 1366}, "pixel_ratio": 2},
                {"name": "iPad Air", "user_agent": "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1", "viewport": {"width": 820, "height": 1180}, "pixel_ratio": 2},
            ],
            "hardware_concurrency_range": (4, 8),
            "device_memory_range": (4, 8),
        },
        "Android Tablet": {
            "devices": [
                {"name": "Samsung Galaxy Tab S9", "user_agent": "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36", "viewport": {"width": 800, "height": 1280}, "pixel_ratio": 2},
            ],
            "hardware_concurrency_range": (4, 8),
            "device_memory_range": (4, 8),
        },
    }

    COUNTRY_DATA = {
        "United States": {"locales": ["en-US,en;q=0.9"], "timezones": ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles"], "weight": 20},
        "Indonesia": {"locales": ["id-ID,id;q=0.9,en;q=0.8"], "timezones": ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"], "weight": 15},
        "Japan": {"locales": ["ja-JP,ja;q=0.9,en;q=0.8"], "timezones": ["Asia/Tokyo"], "weight": 10},
        "Spain": {"locales": ["es-ES,es;q=0.9,en;q=0.8"], "timezones": ["Europe/Madrid"], "weight": 8},
        "France": {"locales": ["fr-FR,fr;q=0.9,en;q=0.8"], "timezones": ["Europe/Paris"], "weight": 8},
        "Germany": {"locales": ["de-DE,de;q=0.9,en;q=0.8"], "timezones": ["Europe/Berlin"], "weight": 10},
        "United Kingdom": {"locales": ["en-GB,en;q=0.9"], "timezones": ["Europe/London"], "weight": 10},
        "Brazil": {"locales": ["pt-BR,pt;q=0.9,en;q=0.8"], "timezones": ["America/Sao_Paulo"], "weight": 8},
        "India": {"locales": ["en-IN,en;q=0.9", "hi-IN,hi;q=0.9,en;q=0.8"], "timezones": ["Asia/Kolkata"], "weight": 15},
        "Australia": {"locales": ["en-AU,en;q=0.9"], "timezones": ["Australia/Sydney", "Australia/Perth", "Australia/Melbourne"], "weight": 8},
        "Canada": {"locales": ["en-CA,en;q=0.9", "fr-CA,fr;q=0.9,en;q=0.8"], "timezones": ["America/Toronto", "America/Vancouver"], "weight": 8},
        "Mexico": {"locales": ["es-MX,es;q=0.9,en;q=0.8"], "timezones": ["America/Mexico_City"], "weight": 7},
        "Russia": {"locales": ["ru-RU,ru;q=0.9,en;q=0.8"], "timezones": ["Europe/Moscow"], "weight": 8},
        "China": {"locales": ["zh-CN,zh;q=0.9,en;q=0.8"], "timezones": ["Asia/Shanghai", "Asia/Hong_Kong"], "weight": 15},
        "South Korea": {"locales": ["ko-KR,ko;q=0.9,en;q=0.8"], "timezones": ["Asia/Seoul"], "weight": 8},
    }

    DEFAULT_LOCALE = "en-US,en;q=0.9"
    DEFAULT_TIMEZONE = "America/New_York"
    
    COLOR_SCHEMES = ["light", "dark", "no-preference"]
    REDUCED_MOTION_PREFERENCES = ["no-preference", "reduce"]

    @staticmethod
    def get_country_distribution() -> Dict[str, int]:
        """Returns the country names and their weights for traffic distribution."""
        return {country: data["weight"] for country, data in BrowserFingerprint.COUNTRY_DATA.items()}

    @staticmethod
    def get_random_fingerprint(
        device_type: str = "Desktop",
        country: Optional[str] = None,
        age_range: Optional[Tuple[int, int]] = None,
    ) -> dict:
        """
        Generate a random browser fingerprint based on device type, country, and age range.
        """
        if device_type == "Mobile":
            fingerprint_base = BrowserFingerprint._get_mobile()
        elif device_type == "Tablet":
            fingerprint_base = BrowserFingerprint._get_tablet()
        else:
            fingerprint_base = BrowserFingerprint._get_desktop()

        locale, timezone, country_name = BrowserFingerprint._get_country_data(country)
        
        fingerprint = {
            **fingerprint_base,
            "locale": locale,
            "timezone_id": timezone,
            "country": country_name,
            "color_scheme": choice(BrowserFingerprint.COLOR_SCHEMES),
            "reduced_motion": choice(BrowserFingerprint.REDUCED_MOTION_PREFERENCES),
        }

        if age_range:
            fingerprint["age"] = randint(*age_range)

        return fingerprint

    @staticmethod
    def _get_country_data(country_name: Optional[str] = None) -> Tuple[str, str, str]:
        """Get locale, timezone, and country name for a specific or random country."""
        if country_name and country_name in BrowserFingerprint.COUNTRY_DATA:
            country_info = BrowserFingerprint.COUNTRY_DATA[country_name]
        else:
            countries, weights = zip(*[(k, v["weight"]) for k, v in BrowserFingerprint.COUNTRY_DATA.items()])
            country_name = choices(countries, weights=weights, k=1)[0]
            country_info = BrowserFingerprint.COUNTRY_DATA[country_name]

        locale = choice(country_info["locales"])
        timezone = choice(country_info["timezones"])
        
        return locale, timezone, country_name

    @staticmethod
    def _get_desktop() -> dict:
        os_name, os_details = choice(list(BrowserFingerprint.DESKTOP_OS_FINGERPRINTS.items()))
        return {
            "device_name": os_name,
            "user_agent": choice(os_details["user_agents"]),
            "viewport": choice(os_details["viewports"]),
            "is_mobile": False,
            "has_touch": False,
            "device_scale_factor": 1,
            "hardware_concurrency": randint(*os_details["hardware_concurrency_range"]),
            "device_memory": randint(*os_details["device_memory_range"]),
        }

    @staticmethod
    def _get_mobile() -> dict:
        brand, details = choice(list(BrowserFingerprint.MOBILE_FINGERPRINTS.items()))
        device_info = choice(details["devices"])
        return {
            "device_name": device_info["name"],
            "user_agent": device_info["user_agent"],
            "viewport": device_info["viewport"],
            "is_mobile": True,
            "has_touch": True,
            "device_scale_factor": device_info["pixel_ratio"],
            "hardware_concurrency": randint(*details["hardware_concurrency_range"]),
            "device_memory": randint(*details["device_memory_range"]),
        }

    @staticmethod
    def _get_tablet() -> dict:
        brand, details = choice(list(BrowserFingerprint.TABLET_FINGERPRINTS.items()))
        device_info = choice(details["devices"])
        return {
            "device_name": device_info["name"],
            "user_agent": device_info["user_agent"],
            "viewport": device_info["viewport"],
            "is_mobile": True,
            "has_touch": True,
            "device_scale_factor": device_info["pixel_ratio"],
            "hardware_concurrency": randint(*details["hardware_concurrency_range"]),
            "device_memory": randint(*details["device_memory_range"]),
        }

    @staticmethod
    def add_realistic_delays() -> dict:
        return {
            "typing_delay": randint(50, 150),
            "click_delay": randint(100, 300),
            "scroll_delay": uniform(0.5, 2.0),
            "page_load_wait_min": uniform(2.0, 5.0),
            "page_load_wait_max": uniform(5.0, 10.0),
            "interaction_pause": uniform(1.0, 3.0),
            "human_pause": uniform(0.5, 1.5),
        }
