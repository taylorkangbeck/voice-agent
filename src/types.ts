export type Flow = {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  steps: FlowStep<any, any>[];
};

export type Action = {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  execute: (input: any) => Promise<any>;
};

export type FlowStep<ActionInput, ActionOutput> = {
  id: string;
  name: string;
  instructions: string;
  action: Action;
  execution?: FlowStepExecution<ActionInput, ActionOutput>;
};

export type FlowExecution = {
  flow: Flow;
  steps: FlowStepExecution<any, any>[];
};

export type FlowStepExecution<ActionInput, ActionOutput> = {
  step: FlowStep<ActionInput, ActionOutput>;
  result?: ActionOutput;
  error?: string;
};
