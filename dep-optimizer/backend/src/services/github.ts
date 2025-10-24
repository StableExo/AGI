import axios from 'axios';

const GITHUB_API_URL = 'https://api.github.com';

export async function getPackageJson(githubUrl: string): Promise<any> {
  const urlParts = githubUrl.split('/');
  const owner = urlParts[3];
  const repo = urlParts[4];

  if (!owner || !repo) {
    throw new Error('Invalid GitHub URL');
  }

  const apiUrl = `${GITHUB_API_URL}/repos/${owner}/${repo}/contents/package.json`;

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        Accept: 'application/vnd.github.v3.raw',
      },
    });

    return JSON.parse(response.data);
  } catch (error) {
    console.error('Error fetching package.json:', error);
    throw new Error('Could not fetch package.json from the repository');
  }
}
