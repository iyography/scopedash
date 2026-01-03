import os
import json
from datetime import datetime
from dotenv import load_dotenv
from apify_client import ApifyClient

# Load environment variables
load_dotenv()

APIFY_API_KEY = os.getenv("APIFY_API_KEY")
if not APIFY_API_KEY:
    raise ValueError("APIFY_API_KEY not found in .env file")

# Initialize the ApifyClient with your API token
client = ApifyClient(APIFY_API_KEY)

import concurrent.futures

# Base Actor Input Config (Profiles will be injected dynamically)
BASE_ACTOR_INPUT = {
    "excludePinnedPosts": False,
    "oldestPostDateUnified": "60 days",
    "profileScrapeSections": ["videos"],
    "profileSorting": "latest",
    "proxyCountryCode": "None",
    "resultsPerPage": 100,
    "scrapeRelatedVideos": False,
    "shouldDownloadAvatars": True,
    "shouldDownloadCovers": True,
    "shouldDownloadMusicCovers": False,
    "shouldDownloadSlideshowImages": False,
    "shouldDownloadSubtitles": False,
    "shouldDownloadVideos": False
}

PROFILES = [
    "matchupvault",
    "wrestler.trivia",
    "callthemoment",
    "street.slamdown",
    "ragequitguy"
]

def fetch_single_profile(profile):
    """Scrapes a single profile using the Apify actor."""
    print(f"[START] Scraping profile: {profile}")
    
    # Create profile-specific input
    run_input = BASE_ACTOR_INPUT.copy()
    run_input["profiles"] = [profile]
    
    try:
        # Run the Actor and wait for it to finish
        run = client.actor("GdWCkxBtKWOsKjdch").call(run_input=run_input)
        
        # Fetch results from the dataset
        dataset_items = client.dataset(run["defaultDatasetId"]).list_items().items
        print(f"[DONE] Finished {profile}: Found {len(dataset_items)} items")
        return dataset_items
    except Exception as e:
        print(f"[ERROR] Failed to scrape {profile}: {e}")
        return []

def fetch_data():
    print(f"Starting parallel Apify runs for {len(PROFILES)} profiles...")
    
    all_items = []
    
    # Run in parallel using ThreadPoolExecutor
    # We use max_workers=len(PROFILES) to ensure full parallelism
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(PROFILES)) as executor:
        # Submit all jobs
        future_to_profile = {executor.submit(fetch_single_profile, p): p for p in PROFILES}
        
        # Process results as they complete
        for future in concurrent.futures.as_completed(future_to_profile):
            profile = future_to_profile[future]
            try:
                items = future.result()
                all_items.extend(items)
            except Exception as exc:
                print(f"{profile} generated an exception: {exc}")
                
    return all_items

def transform_data(items):
    print("Transforming data...")
    
    processed_data = {
        "metadata": {
            "last_updated": datetime.now().isoformat(),
            "profile_count": len(PROFILES)
        },
        "profiles": {},
        "all_videos": []
    }

    for item in items:
        # We need to distinguish between profile info and video info if they are mixed
        # The actor structure usually returns flat items.
        # Based on typical tiktok-scraper output, let's assume we get video items with author details.
        
        author = item.get("authorMeta", {})
        author_name = author.get("name")
        
        if not author_name:
            continue
            
        # Initialize profile if not exists
        if author_name not in processed_data["profiles"]:
            processed_data["profiles"][author_name] = {
                "name": author_name,
                "nickname": author.get("nickName"),
                "avatar": author.get("avatar"),
                "signature": author.get("signature"),
                "fans": author.get("fans", 0),
                "following": author.get("following", 0),
                "heart": author.get("heart", 0),
                "video": author.get("video", 0),
                "videos": []
            }
        
        # Add video to profile
        video_data = {
            "id": item.get("id"),
            "desc": item.get("text"),
            "createTime": item.get("createTime"),
            "createTimeISO": item.get("createTimeISO"),
            "stats": {
                "diggCount": item.get("diggCount", 0),
                "shareCount": item.get("shareCount", 0),
                "commentCount": item.get("commentCount", 0),
                "playCount": item.get("playCount", 0),
                "collectCount": item.get("collectCount", 0)
            },
            "videoUrl": item.get("webVideoUrl"),
            "coverUrl": item.get("videoMeta", {}).get("coverUrl"),
            "author": author_name
        }
        
        processed_data["profiles"][author_name]["videos"].append(video_data)
        processed_data["all_videos"].append(video_data)

    # Sort all videos by play count (descending)
    processed_data["all_videos"].sort(key=lambda x: x["stats"]["playCount"], reverse=True)
    
    return processed_data

def save_data(data):
    # Ensure directory exists
    output_dir = "dashboard/public"
    os.makedirs(output_dir, exist_ok=True)
    
    output_path = os.path.join(output_dir, "data.json")
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Data saved to {output_path}")

if __name__ == "__main__":
    try:
        raw_items = fetch_data()
        clean_data = transform_data(raw_items)
        save_data(clean_data)
        print("Success!")
    except Exception as e:
        print(f"Error: {e}")
