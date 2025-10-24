import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getPackageJson } from './services/github';
import { parsePackageJson } from './services/parser';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.post('/api/scan', async (req, res) => {
  const { githubUrl } = req.body;

  if (!githubUrl) {
    return res.status(400).json({ error: 'githubUrl is required' });
  }

  const scanId = uuidv4();

  try {
    const packageJson = await getPackageJson(githubUrl);
    const parsedDependencies = parsePackageJson(packageJson);
    res.json({
      scanId,
      status: 'completed',
      results: parsedDependencies,
    });
  } catch (error) {
    res.status(500).json({
      scanId,
      status: 'error',
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
