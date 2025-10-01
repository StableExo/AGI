import os


class AuthManager:
    """
    Manages authentication with the GitHub API.

    This class will handle the acquisition, storage, and rotation of
    Personal Access Tokens (PATs) for the Builder AI.
    """

    def __init__(self):
        """
        Initializes the AuthManager and retrieves the primary PAT.
        """
        self.pat = os.environ.get("AGI_BUILDER_PAT")
        if not self.pat:
            raise ValueError("AGI_BUILDER_PAT environment variable not set.")

    def get_pat(self):
        """
        Returns the current Personal Access Token.
        """
        return self.pat