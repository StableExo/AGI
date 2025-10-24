export interface Dependency {
  name: string;
  version: string;
}

export function parsePackageJson(packageJson: any): {
  dependencies: Dependency[];
  devDependencies: Dependency[];
} {
  const dependencies = packageJson.dependencies
    ? Object.entries(packageJson.dependencies).map(([name, version]) => ({
        name,
        version: version as string,
      }))
    : [];

  const devDependencies = packageJson.devDependencies
    ? Object.entries(packageJson.devDependencies).map(([name, version]) => ({
        name,
        version: version as string,
      }))
    : [];

  return { dependencies, devDependencies };
}
