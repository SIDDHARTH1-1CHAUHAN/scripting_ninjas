import asyncio
import os

from redis import Redis
from rq import Queue

from ..services.route_service import RouteRequest, route_service


redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_conn = Redis.from_url(redis_url)
queue = Queue(connection=redis_conn)


def run_route_comparison(params: dict) -> list[dict]:
    """Run a route comparison job in a worker-friendly sync context."""
    request = RouteRequest(**params)
    routes = asyncio.run(route_service.compare_routes(request))
    return [route.model_dump() for route in routes]


def enqueue_route_calculation(params: dict) -> str:
    """Queue a route calculation job."""
    job = queue.enqueue(run_route_comparison, params, job_timeout="5m")
    return job.id


def get_job_result(job_id: str) -> dict:
    """Get result of a queued job."""
    from rq.job import Job

    job = Job.fetch(job_id, connection=redis_conn)
    return {
        "status": job.get_status(),
        "result": job.result if job.is_finished else None,
    }
