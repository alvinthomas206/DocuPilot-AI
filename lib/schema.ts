import { z } from "zod";

const stringList = z.array(z.string().max(2000)).max(30);
const evidenceStatus = z.enum(["verified", "inferred", "proposed"]);

export const documentationSchema = z.object({
  projectTitle: z.string().min(1).max(200),
  projectType: z.string().max(100),
  abstract: z.string().min(20).max(8000),
  problemStatement: z.string().min(5).max(5000),
  objectives: stringList,
  scope: stringList,
  targetUsers: stringList,
  technologies: z.array(z.object({
    name: z.string().max(200),
    purpose: z.string().max(1000),
    evidenceFiles: z.array(z.string().max(500)).max(30)
  })).max(40),
  architecture: z.object({
    overview: z.string().max(6000),
    diagram: z.string().max(12000),
    components: z.array(z.object({
      name: z.string().max(200),
      responsibility: z.string().max(1500),
      inputs: stringList,
      outputs: stringList,
      sourceFiles: z.array(z.string().max(500)).max(30),
      evidenceStatus
    })).max(30)
  }),
  modules: z.array(z.object({
    name: z.string().max(200),
    description: z.string().max(2000),
    responsibilities: stringList,
    inputs: stringList,
    outputs: stringList,
    sourceFiles: z.array(z.string().max(500)).max(30),
    evidenceStatus
  })).max(40),
  functionalRequirements: stringList,
  nonFunctionalRequirements: stringList,
  dataFlow: z.string().max(6000),
  testingSuggestions: z.array(z.object({
    scenario: z.string().max(1000),
    expectedResult: z.string().max(1500)
  })).max(40),
  limitations: stringList,
  assumptions: stringList,
  futureScope: stringList,
  conclusion: z.string().max(5000)
});

export type ValidatedDocumentation = z.infer<typeof documentationSchema>;
