"""Ara Automation — connector-backed social posting.

Deploy once:
    ARA_API_KEY=$ARA_API_KEY ara deploy backend/poster.py

The deploy command prints an `app_id` and a runtime key. Copy them into
backend/.env as ARA_APP_ID and ARA_APP_KEY so the FastAPI server can
trigger runs via POST /v1/apps/{app_id}/run.

Before the first real post, make sure LinkedIn and Reddit are connected
on your account at https://app.ara.so — runtime connector tools are
auto-available to Automations (allow_connector_tools=True, the default).
"""

import ara_sdk as ara

ara.Automation(
    "signal-poster",
    system_instructions=(
        "You post a single piece of content to one social platform using the\n"
        "connected Ara connector tools.\n"
        "\n"
        "Your input payload will contain two fields:\n"
        "  platform: either 'linkedin' or 'reddit'\n"
        "  content:  the exact post body\n"
        "\n"
        "Rules:\n"
        "1. If platform == 'linkedin', call LINKEDIN_CREATE_LINKED_IN_POST\n"
        "   with the `content` as the post body. Post to the authenticated\n"
        "   user's feed.\n"
        "2. If platform == 'reddit', call REDDIT_SUBMIT_POST with the\n"
        "   `content` as the selftext body. Use the user's own profile\n"
        "   subreddit ('u_' + authenticated_username) as the target\n"
        "   subreddit, with a short descriptive title derived from the\n"
        "   content (first sentence, max 80 chars).\n"
        "3. Do not edit, shorten, or paraphrase the content — post it\n"
        "   verbatim.\n"
        "4. After the tool call returns, reply with EXACTLY one line of\n"
        "   JSON with keys:\n"
        "     ok (bool), url (string, post URL if known else empty),\n"
        "     error (string, empty on success).\n"
        "   No prose, no markdown fence, no commentary.\n"
    ),
)
