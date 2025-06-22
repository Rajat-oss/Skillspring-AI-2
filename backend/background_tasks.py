import asyncio
import logging
from datetime import datetime
from job_scraper import JobScrapingService, opportunity_cache
from websocket_service import sio

logger = logging.getLogger(__name__)

import asyncio
import aiohttp
from bs4 import BeautifulSoup
import csv
import os
from datetime import datetime, timedelta
from typing import List, Dict
import json
from youtube_service import YouTubeService
from content_aggregator import ContentAggregator

class JobScraper:
    def __init__(self):
        self.session = None
        self.jobs_file = "data/jobs.csv"
        self.opportunities_file = "data/opportunities.json"
        self.youtube_service = YouTubeService()
        self.content_aggregator = ContentAggregator()

    async def initialize(self):
        """Initialize the session"""
        self.session = aiohttp.ClientSession(
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        )


class BackgroundTaskManager:
    def __init__(self):
        self.running = False
        self.refresh_interval = 1800  # 30 minutes
        self.job_scraper = JobScraper()

    async def start(self):
        """Start background tasks"""
        if not self.running:
            self.running = True
            logger.info("Starting background tasks...")
            asyncio.create_task(self.periodic_job_refresh())

    async def stop(self):
        """Stop background tasks"""
        self.running = False
        logger.info("Stopping background tasks...")

    async def update_learning_content(self):
        """Update learning content from YouTube and other platforms"""
        print("Starting learning content update...")

        try:
            # Update YouTube content
            print("Updating YouTube content...")
            youtube_count = self.job_scraper.youtube_service.update_resources_with_youtube_content()

            # Update content from other platforms
            print("Updating content from other platforms...")
            platform_count = self.job_scraper.content_aggregator.aggregate_all_content()

            total_updated = youtube_count + platform_count
            print(f"Learning content update completed. Added {total_updated} new resources.")

            return total_updated

        except Exception as e:
            print(f"Error updating learning content: {e}")
            return 0
    async def periodic_job_refresh(self):
        """Periodically refresh job data"""
        while self.running:
            try:
                logger.info("Refreshing job opportunities...")

                async with JobScrapingService() as scraper:
                    opportunities = await scraper.fetch_all_opportunities()

                    response_data = {
                        **opportunities,
                        "last_updated": datetime.utcnow().isoformat(),
                        "auto_refreshed": True,
                        "total_count": {
                            "jobs": len(opportunities["jobs"]),
                            "internships": len(opportunities["internships"]),
                            "hackathons": len(opportunities["hackathons"])
                        }
                    }

                    # Update cache
                    opportunity_cache.set("live_opportunities", response_data)

                    # Broadcast update to connected users
                    await sio.emit('opportunities_updated', {
                        "message": "New opportunities available!",
                        "count": response_data["total_count"],
                        "timestamp": datetime.utcnow().isoformat()
                    })

                    logger.info(f"Refreshed {response_data['total_count']} opportunities")

                # Update learning content
                logger.info("Updating learning content...")
                await self.update_learning_content()


            except Exception as e:
                logger.error(f"Error in periodic job refresh: {e}")

            # Wait for next refresh
            await asyncio.sleep(self.refresh_interval)

# Global task manager
task_manager = BackgroundTaskManager()