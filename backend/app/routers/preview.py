import logging
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup
from fastapi import APIRouter, HTTPException, Query

logger = logging.getLogger("whispr.preview")

router = APIRouter(tags=["preview"])


@router.get("/api/preview")
async def link_preview(url: str = Query(..., min_length=1)):
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(status_code=400, detail="Invalid URL scheme")

    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "Whispr/1.0"})
            resp.raise_for_status()
    except httpx.RequestError as e:
        logger.warning("Preview fetch failed for %s: %s", url, e)
        raise HTTPException(status_code=502, detail="Failed to fetch URL")

    soup = BeautifulSoup(resp.text, "html.parser")

    title = ""
    description = ""
    image = ""

    og_title = soup.find("meta", property="og:title")
    if og_title and og_title.get("content"):
        title = og_title["content"]
    else:
        t = soup.find("title")
        if t:
            title = t.get_text(strip=True)

    og_desc = soup.find("meta", property="og:description")
    if og_desc and og_desc.get("content"):
        description = og_desc["content"]
    else:
        md = soup.find("meta", attrs={"name": "description"})
        if md and md.get("content"):
            description = md["content"]

    og_image = soup.find("meta", property="og:image")
    if og_image and og_image.get("content"):
        image = og_image["content"]

    return {"title": title, "description": description, "image": image, "url": url}
