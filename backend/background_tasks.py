
import asyncio
import logging
from datetime import datetime
from job_scraper import JobScrapingService, opportunity_cache
from websocket_service import sio

logger = logging.getLogger(__name__)

class BackgroundTaskManager:
    def __init__(self):
        self.running = False
        self.refresh_interval = 1800  # 30 minutes
        
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
                    
            except Exception as e:
                logger.error(f"Error in periodic job refresh: {e}")
                
            # Wait for next refresh
            await asyncio.sleep(self.refresh_interval)

# Global task manager
task_manager = BackgroundTaskManager()
