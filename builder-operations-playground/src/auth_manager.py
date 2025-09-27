
import os

def get_github_pat():
    """Retrieves the GitHub PAT from environment variables."""
    pat = os.getenv('AGI_BUILDER_PAT')
    if not pat:
        raise ValueError("AGI_BUILDER_PAT environment variable not set.")
    return pat

def get_auth_headers():
    """Returns the authorization headers for GitHub API requests."""
    return {'Authorization': f'token {get_github_pat()}'}
