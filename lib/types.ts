export type ModuleInfo = {
  name: string;
  description: string;
  responsibilities: string[];
  inputs: string[];
  outputs: string[];
  sourceFiles: string[];
  evidenceStatus: "verified" | "inferred" | "proposed";
};

export type ProjectDocumentation = {
  projectTitle: string;
  projectType: string;
  abstract: string;
  problemStatement: string;
  objectives: string[];
  scope: string[];
  targetUsers: string[];
  technologies: { name: string; purpose: string; evidenceFiles: string[] }[];
  architecture: {
    overview: string;
    diagram: string;
    components: {
      name: string;
      responsibility: string;
      inputs: string[];
      outputs: string[];
      sourceFiles: string[];
      evidenceStatus: "verified" | "inferred" | "proposed";
    }[];
  };
  modules: ModuleInfo[];
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  dataFlow: string;
  testingSuggestions: { scenario: string; expectedResult: string }[];
  limitations: string[];
  assumptions: string[];
  futureScope: string[];
  conclusion: string;
};

export type ProjectAnalysis = {
  fileCount: number;
  fileTree: string[];
  languages: string[];
  technologies: string[];
  importantFiles: string[];
  dependencySummary: string[];
  sourceContext: string;
  warnings: string[];
};
